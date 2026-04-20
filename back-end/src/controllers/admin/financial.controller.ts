import { Response } from "express";
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "../../config/db.ts";
import { AuthRequest } from "../../dtos/auth.ts";
import {
  businessRoles,
  eventLogs,
  hostContents,
  ledgers,
  transactions,
  users,
} from "../../models/schema/index.ts";
import { parseId } from "../../utils/parseId.ts";
import { notificationService } from "../../services/notification.service.ts";
import { hostIncomePolicyService } from "../../services/hostIncomePolicy.service.ts";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const PAYOUT_EVENT_PREFIX = "admin_host_payout";

type PayoutStatus = "pending" | "completed";

const normalizeString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const toNumber = (value: string | number | null | undefined) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parsePagination = (queryPage: unknown, queryLimit: unknown) => {
  const page = Math.max(DEFAULT_PAGE, Number(queryPage) || DEFAULT_PAGE);
  const rawLimit = Number(queryLimit) || DEFAULT_LIMIT;
  const limit = Math.min(MAX_LIMIT, Math.max(1, rawLimit));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

const getPerformedBy = (req: AuthRequest) =>
  normalizeString(req.user?.name) ||
  normalizeString(req.user?.email) ||
  "Quản trị viên hệ thống";

const hostRoleCondition = () =>
  eq(sql`upper(${businessRoles.businessRoleCode})`, "HOST");

const normalizePayoutStatus = (status: string | null | undefined): PayoutStatus => {
  if ((status || "").trim().toLowerCase() === "success") {
    return "completed";
  }

  return "pending";
};

const resolveAudienceLabel = () => "Host";

const resolveSourceTypeLabel = (type: string | null) => {
  switch ((type || "").toLowerCase()) {
    case "article_payout":
      return "Nhuận bút cố định theo bài";
    case "performance_bonus":
      return "Thưởng đạt mốc lượt xem";
    default:
      return "Khoản thu nhập khác";
  }
};

const resolveHostContentStatusLabel = (status: string | null) => {
  switch ((status || "").toLowerCase()) {
    case "published":
      return "Đã duyệt";
    case "pending_admin":
      return "Chờ duyệt";
    case "rejected":
      return "Không được duyệt";
    default:
      return status || "Không xác định";
  }
};

const buildBaseConditions = (req: AuthRequest) => {
  const status = normalizeString(req.query.status).toLowerCase();
  const keyword = normalizeString(req.query.keyword);

  const conditions = [
    eq(transactions.transactionType, "payout"),
    hostRoleCondition(),
  ];

  if (status && status !== "all") {
    if (status === "completed") {
      conditions.push(eq(transactions.transactionStatus, "success"));
    } else if (status === "pending") {
      conditions.push(eq(transactions.transactionStatus, "pending"));
    }
  }

  if (keyword) {
    conditions.push(
      or(
        ilike(users.userDisplayName, `%${keyword}%`),
        ilike(users.userEmail, `%${keyword}%`),
        ilike(users.userMobile, `%${keyword}%`),
        ilike(sql`cast(${transactions.transactionId} as text)`, `%${keyword}%`),
      )!,
    );
  }

  return and(...conditions);
};

const getHostProfiles = async () => {
  const rows = await db
    .select({
      userId: users.userId,
      userName: users.userDisplayName,
      userEmail: users.userEmail,
      userMobile: users.userMobile,
      roleCode: businessRoles.businessRoleCode,
    })
    .from(users)
    .leftJoin(
      businessRoles,
      eq(users.userBusinessRoleId, businessRoles.businessRoleId),
    )
    .where(hostRoleCondition());

  return rows;
};

const syncPendingHostPayouts = async () => {
  const hosts = await getHostProfiles();
  if (hosts.length === 0) {
    return;
  }

  await Promise.all(hosts.map((host) => hostIncomePolicyService.syncForUser(host.userId)));

  const hostIds = hosts.map((host) => host.userId);
  const [ledgerRows, payoutRows] = await Promise.all([
    db
      .select({
        userId: ledgers.ledgerUserId,
        totalEarned:
          sql<string>`COALESCE(SUM(CASE WHEN ${ledgers.ledgerDirection} = 'CREDIT' THEN ${ledgers.ledgerAmount} ELSE 0 END), 0)`,
      })
      .from(ledgers)
      .where(
        and(
          eq(ledgers.ledgerType, "earning"),
          inArray(ledgers.ledgerUserId, hostIds),
        ),
      )
      .groupBy(ledgers.ledgerUserId),
    db
      .select({
        transactionId: transactions.transactionId,
        userId: transactions.transactionUserId,
        amount: transactions.transactionAmount,
        status: transactions.transactionStatus,
        createdAt: transactions.transactionCreatedAt,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.transactionType, "payout"),
          inArray(transactions.transactionUserId, hostIds),
        ),
      )
      .orderBy(desc(transactions.transactionCreatedAt), desc(transactions.transactionId)),
  ]);

  const earnedByUser = new Map(
    ledgerRows.map((item) => [item.userId, toNumber(item.totalEarned)]),
  );

  const payoutsByUser = new Map<
    number,
    Array<{
      transactionId: number;
      amount: number;
      status: string | null;
    }>
  >();

  for (const item of payoutRows) {
    const current = payoutsByUser.get(item.userId) ?? [];
    current.push({
      transactionId: item.transactionId,
      amount: toNumber(item.amount),
      status: item.status,
    });
    payoutsByUser.set(item.userId, current);
  }

  for (const host of hosts) {
    const payouts = payoutsByUser.get(host.userId) ?? [];
    const paidOut = payouts
      .filter((item) => item.status === "success")
      .reduce((sum, item) => sum + item.amount, 0);
    const pendingPayout = payouts.find((item) => item.status === "pending");
    const remainingPayable = Math.max((earnedByUser.get(host.userId) ?? 0) - paidOut, 0);

    if (remainingPayable <= 0 || pendingPayout) {
      continue;
    }

    await db.insert(transactions).values({
      transactionUserId: host.userId,
      transactionAmount: remainingPayable.toFixed(2),
      transactionCurrency: "VND",
      transactionType: "payout",
      transactionStatus: "pending",
      transactionProvider: "bank_transfer",
      transactionMeta: {
        audience: "host",
        note: "Đợt chi trả do hệ thống tổng hợp từ thu nhập Host chưa thanh toán.",
      },
      transactionCreatedAt: new Date(),
      transactionUpdatedAt: new Date(),
    });
  }
};

const getHostPayoutTransactionById = async (transactionId: number) => {
  const [row] = await db
    .select({
      payoutRequestId: transactions.transactionId,
      userId: transactions.transactionUserId,
      amount: transactions.transactionAmount,
      method: transactions.transactionProvider,
      status: transactions.transactionStatus,
      note: sql<string>`${transactions.transactionMeta}->>'note'`,
      createdAt: transactions.transactionCreatedAt,
      updatedAt: transactions.transactionUpdatedAt,
      processedAt: transactions.transactionProcessedAt,
      userName: users.userDisplayName,
      userEmail: users.userEmail,
      userMobile: users.userMobile,
      roleCode: businessRoles.businessRoleCode,
    })
    .from(transactions)
    .leftJoin(users, eq(transactions.transactionUserId, users.userId))
    .leftJoin(
      businessRoles,
      eq(users.userBusinessRoleId, businessRoles.businessRoleId),
    )
    .where(
      and(
        eq(transactions.transactionId, transactionId),
        eq(transactions.transactionType, "payout"),
        hostRoleCondition(),
      ),
    )
    .limit(1);

  return row;
};

const getHostIncomeBreakdown = async (userId: number) => {
  const [earningSummary, payoutSummary, sourceBreakdown, sourceDetails, recentRequests] =
    await Promise.all([
      db
        .select({
          totalEarned:
            sql<string>`COALESCE(SUM(CASE WHEN ${ledgers.ledgerDirection} = 'CREDIT' THEN ${ledgers.ledgerAmount} ELSE 0 END), 0)`,
        })
        .from(ledgers)
        .where(
          and(
            eq(ledgers.ledgerUserId, userId),
            eq(ledgers.ledgerType, "earning"),
          ),
        ),
      db
        .select({
          paidOutAmount:
            sql<string>`COALESCE(SUM(${transactions.transactionAmount}) FILTER (WHERE ${transactions.transactionStatus} = 'success'), 0)`,
          pendingPayoutAmount:
            sql<string>`COALESCE(SUM(${transactions.transactionAmount}) FILTER (WHERE ${transactions.transactionStatus} = 'pending'), 0)`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.transactionUserId, userId),
            eq(transactions.transactionType, "payout"),
          ),
        ),
      db
        .select({
          type: sql<string>`${ledgers.ledgerMeta}->>'type'`,
          amount:
            sql<string>`COALESCE(SUM(CASE WHEN ${ledgers.ledgerDirection} = 'CREDIT' THEN ${ledgers.ledgerAmount} ELSE 0 END), 0)`,
          count: sql<number>`COUNT(*)`,
        })
        .from(ledgers)
        .where(
          and(
            eq(ledgers.ledgerUserId, userId),
            eq(ledgers.ledgerType, "earning"),
          ),
        )
        .groupBy(sql`${ledgers.ledgerMeta}->>'type'`)
        .orderBy(desc(sql`SUM(${ledgers.ledgerAmount})`)),
      db
        .select({
          earningId: ledgers.ledgerId,
          sourceId: ledgers.ledgerReferenceId,
          amount: ledgers.ledgerAmount,
          status: ledgers.ledgerStatus,
          createdAt: ledgers.ledgerCreatedAt,
          sourceType: sql<string>`${ledgers.ledgerMeta}->>'type'`,
          sourceTitle: hostContents.hostContentTitle,
          sourceStatus: hostContents.hostContentStatus,
        })
        .from(ledgers)
        .leftJoin(
          hostContents,
          and(
            eq(ledgers.ledgerReferenceType, "host_content"),
            eq(ledgers.ledgerReferenceId, hostContents.hostContentId),
          ),
        )
        .where(
          and(
            eq(ledgers.ledgerUserId, userId),
            eq(ledgers.ledgerType, "earning"),
          ),
        )
        .orderBy(desc(ledgers.ledgerCreatedAt), desc(ledgers.ledgerId)),
      db
        .select({
          payoutRequestId: transactions.transactionId,
          amount: transactions.transactionAmount,
          status: transactions.transactionStatus,
          createdAt: transactions.transactionCreatedAt,
          processedAt: transactions.transactionProcessedAt,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.transactionUserId, userId),
            eq(transactions.transactionType, "payout"),
          ),
        )
        .orderBy(desc(transactions.transactionCreatedAt), desc(transactions.transactionId))
        .limit(6),
    ]);

  const totalEarned = toNumber(earningSummary?.[0]?.totalEarned);
  const paidOutAmount = toNumber(payoutSummary?.[0]?.paidOutAmount);
  const pendingPayoutAmount = toNumber(payoutSummary?.[0]?.pendingPayoutAmount);

  return {
    earningSummary: {
      totalEarned,
      paidOutAmount,
      pendingBalance: pendingPayoutAmount,
      availableBalance: Math.max(totalEarned - paidOutAmount, 0),
    },
    sourceBreakdown: sourceBreakdown.map((item) => ({
      type: item.type || "other",
      typeLabel: resolveSourceTypeLabel(item.type),
      amount: toNumber(item.amount),
      count: Number(item.count ?? 0),
    })),
    sourceDetails: sourceDetails.map((item) => ({
      earningId: item.earningId,
      sourceId: item.sourceId,
      sourceType: item.sourceType || "other",
      sourceTypeLabel: resolveSourceTypeLabel(item.sourceType),
      sourceTitle:
        normalizeString(item.sourceTitle) ||
        (item.sourceId ? `Nội dung #${item.sourceId}` : "Khoản thu nhập nội bộ"),
      sourceStatus: item.sourceStatus,
      sourceStatusLabel: resolveHostContentStatusLabel(item.sourceStatus),
      amount: toNumber(item.amount),
      createdAt: item.createdAt,
      payerName: "GreenMarket",
      payerEmail: null,
      payerMobile: null,
      payerLabel: "Đơn vị ghi nhận",
      shopName: null,
      fundingStatus: "recorded",
      fundingStatusLabel: "Đã ghi nhận trong hệ thống",
      fundingNote:
        item.sourceType === "performance_bonus"
          ? "Khoản này là thưởng cố định khi bài Host đạt mốc lượt xem đã cấu hình."
          : "Khoản này là nhuận bút cố định cho bài Host đã được admin duyệt.",
    })),
    recentRequests: recentRequests.map((item) => ({
      payoutRequestId: item.payoutRequestId,
      amount: toNumber(item.amount),
      status: normalizePayoutStatus(item.status),
      createdAt: item.createdAt,
      processedAt: item.processedAt,
    })),
  };
};

const processPayoutRequestStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const requestId = parseId(req.params.id as string);
    const normalizedStatus = normalizeString(req.body?.status).toLowerCase();
    const adminNote = normalizeString(req.body?.adminNote);

    if (!requestId) {
      res.status(400).json({ error: "ID đợt chi trả không hợp lệ." });
      return;
    }

    if (normalizedStatus && normalizedStatus !== "completed") {
      res.status(400).json({
        error: "Luồng chi trả Host mới chỉ hỗ trợ xác nhận đã chi trả.",
      });
      return;
    }

    const request = await getHostPayoutTransactionById(requestId);
    if (!request) {
      res.status(404).json({ error: "Không tìm thấy đợt chi trả Host." });
      return;
    }

    if (request.status === "success") {
      res.status(400).json({ error: "Đợt chi trả này đã được xác nhận trước đó." });
      return;
    }

    const performedBy = getPerformedBy(req);
    const [updated] = await db
      .update(transactions)
      .set({
        transactionStatus: "success",
        transactionProcessedAt: new Date(),
        transactionUpdatedAt: new Date(),
        transactionMeta: {
          ...(request.note ? { note: request.note } : {}),
          adminNote,
          performedBy,
          audience: "host",
        },
      })
      .where(eq(transactions.transactionId, requestId))
      .returning();

    await notificationService.sendNotification({
      recipientId: request.userId,
      title: "Thu nhập Host đã được chi trả",
      message: `GreenMarket đã xác nhận chuyển khoản ${toNumber(request.amount).toLocaleString("vi-VN")} VND cho thu nhập Host của bạn.`,
      type: "success",
      metaData: {
        source: "admin_financial",
        payoutRequestId: requestId,
        payoutStatus: "completed",
      },
    });

    await db.insert(eventLogs).values({
      eventLogEventType: `${PAYOUT_EVENT_PREFIX}_completed`,
      eventLogEventTime: new Date(),
      eventLogUserId: request.userId,
      eventLogMeta: {
        payoutRequestId: requestId,
        requesterId: request.userId,
        requesterName:
          normalizeString(request.userName) ||
          normalizeString(request.userEmail) ||
          `Host #${request.userId}`,
        amount: toNumber(request.amount),
        method: request.method,
        previousStatus: request.status,
        nextStatus: "success",
        adminNote,
        performedBy,
      },
    });

    res.json({
      message: "Đã xác nhận hoàn tất chi trả cho Host.",
      data: updated,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Không thể xác nhận chi trả Host." });
  }
};

export const getAllPayoutRequests = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    await syncPendingHostPayouts();
    const { page, limit, offset } = parsePagination(req.query.page, req.query.limit);
    const whereClause = buildBaseConditions(req);

    const rows = await db
      .select({
        payoutRequestId: transactions.transactionId,
        userId: transactions.transactionUserId,
        userName: users.userDisplayName,
        userEmail: users.userEmail,
        userMobile: users.userMobile,
        roleCode: businessRoles.businessRoleCode,
        amount: transactions.transactionAmount,
        method: transactions.transactionProvider,
        status: transactions.transactionStatus,
        note: sql<string>`${transactions.transactionMeta}->>'note'`,
        createdAt: transactions.transactionCreatedAt,
        processedAt: transactions.transactionProcessedAt,
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.transactionUserId, users.userId))
      .leftJoin(
        businessRoles,
        eq(users.userBusinessRoleId, businessRoles.businessRoleId),
      )
      .where(whereClause)
      .orderBy(desc(transactions.transactionCreatedAt), desc(transactions.transactionId))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .leftJoin(users, eq(transactions.transactionUserId, users.userId))
      .leftJoin(
        businessRoles,
        eq(users.userBusinessRoleId, businessRoles.businessRoleId),
      )
      .where(whereClause);

    const [summary] = await db
      .select({
        totalRequests: sql<number>`count(*)`,
        pendingRequests:
          sql<number>`count(*) filter (where ${transactions.transactionStatus} = 'pending')`,
        completedRequests:
          sql<number>`count(*) filter (where ${transactions.transactionStatus} = 'success')`,
        pendingAmount:
          sql<string>`coalesce(sum(${transactions.transactionAmount}) filter (where ${transactions.transactionStatus} = 'pending'), 0)`,
        completedAmount:
          sql<string>`coalesce(sum(${transactions.transactionAmount}) filter (where ${transactions.transactionStatus} = 'success'), 0)`,
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.transactionUserId, users.userId))
      .leftJoin(
        businessRoles,
        eq(users.userBusinessRoleId, businessRoles.businessRoleId),
      )
      .where(whereClause);

    res.json({
      data: rows.map((row) => ({
        payoutRequestId: row.payoutRequestId,
        userId: row.userId,
        userName:
          normalizeString(row.userName) ||
          normalizeString(row.userEmail) ||
          `Host #${row.userId}`,
        userEmail: row.userEmail,
        userMobile: row.userMobile,
        audienceLabel: resolveAudienceLabel(),
        roleCode: row.roleCode,
        amount: toNumber(row.amount),
        method: row.method || "bank_transfer",
        status: normalizePayoutStatus(row.status),
        note: row.note,
        createdAt: row.createdAt,
        processedAt: row.processedAt,
      })),
      meta: {
        page,
        limit,
        totalItems: Number(countResult?.count ?? 0),
        totalPages: Math.ceil(Number(countResult?.count ?? 0) / limit),
      },
      summary: {
        totalRequests: Number(summary?.totalRequests ?? 0),
        pendingRequests: Number(summary?.pendingRequests ?? 0),
        completedRequests: Number(summary?.completedRequests ?? 0),
        pendingAmount: toNumber(summary?.pendingAmount),
        completedAmount: toNumber(summary?.completedAmount),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Không thể tải danh sách chi trả Host." });
  }
};

export const getPayoutRequestDetail = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const requestId = parseId(req.params.id as string);
    if (!requestId) {
      res.status(400).json({ error: "ID đợt chi trả không hợp lệ." });
      return;
    }

    await syncPendingHostPayouts();
    const detail = await getHostPayoutTransactionById(requestId);
    if (!detail) {
      res.status(404).json({ error: "Không tìm thấy đợt chi trả Host." });
      return;
    }

    await hostIncomePolicyService.syncForUser(detail.userId);
    const hostIncomePolicy = await hostIncomePolicyService.getPolicy();
    const incomeBreakdown = await getHostIncomeBreakdown(detail.userId);

    res.json({
      data: {
        payoutRequestId: detail.payoutRequestId,
        userId: detail.userId,
        userName:
          normalizeString(detail.userName) ||
          normalizeString(detail.userEmail) ||
          `Host #${detail.userId}`,
        userEmail: detail.userEmail,
        userMobile: detail.userMobile,
        audienceLabel: resolveAudienceLabel(),
        roleCode: detail.roleCode,
        amount: toNumber(detail.amount),
        method: detail.method || "bank_transfer",
        status: normalizePayoutStatus(detail.status),
        note: detail.note,
        createdAt: detail.createdAt,
        processedAt: detail.processedAt,
        earningSummary: incomeBreakdown.earningSummary,
        sourceBreakdown: incomeBreakdown.sourceBreakdown,
        sourceDetails: incomeBreakdown.sourceDetails,
        requiresSourceConfirmation: incomeBreakdown.sourceDetails.length > 0,
        approvalHint: `Chính sách hiện hành: mỗi bài Host được admin duyệt sẽ ghi nhận ${hostIncomePolicy.articlePayoutAmount.toLocaleString("vi-VN")} VND; khi bài đạt từ ${hostIncomePolicy.viewBonusThreshold.toLocaleString("vi-VN")} lượt xem sẽ được cộng thêm ${hostIncomePolicy.viewBonusAmount.toLocaleString("vi-VN")} VND. GreenMarket chuyển khoản thủ công ngoài hệ thống và admin chỉ xác nhận lại sau khi đã chi trả.`,
        recentRequests: incomeBreakdown.recentRequests,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Không thể tải chi tiết chi trả Host." });
  }
};

export const approvePayoutRequest = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  await processPayoutRequestStatus(req, res);
};

export const rejectPayoutRequest = async (
  _req: AuthRequest,
  res: Response,
): Promise<void> => {
  res.status(400).json({
    error: "Luồng chi trả Host mới không còn trạng thái từ chối.",
  });
};

export const processPayoutRequest = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  await processPayoutRequestStatus(req, res);
};
