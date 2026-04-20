import { Response } from "express";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../../config/db.ts";
import { AuthRequest } from "../../dtos/auth.ts";
import {
  eventLogs,
  hostContents,
  users,
} from "../../models/schema/index.ts";
import { parseId } from "../../utils/parseId.ts";
import { notificationService } from "../../services/notification.service.ts";
import { hostIncomePolicyService } from "../../services/hostIncomePolicy.service.ts";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const HOST_CONTENT_EVENT_PREFIX = "admin_host_content";

type HostContentStatus = "pending_admin" | "published" | "rejected";

type UpdateHostContentStatusPayload = {
  status?: string;
  note?: string;
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

const resolveStatusLabel = (status: string | null) => {
  switch ((status || "").toLowerCase()) {
    case "pending_admin":
      return "Chờ duyệt";
    case "published":
      return "Đã xuất bản";
    case "rejected":
      return "Đã từ chối";
    default:
      return "Chưa xác định";
  }
};

const buildWhereClause = (req: AuthRequest) => {
  const keyword = normalizeString(req.query.keyword);
  const status = normalizeString(req.query.status).toLowerCase();
  const category = normalizeString(req.query.category);

  const conditions = [];

  if (status && status !== "all") {
    conditions.push(eq(hostContents.hostContentStatus, status));
  }

  if (category && category !== "all") {
    conditions.push(eq(hostContents.hostContentCategory, category));
  }

  if (keyword) {
    conditions.push(
      or(
        ilike(hostContents.hostContentTitle, `%${keyword}%`),
        ilike(hostContents.hostContentDescription, `%${keyword}%`),
        ilike(users.userDisplayName, `%${keyword}%`),
        ilike(users.userEmail, `%${keyword}%`),
      )!,
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
};

const buildNotification = (
  status: HostContentStatus,
  title: string,
  note: string,
) => {
  if (status === "published") {
    return {
      title: "Nội dung Host đã được duyệt",
      message: `Bài nội dung "${title}" đã được quản trị viên cho phép xuất bản.`,
      type: "success" as const,
    };
  }

  if (status === "rejected") {
    return {
      title: "Nội dung Host bị từ chối",
      message: note
        ? `Bài nội dung "${title}" bị từ chối. Lý do: ${note}`
        : `Bài nội dung "${title}" bị từ chối. Vui lòng kiểm tra lại nội dung.`,
      type: "warning" as const,
    };
  }

  return {
    title: "Nội dung Host được đưa về chờ duyệt",
    message: note
      ? `Bài nội dung "${title}" đã được đưa về trạng thái chờ duyệt. Ghi chú: ${note}`
      : `Bài nội dung "${title}" đã được đưa về trạng thái chờ duyệt.`,
    type: "info" as const,
  };
};

export const getAdminHostContents = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { page, limit, offset } = parsePagination(
      req.query.page,
      req.query.limit,
    );
    const whereClause = buildWhereClause(req);

    const rows = await db
      .select({
        hostContentId: hostContents.hostContentId,
        authorId: hostContents.hostContentAuthorId,
        title: hostContents.hostContentTitle,
        description: hostContents.hostContentDescription,
        category: hostContents.hostContentCategory,
        status: hostContents.hostContentStatus,
        payoutAmount: hostContents.hostContentPayoutAmount,
        viewCount: hostContents.hostContentViewCount,
        createdAt: hostContents.hostContentCreatedAt,
        updatedAt: hostContents.hostContentUpdatedAt,
        mediaUrls: hostContents.hostContentMediaUrls,
        authorName: users.userDisplayName,
        authorEmail: users.userEmail,
      })
      .from(hostContents)
      .leftJoin(users, eq(hostContents.hostContentAuthorId, users.userId))
      .where(whereClause)
      .orderBy(desc(hostContents.hostContentUpdatedAt), desc(hostContents.hostContentCreatedAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(hostContents)
      .leftJoin(users, eq(hostContents.hostContentAuthorId, users.userId))
      .where(whereClause);

    const [summary] = await db
      .select({
        totalContents: sql<number>`count(*)`,
        pendingContents:
          sql<number>`count(*) filter (where ${hostContents.hostContentStatus} = 'pending_admin')`,
        publishedContents:
          sql<number>`count(*) filter (where ${hostContents.hostContentStatus} = 'published')`,
        rejectedContents:
          sql<number>`count(*) filter (where ${hostContents.hostContentStatus} = 'rejected')`,
        totalPayout:
          sql<string>`coalesce(sum(${hostContents.hostContentPayoutAmount}), 0)`,
      })
      .from(hostContents)
      .leftJoin(users, eq(hostContents.hostContentAuthorId, users.userId))
      .where(whereClause);

    res.json({
      data: rows.map((row) => ({
        hostContentId: row.hostContentId,
        authorId: row.authorId,
        title: row.title,
        description: row.description,
        category: row.category || "Khác",
        status: row.status,
        statusLabel: resolveStatusLabel(row.status),
        payoutAmount: Number(row.payoutAmount ?? 0),
        viewCount: Number(row.viewCount ?? 0),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        mediaCount: Array.isArray(row.mediaUrls) ? row.mediaUrls.length : 0,
        authorName:
          normalizeString(row.authorName) ||
          normalizeString(row.authorEmail) ||
          `Host #${row.authorId}`,
        authorEmail: row.authorEmail,
      })),
      meta: {
        page,
        limit,
        totalItems: Number(countResult?.count ?? 0),
        totalPages: Math.ceil(Number(countResult?.count ?? 0) / limit),
      },
      summary: {
        totalContents: Number(summary?.totalContents ?? 0),
        pendingContents: Number(summary?.pendingContents ?? 0),
        publishedContents: Number(summary?.publishedContents ?? 0),
        rejectedContents: Number(summary?.rejectedContents ?? 0),
        totalPayout: Number(summary?.totalPayout ?? 0),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Không thể tải danh sách nội dung Host." });
  }
};

export const getAdminHostContentDetail = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const hostContentId = parseId(req.params.id as string);

    if (!hostContentId) {
      res.status(400).json({ error: "ID nội dung Host không hợp lệ." });
      return;
    }

    const [content] = await db
      .select({
        hostContentId: hostContents.hostContentId,
        authorId: hostContents.hostContentAuthorId,
        title: hostContents.hostContentTitle,
        description: hostContents.hostContentDescription,
        body: hostContents.hostContentBody,
        category: hostContents.hostContentCategory,
        status: hostContents.hostContentStatus,
        payoutAmount: hostContents.hostContentPayoutAmount,
        viewCount: hostContents.hostContentViewCount,
        mediaUrls: hostContents.hostContentMediaUrls,
        createdAt: hostContents.hostContentCreatedAt,
        updatedAt: hostContents.hostContentUpdatedAt,
        authorName: users.userDisplayName,
        authorEmail: users.userEmail,
        authorMobile: users.userMobile,
        authorLocation: users.userLocation,
      })
      .from(hostContents)
      .leftJoin(users, eq(hostContents.hostContentAuthorId, users.userId))
      .where(eq(hostContents.hostContentId, hostContentId))
      .limit(1);

    if (!content) {
      res.status(404).json({ error: "Không tìm thấy nội dung Host." });
      return;
    }

    res.json({
      data: {
        hostContentId: content.hostContentId,
        authorId: content.authorId,
        title: content.title,
        description: content.description,
        body: content.body,
        category: content.category || "Khác",
        status: content.status,
        statusLabel: resolveStatusLabel(content.status),
        payoutAmount: Number(content.payoutAmount ?? 0),
        viewCount: Number(content.viewCount ?? 0),
        mediaUrls: Array.isArray(content.mediaUrls) ? content.mediaUrls : [],
        createdAt: content.createdAt,
        updatedAt: content.updatedAt,
        authorName:
          normalizeString(content.authorName) ||
          normalizeString(content.authorEmail) ||
          `Host #${content.authorId}`,
        authorEmail: content.authorEmail,
        authorMobile: content.authorMobile,
        authorLocation: content.authorLocation,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Không thể tải chi tiết nội dung Host." });
  }
};

export const updateAdminHostContentStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const hostContentId = parseId(req.params.id as string);
    const nextStatus = normalizeString(
      (req.body as UpdateHostContentStatusPayload).status,
    ).toLowerCase() as HostContentStatus;
    const note = normalizeString((req.body as UpdateHostContentStatusPayload).note);

    if (!hostContentId) {
      res.status(400).json({ error: "ID nội dung Host không hợp lệ." });
      return;
    }

    if (!["pending_admin", "published", "rejected"].includes(nextStatus)) {
      res.status(400).json({ error: "Trạng thái nội dung Host không hợp lệ." });
      return;
    }

    const [currentContent] = await db
      .select({
        hostContentId: hostContents.hostContentId,
        authorId: hostContents.hostContentAuthorId,
        title: hostContents.hostContentTitle,
        previousStatus: hostContents.hostContentStatus,
        payoutAmount: hostContents.hostContentPayoutAmount,
      })
      .from(hostContents)
      .where(eq(hostContents.hostContentId, hostContentId))
      .limit(1);

    if (!currentContent) {
      res.status(404).json({ error: "Không tìm thấy nội dung Host." });
      return;
    }

    if (!currentContent.authorId) {
      res.status(400).json({
        error: "Nội dung Host này chưa gắn tác giả hợp lệ để gửi thông báo.",
      });
      return;
    }

    const hostIncomePolicy = await hostIncomePolicyService.getPolicy();
    const nextPayoutAmount =
      nextStatus === "published" &&
      Number(currentContent.payoutAmount ?? 0) <= 0
        ? hostIncomePolicy.articlePayoutAmount.toFixed(2)
        : undefined;

    const [updated] = await db
      .update(hostContents)
      .set({
        hostContentStatus: nextStatus,
        ...(nextPayoutAmount
          ? { hostContentPayoutAmount: nextPayoutAmount }
          : {}),
        hostContentUpdatedAt: new Date(),
      })
      .where(eq(hostContents.hostContentId, hostContentId))
      .returning();

    const notification = buildNotification(nextStatus, currentContent.title, note);
    const performedBy = getPerformedBy(req);

    await notificationService.sendNotification({
      recipientId: currentContent.authorId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      metaData: {
        source: "admin_host_content",
        hostContentId,
        status: nextStatus,
      },
    });

    await db.insert(eventLogs).values({
      eventLogUserId: currentContent.authorId,
      eventLogEventType: `${HOST_CONTENT_EVENT_PREFIX}_${nextStatus}`,
      eventLogEventTime: new Date(),
      eventLogMeta: {
        hostContentId,
        title: currentContent.title,
        previousStatus: currentContent.previousStatus,
        nextStatus,
        note,
        performedBy,
      },
    });

    if (nextStatus === "published") {
      await hostIncomePolicyService.syncForContentIds([hostContentId]);
    }

    res.json({
      message: "Đã cập nhật trạng thái nội dung Host.",
      data: {
        ...updated,
        statusLabel: resolveStatusLabel(updated.hostContentStatus),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Không thể cập nhật trạng thái nội dung Host." });
  }
};
