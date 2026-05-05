import { Response } from "express";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../../config/db.ts";
import { AuthRequest } from "../../dtos/auth";
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

const parseBooleanFlag = (value: unknown): boolean | null => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }

  return null;
};

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
      availableBalance: Math.max(totalEarned - paidOutAmount - pendingPayoutAmount, 0),
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

const getHostPayoutBalance = async (userId: number) => {
  await hostIncomePolicyService.syncForUser(userId);
  const breakdown = await getHostIncomeBreakdown(userId);
  const { totalEarned, paidOutAmount, pendingBalance } = breakdown.earningSummary;

  return {
    ...breakdown.earningSummary,
    availableBalance: Math.max(totalEarned - paidOutAmount - pendingBalance, 0),
  };
};

export const getHostPayoutCandidates = async (
  _req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const hostRows = await db
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
      .where(hostRoleCondition())
      .orderBy(users.userDisplayName, users.userId);

    const data = await Promise.all(
      hostRows.map(async (host) => {
        const balance = await getHostPayoutBalance(host.userId);
        return {
          userId: host.userId,
          userName:
            normalizeString(host.userName) ||
            normalizeString(host.userEmail) ||
            `Host #${host.userId}`,
          userEmail: host.userEmail,
          userMobile: host.userMobile,
          roleCode: host.roleCode,
          totalEarned: balance.totalEarned,
          paidOutAmount: balance.paidOutAmount,
          pendingAmount: balance.pendingBalance,
          availableBalance: balance.availableBalance,
        };
      }),
    );

    res.json({ data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Không thể tải danh sách Host để tạo chi trả." });
  }
};

export const createPayoutRequest = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = Number(req.body?.userId);
    const amount = toNumber(req.body?.amount);
    const method = normalizeString(req.body?.method) || "bank_transfer";
    const note = normalizeString(req.body?.note);
    const parsedMarkAsPaid = parseBooleanFlag(req.body?.markAsPaid);
    const markAsPaid =
      typeof req.body?.markAsPaid === "undefined" ? false : parsedMarkAsPaid;

    if (!Number.isInteger(userId) || userId <= 0) {
      res.status(400).json({ error: "Vui lòng chọn Host cần chi trả." });
      return;
    }

    if (markAsPaid === null) {
      res.status(400).json({
        error: "Trạng thái đánh dấu đã chi trả không hợp lệ.",
      });
      return;
    }

    if (amount <= 0) {
      res.status(400).json({ error: "Số tiền chi trả phải lớn hơn 0 VND." });
      return;
    }

    const [host] = await db
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
      .where(and(eq(users.userId, userId), hostRoleCondition()))
      .limit(1);

    if (!host) {
      res.status(404).json({ error: "Không tìm thấy tài khoản Host hợp lệ." });
      return;
    }

    const balance = await getHostPayoutBalance(userId);
    if (amount > balance.availableBalance) {
      res.status(400).json({
        error: `Số tiền chi trả không được vượt quá số dư khả dụng ${balance.availableBalance.toLocaleString("vi-VN")} VND.`,
      });
      return;
    }

    const now = new Date();
    const performedBy = getPerformedBy(req);
    const status = markAsPaid ? "success" : "pending";
    const [created] = await db
      .insert(transactions)
      .values({
        transactionUserId: userId,
        transactionAmount: amount.toFixed(2),
        transactionCurrency: "VND",
        transactionType: "payout",
        transactionStatus: status,
        transactionProvider: method,
        transactionReferenceType: "admin_host_payout",
        transactionMeta: {
          audience: "host",
          note: note || "Khoản chi trả Host do admin tạo.",
          adminCreated: true,
          createdBy: performedBy,
          createdAt: now.toISOString(),
          balanceSnapshot: {
            totalEarned: balance.totalEarned,
            paidOutAmount: balance.paidOutAmount,
            pendingAmount: balance.pendingBalance,
            availableBeforeCreate: balance.availableBalance,
            payoutAmount: amount,
          },
        },
        transactionCreatedAt: now,
        transactionUpdatedAt: now,
        transactionProcessedAt: markAsPaid ? now : null,
      })
      .returning();

    if (markAsPaid) {
      await notificationService.sendNotification({
        recipientId: userId,
        title: "Thu nhập Host đã được chi trả",
        message: `GreenMarket đã xác nhận chuyển khoản ${amount.toLocaleString("vi-VN")} VND cho khoản chi trả Host của bạn.`,
        type: "success",
        metaData: {
          source: "admin_financial",
          payoutRequestId: created.transactionId,
          payoutStatus: "completed",
        },
      });
    }

    await db.insert(eventLogs).values({
      eventLogEventType: `${PAYOUT_EVENT_PREFIX}_created`,
      eventLogEventTime: now,
      eventLogUserId: userId,
      eventLogTargetType: "admin_host_payout",
      eventLogTargetId: created.transactionId,
      eventLogMeta: {
        payoutRequestId: created.transactionId,
        requesterId: userId,
        requesterName:
          normalizeString(host.userName) ||
          normalizeString(host.userEmail) ||
          `Host #${userId}`,
        amount,
        method,
        status,
        note,
        performedBy,
      },
    });

    res.status(201).json({
      message: markAsPaid
        ? "Đã tạo khoản chi trả và đánh dấu đã chi trả cho Host."
        : "Đã tạo khoản chi trả Host ở trạng thái chờ chi trả.",
      data: created,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Không thể tạo khoản chi trả Host." });
  }
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
      res.status(400).json({ error: "ID khoản chi trả không hợp lệ." });
      return;
    }

    if (normalizedStatus && normalizedStatus !== "completed") {
      res.status(400).json({
        error: "Luồng chi trả Host chỉ hỗ trợ xác nhận khoản chi trả đã được thanh toán.",
      });
      return;
    }

    const request = await getHostPayoutTransactionById(requestId);
    if (!request) {
      res.status(404).json({ error: "Không tìm thấy khoản chi trả Host." });
      return;
    }

    if (request.status === "success") {
      res.status(400).json({ error: "Khoản chi trả này đã được xác nhận trước đó." });
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
      message: `GreenMarket đã xác nhận chuyển khoản ${toNumber(request.amount).toLocaleString("vi-VN")} VND cho khoản chi trả Host của bạn.`,
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
      message: "Đã xác nhận hoàn tất khoản chi trả cho Host.",
      data: updated,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Không thể xác nhận khoản chi trả Host." });
  }
};

export const getAllPayoutRequests = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
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
    res.status(500).json({ error: "Không thể tải danh sách khoản chi trả Host." });
  }
};

export const getPayoutRequestDetail = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const requestId = parseId(req.params.id as string);
    if (!requestId) {
      res.status(400).json({ error: "ID khoản chi trả không hợp lệ." });
      return;
    }

    const detail = await getHostPayoutTransactionById(requestId);
    if (!detail) {
      res.status(404).json({ error: "Không tìm thấy khoản chi trả Host." });
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
    res.status(500).json({ error: "Không thể tải chi tiết khoản chi trả Host." });
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
    error: "Khoản chi trả Host không dùng trạng thái từ chối. Admin chỉ tạo khoản chi trả và đánh dấu đã chi trả khi hoàn tất chuyển khoản.",
  });
};

export const processPayoutRequest = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  await processPayoutRequestStatus(req, res);
};
