import { Response } from "express";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../../config/db.ts";
import { AuthRequest } from "../../dtos/auth.ts";
import {
  businessRoles,
  earnings,
  eventLogs,
  payoutRequests,
  users,
} from "../../models/schema/index.ts";
import { parseId } from "../../utils/parseId.ts";
import { notificationService } from "../../services/notification.service.ts";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const PAYOUT_EVENT_PREFIX = "admin_payout_request";

type PayoutStatus = "pending" | "completed" | "rejected";

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

const getPerformedBy = (req: AuthRequest) => {
  return (
    normalizeString(req.user?.name) ||
    normalizeString(req.user?.email) ||
    "Quản trị viên hệ thống"
  );
};

const resolveAudienceLabel = (
  roleCode: string | null,
  roleTitle: string | null,
) => {
  const normalizedRoleCode = (roleCode || "").toUpperCase();

  if (normalizedRoleCode === "HOST") {
    return "Host";
  }

  if (normalizedRoleCode === "COLLABORATOR") {
    return "Cộng tác viên";
  }

  return roleTitle || "Người dùng";
};

const resolveAudienceFilter = (audience: string) => {
  if (audience === "host") {
    return eq(sql`upper(${businessRoles.businessRoleCode})`, "HOST");
  }

  if (audience === "collaborator") {
    return eq(sql`upper(${businessRoles.businessRoleCode})`, "COLLABORATOR");
  }

  return undefined;
};

const buildBaseConditions = (req: AuthRequest) => {
  const status = normalizeString(req.query.status).toLowerCase();
  const audience = normalizeString(req.query.audience).toLowerCase();
  const keyword = normalizeString(req.query.keyword);

  const conditions = [];

  if (status && status !== "all") {
    conditions.push(eq(payoutRequests.payoutRequestStatus, status));
  }

  const audienceCondition = resolveAudienceFilter(audience);
  if (audienceCondition) {
    conditions.push(audienceCondition);
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

  return conditions.length > 0 ? and(...conditions) : undefined;
};

const buildNotificationMessage = (
  status: Exclude<PayoutStatus, "pending">,
  amount: number,
  adminNote: string,
) => {
  if (status === "completed") {
    return `Yêu cầu rút ${amount.toLocaleString("vi-VN")} VND của bạn đã được quản trị viên xác nhận hoàn thành.`;
  }

  return adminNote
    ? `Yêu cầu rút tiền của bạn đã bị từ chối. Lý do: ${adminNote}`
    : "Yêu cầu rút tiền của bạn đã bị từ chối. Vui lòng liên hệ quản trị viên để biết thêm chi tiết.";
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
      res.status(400).json({ error: "ID yêu cầu rút tiền không hợp lệ." });
      return;
    }

    const [request] = await db
      .select({
        payoutRequestId: payoutRequests.payoutRequestId,
        userId: payoutRequests.payoutRequestUserId,
        amount: payoutRequests.payoutRequestAmount,
        status: payoutRequests.payoutRequestStatus,
        method: payoutRequests.payoutRequestMethod,
        note: payoutRequests.payoutRequestNote,
        userName: users.userDisplayName,
        userEmail: users.userEmail,
      })
      .from(payoutRequests)
      .leftJoin(users, eq(payoutRequests.payoutRequestUserId, users.userId))
      .where(eq(payoutRequests.payoutRequestId, requestId))
      .limit(1);

    if (!request) {
      res.status(404).json({ error: "Không tìm thấy yêu cầu rút tiền." });
      return;
    }

    if (request.status !== "pending") {
      res
        .status(400)
        .json({ error: "Chỉ có thể xử lý các yêu cầu đang ở trạng thái chờ." });
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
          ? "Yêu cầu rút tiền đã hoàn thành"
          : "Yêu cầu rút tiền bị từ chối",
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
          `Người dùng #${request.userId}`,
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
          ? "Đã xác nhận hoàn thành yêu cầu rút tiền."
          : "Đã từ chối yêu cầu rút tiền.",
      data: updated,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Không thể xử lý yêu cầu rút tiền." });
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
        roleTitle: businessRoles.businessRoleTitle,
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
          `Người dùng #${row.userId}`,
        userEmail: row.userEmail,
        userMobile: row.userMobile,
        audienceLabel: resolveAudienceLabel(row.roleCode, row.roleTitle),
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
    res.status(500).json({ error: "Không thể tải danh sách chi trả." });
  }
};

export const getPayoutRequestDetail = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const requestId = parseId(req.params.id as string);

    if (!requestId) {
      res.status(400).json({ error: "ID yêu cầu rút tiền không hợp lệ." });
      return;
    }

    const [detail] = await db
      .select({
        payoutRequestId: payoutRequests.payoutRequestId,
        userId: payoutRequests.payoutRequestUserId,
        userName: users.userDisplayName,
        userEmail: users.userEmail,
        userMobile: users.userMobile,
        roleCode: businessRoles.businessRoleCode,
        roleTitle: businessRoles.businessRoleTitle,
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
      .where(eq(payoutRequests.payoutRequestId, requestId))
      .limit(1);

    if (!detail) {
      res.status(404).json({ error: "Không tìm thấy yêu cầu rút tiền." });
      return;
    }

    const [earningSummary] = await db
      .select({
        totalEarned: sql<string>`coalesce(sum(${earnings.amount}), 0)`,
        availableBalance:
          sql<string>`coalesce(sum(${earnings.amount}) filter (where ${earnings.status} = 'available'), 0)`,
        pendingBalance:
          sql<string>`coalesce(sum(${earnings.amount}) filter (where ${earnings.status} = 'pending'), 0)`,
      })
      .from(earnings)
      .where(eq(earnings.userId, detail.userId));

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
          `Người dùng #${detail.userId}`,
        userEmail: detail.userEmail,
        userMobile: detail.userMobile,
        audienceLabel: resolveAudienceLabel(detail.roleCode, detail.roleTitle),
        roleCode: detail.roleCode,
        amount: Number(detail.amount ?? 0),
        method: detail.method,
        status: detail.status,
        note: detail.note,
        createdAt: detail.createdAt,
        processedAt: detail.processedAt,
        earningSummary: {
          totalEarned: Number(earningSummary?.totalEarned ?? 0),
          availableBalance: Number(earningSummary?.availableBalance ?? 0),
          pendingBalance: Number(earningSummary?.pendingBalance ?? 0),
        },
        sourceBreakdown: sourceBreakdown.map((item) => ({
          type: item.type,
          amount: Number(item.amount ?? 0),
          count: Number(item.count ?? 0),
        })),
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
    res.status(500).json({ error: "Không thể tải chi tiết yêu cầu rút tiền." });
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
