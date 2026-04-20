import { Response } from "express";
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "../../config/db.ts";
import { AuthRequest } from "../../dtos/auth.ts";
import {
  businessRoles,
  earnings,
  eventLogs,
  hostContents,
  payoutRequests,
  users,
} from "../../models/schema/index.ts";
import { parseId } from "../../utils/parseId.ts";
import { notificationService } from "../../services/notification.service.ts";
import { hostIncomePolicyService } from "../../services/hostIncomePolicy.service.ts";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const PAYOUT_EVENT_PREFIX = "admin_payout_request";

type PayoutStatus = "pending" | "completed" | "rejected";
type FundingStatus = "system_managed" | "not_required" | "recorded";

type ProcessPayload = {
  adminNote?: string;
};

const normalizeString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

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

const resolveAudienceLabel = () => "Host";

const buildBaseConditions = (req: AuthRequest) => {
  const status = normalizeString(req.query.status).toLowerCase();
  const keyword = normalizeString(req.query.keyword);

  const conditions = [hostRoleCondition()];

  if (status && status !== "all") {
    conditions.push(eq(payoutRequests.payoutRequestStatus, status));
  }

  if (keyword) {
    conditions.push(
      or(
        ilike(users.userDisplayName, `%${keyword}%`),
        ilike(users.userEmail, `%${keyword}%`),
        ilike(users.userMobile, `%${keyword}%`),
        ilike(sql`cast(${payoutRequests.payoutRequestId} as text)`, `%${keyword}%`),
      )!,
    );
  }

  return and(...conditions);
};

const buildNotificationMessage = (
  status: Exclude<PayoutStatus, "pending">,
  amount: number,
  adminNote: string,
) => {
  if (status === "completed") {
    return `Yêu cầu nhận nhuận bút ${amount.toLocaleString("vi-VN")} VND của bạn đã được admin xác nhận hoàn thành.`;
  }

  return adminNote
    ? `Yêu cầu nhận nhuận bút của bạn đã bị từ chối. Lý do: ${adminNote}`
    : "Yêu cầu nhận nhuận bút của bạn đã bị từ chối. Vui lòng liên hệ admin để biết thêm chi tiết.";
};

const resolveSourceTypeLabel = (type: string | null) => {
  switch ((type || "").toLowerCase()) {
    case "article_payout":
      return "Nhuận bút nội dung";
    case "performance_bonus":
      return "Thưởng hiệu suất";
    default:
      return "Nguồn thu khác";
  }
};

const resolveHostContentStatusLabel = (status: string | null) => {
  switch ((status || "").toLowerCase()) {
    case "published":
      return "Đã xuất bản";
    case "pending_admin":
      return "Chờ duyệt";
    case "rejected":
      return "Bị từ chối";
    default:
      return status || "Không xác định";
  }
};

const resolveFundingStatusLabel = (status: FundingStatus) => {
  if (status === "system_managed") {
    return "Hệ thống tự chi trả";
  }

  return "Không cần đối soát thêm";
};

const getHostPayoutRequestById = async (requestId: number) => {
  const [request] = await db
    .select({
      payoutRequestId: payoutRequests.payoutRequestId,
      userId: payoutRequests.payoutRequestUserId,
      amount: payoutRequests.payoutRequestAmount,
      status: payoutRequests.payoutRequestStatus,
      method: payoutRequests.payoutRequestMethod,
      note: payoutRequests.payoutRequestNote,
      createdAt: payoutRequests.payoutRequestCreatedAt,
      processedAt: payoutRequests.payoutRequestProcessedAt,
      userName: users.userDisplayName,
      userEmail: users.userEmail,
      userMobile: users.userMobile,
      roleCode: businessRoles.businessRoleCode,
    })
    .from(payoutRequests)
    .leftJoin(users, eq(payoutRequests.payoutRequestUserId, users.userId))
    .leftJoin(
      businessRoles,
      eq(users.userBusinessRoleId, businessRoles.businessRoleId),
    )
    .where(and(eq(payoutRequests.payoutRequestId, requestId), hostRoleCondition()))
    .limit(1);

  return request;
};

const processPayoutRequestStatus = async (
  req: AuthRequest,
  res: Response,
  nextStatus: Exclude<PayoutStatus, "pending">,
): Promise<void> => {
  try {
    const requestId = parseId(req.params.id as string);
    const { adminNote = "" } = req.body as ProcessPayload;
    const normalizedNote = normalizeString(adminNote);

    if (!requestId) {
      res.status(400).json({ error: "ID yêu cầu không hợp lệ." });
      return;
    }

    const request = await getHostPayoutRequestById(requestId);

    if (!request) {
      res.status(404).json({ error: "Không tìm thấy yêu cầu nhuận bút Host." });
      return;
    }

    if (request.status !== "pending") {
      res.status(400).json({
        error: "Chỉ có thể xử lý các yêu cầu đang ở trạng thái chờ.",
      });
      return;
    }

    if (nextStatus === "rejected" && !normalizedNote) {
      res.status(400).json({ error: "Vui lòng nhập lý do từ chối." });
      return;
    }

    const [updated] = await db
      .update(payoutRequests)
      .set({
        payoutRequestStatus: nextStatus,
        payoutRequestNote: normalizedNote || request.note,
        payoutRequestProcessedAt: new Date(),
      })
      .where(eq(payoutRequests.payoutRequestId, requestId))
      .returning();

    const amountValue = Number(request.amount ?? 0);
    const performedBy = getPerformedBy(req);

    await notificationService.sendNotification({
      recipientId: request.userId,
      title:
        nextStatus === "completed"
          ? "Yêu cầu nhuận bút đã hoàn thành"
          : "Yêu cầu nhuận bút bị từ chối",
      message: buildNotificationMessage(nextStatus, amountValue, normalizedNote),
      type: nextStatus === "completed" ? "success" : "warning",
      metaData: {
        source: "admin_financial",
        payoutRequestId: requestId,
        payoutStatus: nextStatus,
      },
    });

    await db.insert(eventLogs).values({
      eventLogEventType: `${PAYOUT_EVENT_PREFIX}_${nextStatus}`,
      eventLogEventTime: new Date(),
      eventLogUserId: request.userId,
      eventLogMeta: {
        payoutRequestId: requestId,
        requesterId: request.userId,
        requesterName:
          normalizeString(request.userName) ||
          normalizeString(request.userEmail) ||
          `Host #${request.userId}`,
        amount: amountValue,
        method: request.method,
        previousStatus: request.status,
        nextStatus,
        adminNote: normalizedNote,
        performedBy,
      },
    });

    res.json({
      message:
        nextStatus === "completed"
          ? "Đã xác nhận hoàn thành yêu cầu nhuận bút Host."
          : "Đã từ chối yêu cầu nhuận bút Host.",
      data: updated,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Không thể xử lý yêu cầu nhuận bút Host." });
  }
};

export const getAllPayoutRequests = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { page, limit, offset } = parsePagination(
      req.query.page,
      req.query.limit,
    );
    const whereClause = buildBaseConditions(req);

    const rows = await db
      .select({
        payoutRequestId: payoutRequests.payoutRequestId,
        userId: payoutRequests.payoutRequestUserId,
        userName: users.userDisplayName,
        userEmail: users.userEmail,
        userMobile: users.userMobile,
        roleCode: businessRoles.businessRoleCode,
        amount: payoutRequests.payoutRequestAmount,
        method: payoutRequests.payoutRequestMethod,
        status: payoutRequests.payoutRequestStatus,
        note: payoutRequests.payoutRequestNote,
        createdAt: payoutRequests.payoutRequestCreatedAt,
        processedAt: payoutRequests.payoutRequestProcessedAt,
      })
      .from(payoutRequests)
      .leftJoin(users, eq(payoutRequests.payoutRequestUserId, users.userId))
      .leftJoin(
        businessRoles,
        eq(users.userBusinessRoleId, businessRoles.businessRoleId),
      )
      .where(whereClause)
      .orderBy(desc(payoutRequests.payoutRequestCreatedAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(payoutRequests)
      .leftJoin(users, eq(payoutRequests.payoutRequestUserId, users.userId))
      .leftJoin(
        businessRoles,
        eq(users.userBusinessRoleId, businessRoles.businessRoleId),
      )
      .where(whereClause);

    const [summary] = await db
      .select({
        totalRequests: sql<number>`count(*)`,
        pendingRequests:
          sql<number>`count(*) filter (where ${payoutRequests.payoutRequestStatus} = 'pending')`,
        completedRequests:
          sql<number>`count(*) filter (where ${payoutRequests.payoutRequestStatus} = 'completed')`,
        rejectedRequests:
          sql<number>`count(*) filter (where ${payoutRequests.payoutRequestStatus} = 'rejected')`,
        pendingAmount:
          sql<string>`coalesce(sum(${payoutRequests.payoutRequestAmount}) filter (where ${payoutRequests.payoutRequestStatus} = 'pending'), 0)`,
        completedAmount:
          sql<string>`coalesce(sum(${payoutRequests.payoutRequestAmount}) filter (where ${payoutRequests.payoutRequestStatus} = 'completed'), 0)`,
      })
      .from(payoutRequests)
      .leftJoin(users, eq(payoutRequests.payoutRequestUserId, users.userId))
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
        amount: Number(row.amount ?? 0),
        method: row.method,
        status: row.status,
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
        rejectedRequests: Number(summary?.rejectedRequests ?? 0),
        pendingAmount: Number(summary?.pendingAmount ?? 0),
        completedAmount: Number(summary?.completedAmount ?? 0),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Không thể tải danh sách nhuận bút Host." });
  }
};

export const getPayoutRequestDetail = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const requestId = parseId(req.params.id as string);

    if (!requestId) {
      res.status(400).json({ error: "ID yêu cầu không hợp lệ." });
      return;
    }

    const detail = await getHostPayoutRequestById(requestId);

    if (!detail) {
      res.status(404).json({ error: "Không tìm thấy yêu cầu nhuận bút Host." });
      return;
    }

    await hostIncomePolicyService.syncForUser(detail.userId);
    const hostIncomePolicy = await hostIncomePolicyService.getPolicy();

    const [earningSummary] = await db
      .select({
        totalEarned: sql<string>`coalesce(sum(${earnings.amount}), 0)`,
        availableEarnings:
          sql<string>`coalesce(sum(${earnings.amount}) filter (where ${earnings.status} = 'available'), 0)`,
        pendingIncome:
          sql<string>`coalesce(sum(${earnings.amount}) filter (where ${earnings.status} = 'pending'), 0)`,
      })
      .from(earnings)
      .where(eq(earnings.userId, detail.userId));

    const [payoutLedger] = await db
      .select({
        paidOutAmount:
          sql<string>`coalesce(sum(${payoutRequests.payoutRequestAmount}) filter (where ${payoutRequests.payoutRequestStatus} = 'completed'), 0)`,
        pendingPayoutAmount:
          sql<string>`coalesce(sum(${payoutRequests.payoutRequestAmount}) filter (where ${payoutRequests.payoutRequestStatus} = 'pending'), 0)`,
      })
      .from(payoutRequests)
      .where(eq(payoutRequests.payoutRequestUserId, detail.userId));

    const sourceBreakdown = await db
      .select({
        type: earnings.type,
        amount: sql<string>`coalesce(sum(${earnings.amount}), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(earnings)
      .where(eq(earnings.userId, detail.userId))
      .groupBy(earnings.type)
      .orderBy(desc(sql`sum(${earnings.amount})`));

    const earningEntries = await db
      .select({
        earningId: earnings.earningId,
        amount: earnings.amount,
        status: earnings.status,
        type: earnings.type,
        sourceId: earnings.sourceId,
        createdAt: earnings.createdAt,
      })
      .from(earnings)
      .where(eq(earnings.userId, detail.userId))
      .orderBy(desc(earnings.createdAt), desc(earnings.earningId));

    const hostContentSourceIds = Array.from(
      new Set(
        earningEntries
          .filter((item) => item.type === "article_payout" && item.sourceId)
          .map((item) => Number(item.sourceId)),
      ),
    );

    const hostContentRows =
      hostContentSourceIds.length === 0
        ? []
        : await db
            .select({
              hostContentId: hostContents.hostContentId,
              hostContentTitle: hostContents.hostContentTitle,
              hostContentStatus: hostContents.hostContentStatus,
            })
            .from(hostContents)
            .where(inArray(hostContents.hostContentId, hostContentSourceIds));

    const hostContentById = new Map(
      hostContentRows.map((item) => [
        item.hostContentId,
        {
          title: normalizeString(item.hostContentTitle),
          status: item.hostContentStatus,
        },
      ]),
    );

    const sourceDetails = earningEntries.map((item) => {
      const amount = Number(item.amount ?? 0);
      const sourceType = normalizeString(item.type) || "other";
      const sourceTypeLabel = resolveSourceTypeLabel(item.type);

      if (item.type === "article_payout") {
        const contentSource = hostContentById.get(Number(item.sourceId ?? -1));

        return {
          earningId: item.earningId,
          sourceId: item.sourceId,
          sourceType,
          sourceTypeLabel,
          sourceTitle:
            contentSource?.title ||
            (item.sourceId ? `Nội dung #${item.sourceId}` : "Nội dung chưa xác định"),
          sourceStatus: contentSource?.status || null,
          sourceStatusLabel: resolveHostContentStatusLabel(contentSource?.status || null),
          amount,
          createdAt: item.createdAt,
          payerName: "GreenMarket",
          payerEmail: null,
          payerMobile: null,
          payerLabel: "Đơn vị chi trả",
          shopName: null,
          fundingStatus: "system_managed" as FundingStatus,
          fundingStatusLabel: resolveFundingStatusLabel("system_managed"),
          fundingNote:
            "Khoản này là nhuận bút nội dung Host do GreenMarket tự chi trả sau khi bài được ghi nhận hợp lệ.",
        };
      }

      return {
        earningId: item.earningId,
        sourceId: item.sourceId,
        sourceType,
        sourceTypeLabel,
        sourceTitle: item.sourceId
          ? `Nguồn thu #${item.sourceId}`
          : "Nguồn thu nội bộ",
        sourceStatus: item.status,
        sourceStatusLabel: item.status || "Không xác định",
        amount,
        createdAt: item.createdAt,
        payerName: "GreenMarket",
        payerEmail: null,
        payerMobile: null,
        payerLabel: "Đơn vị ghi nhận",
        shopName: null,
        fundingStatus: "not_required" as FundingStatus,
        fundingStatusLabel: resolveFundingStatusLabel("not_required"),
        fundingNote:
          "Khoản này được GreenMarket ghi nhận nội bộ cho tài khoản Host và không đi qua luồng thanh toán giữa khách hàng với cộng tác viên.",
      };
    });

    const recentRequests = await db
      .select({
        payoutRequestId: payoutRequests.payoutRequestId,
        amount: payoutRequests.payoutRequestAmount,
        status: payoutRequests.payoutRequestStatus,
        createdAt: payoutRequests.payoutRequestCreatedAt,
        processedAt: payoutRequests.payoutRequestProcessedAt,
      })
      .from(payoutRequests)
      .where(eq(payoutRequests.payoutRequestUserId, detail.userId))
      .orderBy(desc(payoutRequests.payoutRequestCreatedAt))
      .limit(6);

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
        amount: Number(detail.amount ?? 0),
        method: detail.method,
        status: detail.status,
        note: detail.note,
        createdAt: detail.createdAt,
        processedAt: detail.processedAt,
        earningSummary: {
          totalEarned: Number(earningSummary?.totalEarned ?? 0),
          availableBalance: Math.max(
            Number(earningSummary?.availableEarnings ?? 0) -
              Number(payoutLedger?.paidOutAmount ?? 0) -
              Number(payoutLedger?.pendingPayoutAmount ?? 0),
            0,
          ),
          pendingBalance: Number(payoutLedger?.pendingPayoutAmount ?? 0),
          pendingIncome: Number(earningSummary?.pendingIncome ?? 0),
          paidOutAmount: Number(payoutLedger?.paidOutAmount ?? 0),
        },
        sourceBreakdown: sourceBreakdown.map((item) => ({
          type: item.type,
          typeLabel: resolveSourceTypeLabel(item.type),
          amount: Number(item.amount ?? 0),
          count: Number(item.count ?? 0),
        })),
        sourceDetails: sourceDetails.map((item) => ({
          ...item,
          amount: Number(item.amount ?? 0),
        })),
        requiresSourceConfirmation: sourceDetails.length > 0,
        approvalHint:
          `Chính sách hiện hành: mỗi bài Host được xuất bản sẽ ghi nhận ${hostIncomePolicy.articlePayoutAmount.toLocaleString("vi-VN")} VND; khi bài đạt từ ${hostIncomePolicy.viewBonusThreshold.toLocaleString("vi-VN")} lượt xem sẽ được cộng thêm ${hostIncomePolicy.viewBonusAmount.toLocaleString("vi-VN")} VND. GreenMarket chuyển khoản thủ công ngoài hệ thống và admin xác nhận lại sau khi đã chi trả.`,
        recentRequests: recentRequests.map((item) => ({
          payoutRequestId: item.payoutRequestId,
          amount: Number(item.amount ?? 0),
          status: item.status,
          createdAt: item.createdAt,
          processedAt: item.processedAt,
        })),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Không thể tải chi tiết nhuận bút Host." });
  }
};

export const approvePayoutRequest = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  await processPayoutRequestStatus(req, res, "completed");
};

export const rejectPayoutRequest = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  await processPayoutRequestStatus(req, res, "rejected");
};

export const processPayoutRequest = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const status = normalizeString(req.body?.status).toLowerCase();

  if (status !== "completed" && status !== "rejected") {
    res.status(400).json({ error: "Trạng thái xử lý không hợp lệ." });
    return;
  }

  await processPayoutRequestStatus(req, res, status);
};
