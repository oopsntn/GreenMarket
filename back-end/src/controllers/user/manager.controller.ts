import { Response } from "express";
import {
  and,
  desc,
  eq,
  gte,
  inArray,
  lte,
  sql,
  type SQL,
} from "drizzle-orm";
import { db } from "../../config/db.ts";
import { AuthRequest } from "../../dtos/auth.ts";
import {
  eventLogs,
  hostContents,
  posts,
  reports,
  shops,
  users,
  notifications,
  escalations,
} from "../../models/schema/index.ts";
import { parseId } from "../../utils/parseId.ts";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const VALID_QUEUE_TYPES = ["post", "report", "shop"] as const;
const VALID_POST_STATUSES = ["approved", "rejected", "hidden"] as const;
const VALID_SHOP_STATUSES = ["blocked", "active"] as const;
const VALID_REPORT_STATUSES = ["pending", "resolved", "dismissed"] as const;
const VALID_SEVERITY_LEVELS = ["low", "medium", "high", "critical"] as const;
const VALID_TARGET_TYPES = ["post", "shop", "report"] as const;
const VALID_HOST_CONTENT_STATUSES = ["approved", "rejected"] as const;

const MANAGER_POST_STATUS_EVENT = "manager_post_status_updated";
const MANAGER_SHOP_STATUS_EVENT = "manager_shop_status_updated";
const MANAGER_REPORT_RESOLVED_EVENT = "manager_report_resolved";
const MANAGER_FEEDBACK_EVENT = "manager_feedback_sent";
const MANAGER_ESCALATION_EVENT = "manager_escalation_created";
const MANAGER_HOST_CONTENT_STATUS_EVENT = "manager_host_content_status_updated";

const MANAGER_EVENT_TYPES = [
  MANAGER_POST_STATUS_EVENT,
  MANAGER_SHOP_STATUS_EVENT,
  MANAGER_REPORT_RESOLVED_EVENT,
  MANAGER_FEEDBACK_EVENT,
  MANAGER_ESCALATION_EVENT,
  MANAGER_HOST_CONTENT_STATUS_EVENT,
] as const;

const POST_STATE_CHANGED_ERROR = "POST_STATE_CHANGED";
const SHOP_STATE_CHANGED_ERROR = "SHOP_STATE_CHANGED";
const REPORT_STATE_CHANGED_ERROR = "REPORT_STATE_CHANGED";
const HOST_CONTENT_STATE_CHANGED_ERROR = "HOST_CONTENT_STATE_CHANGED";

type ManagerHostContentStatus = (typeof VALID_HOST_CONTENT_STATUSES)[number];

type QueueType = (typeof VALID_QUEUE_TYPES)[number];
type QueuePriority = (typeof VALID_SEVERITY_LEVELS)[number];
type ManagerPostStatus = (typeof VALID_POST_STATUSES)[number];
type ManagerShopStatus = (typeof VALID_SHOP_STATUSES)[number];
type ModerationTargetType = (typeof VALID_TARGET_TYPES)[number];
type ManagerEventType = (typeof MANAGER_EVENT_TYPES)[number];

type QueueItem = {
  queueId: string;
  type: QueueType;
  targetId: number;
  status: string;
  priority: QueuePriority;
  title: string;
  subtitle: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

type TargetContext = {
  targetType: ModerationTargetType;
  targetId: number;
};

const POST_STATUS_TRANSITIONS: Record<string, ReadonlyArray<ManagerPostStatus>> = {
  pending: ["approved", "rejected", "hidden"],
  approved: ["hidden"],
  rejected: ["approved", "hidden"],
  hidden: ["approved"],
  draft: [],
};

const SHOP_STATUS_TRANSITIONS: Record<string, ReadonlyArray<ManagerShopStatus>> = {
  pending: ["active", "blocked"],
  active: ["blocked"],
  blocked: ["active"],
  closed: [],
};

const HISTORY_ACTION_ALIAS: Record<string, ManagerEventType> = {
  post: MANAGER_POST_STATUS_EVENT,
  post_status: MANAGER_POST_STATUS_EVENT,
  shop: MANAGER_SHOP_STATUS_EVENT,
  shop_status: MANAGER_SHOP_STATUS_EVENT,
  report: MANAGER_REPORT_RESOLVED_EVENT,
  report_resolve: MANAGER_REPORT_RESOLVED_EVENT,
  feedback: MANAGER_FEEDBACK_EVENT,
  escalation: MANAGER_ESCALATION_EVENT,
  host_content: MANAGER_HOST_CONTENT_STATUS_EVENT,
  host_content_status: MANAGER_HOST_CONTENT_STATUS_EVENT,
};

const SEVERE_REPORT_REASON_CODE_PARTS = [
  "fraud",
  "scam",
  "illegal",
  "danger",
  "violence",
  "threat",
];

const toPositiveInt = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
};

const parsePagination = (queryPage: unknown, queryLimit: unknown) => {
  const page = toPositiveInt(queryPage, DEFAULT_PAGE);
  const limit = Math.min(toPositiveInt(queryLimit, DEFAULT_LIMIT), MAX_LIMIT);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const parseDateQuery = (value: unknown, endOfDay = false) => {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  if (endOfDay) {
    parsed.setHours(23, 59, 59, 999);
  } else {
    parsed.setHours(0, 0, 0, 0);
  }

  return parsed;
};

const getStringParam = (value: unknown) => {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return typeof value === "string" ? value : "";
};

const parseBodyId = (value: unknown) => {
  if (typeof value === "number" || typeof value === "string") {
    return parseId(String(value));
  }

  return null;
};

const normalizeOptionalEnum = <T extends readonly string[]>(
  value: unknown,
  allowed: T,
): T[number] | undefined | null => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (!allowed.includes(normalized as T[number])) {
    return null;
  }

  return normalized as T[number];
};

const toPriorityWeight = (priority: QueuePriority) => {
  switch (priority) {
    case "critical":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
    default:
      return 1;
  }
};

const toDateKey = (value: Date | string | null | undefined) => {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const toRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const normalizeHistoryActionType = (value: unknown): ManagerEventType | undefined | null => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (MANAGER_EVENT_TYPES.includes(normalized as ManagerEventType)) {
    return normalized as ManagerEventType;
  }

  return HISTORY_ACTION_ALIAS[normalized] ?? null;
};

const formatEventActionType = (eventType: string) => {
  switch (eventType) {
    case MANAGER_POST_STATUS_EVENT:
      return "post_status_updated";
    case MANAGER_SHOP_STATUS_EVENT:
      return "shop_status_updated";
    case MANAGER_REPORT_RESOLVED_EVENT:
      return "report_resolved";
    case MANAGER_FEEDBACK_EVENT:
      return "feedback_sent";
    case MANAGER_ESCALATION_EVENT:
      return "escalation_created";
    case MANAGER_HOST_CONTENT_STATUS_EVENT:
      return "host_content_status_updated";
    default:
      return eventType;
  }
};

export const getPendingHostContents = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const managerId = req.user?.id;
    if (!managerId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { page, limit, offset } = parsePagination(req.query.page, req.query.limit);

    const rows = await db
      .select({
        hostContentId: hostContents.hostContentId,
        hostContentTitle: hostContents.hostContentTitle,
        hostContentDescription: hostContents.hostContentDescription,
        hostContentTargetType: hostContents.hostContentTargetType,
        hostContentTargetId: hostContents.hostContentTargetId,
        hostContentMediaUrls: hostContents.hostContentMediaUrls,
        hostContentStatus: hostContents.hostContentStatus,
        hostContentCreatedAt: hostContents.hostContentCreatedAt,
        hostContentUpdatedAt: hostContents.hostContentUpdatedAt,
        authorId: users.userId,
        authorName: users.userDisplayName,
      })
      .from(hostContents)
      .leftJoin(users, eq(hostContents.hostContentAuthorId, users.userId))
      .where(
        and(
          inArray(hostContents.hostContentStatus, ["pending", "published"]),
          sql`${hostContents.hostContentDeletedAt} IS NULL`,
        ),
      )
      .orderBy(desc(hostContents.hostContentCreatedAt), desc(hostContents.hostContentId))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(hostContents)
      .where(
        and(
          inArray(hostContents.hostContentStatus, ["pending", "published"]),
          sql`${hostContents.hostContentDeletedAt} IS NULL`,
        ),
      );

    const totalItems = Number(countResult?.count ?? 0);
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      data: rows,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getHostContentById = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const managerId = req.user?.id;
    if (!managerId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const contentId = parseId(getStringParam(req.params.id));
    if (!contentId) {
      res.status(400).json({ error: "Invalid host content id" });
      return;
    }

    const [row] = await db
      .select({
        hostContentId: hostContents.hostContentId,
        hostContentTitle: hostContents.hostContentTitle,
        hostContentDescription: hostContents.hostContentDescription,
        hostContentBody: hostContents.hostContentBody,
        hostContentTargetType: hostContents.hostContentTargetType,
        hostContentTargetId: hostContents.hostContentTargetId,
        hostContentTrackingUrl: hostContents.hostContentTrackingUrl,
        hostContentMediaUrls: hostContents.hostContentMediaUrls,
        hostContentStatus: hostContents.hostContentStatus,
        hostContentCreatedAt: hostContents.hostContentCreatedAt,
        hostContentUpdatedAt: hostContents.hostContentUpdatedAt,
        authorId: users.userId,
        authorName: users.userDisplayName,
      })
      .from(hostContents)
      .leftJoin(users, eq(hostContents.hostContentAuthorId, users.userId))
      .where(
        and(
          eq(hostContents.hostContentId, contentId),
          sql`${hostContents.hostContentDeletedAt} IS NULL`,
        ),
      )
      .limit(1);

    if (!row) {
      res.status(404).json({ error: "Host content not found" });
      return;
    }

    res.json({ data: row });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateManagerHostContentStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const managerId = req.user?.id;
    if (!managerId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const contentId = parseId(getStringParam(req.params.id));
    if (!contentId) {
      res.status(400).json({ error: "Invalid host content id" });
      return;
    }

    const nextStatus = normalizeOptionalEnum(req.body?.status, VALID_HOST_CONTENT_STATUSES);
    if (!nextStatus) {
      res.status(400).json({
        error: `status must be one of: ${VALID_HOST_CONTENT_STATUSES.join(", ")}`,
      });
      return;
    }

    const reason =
      typeof req.body?.reason === "string" && req.body.reason.trim()
        ? req.body.reason.trim()
        : null;
    const note =
      typeof req.body?.note === "string" && req.body.note.trim()
        ? req.body.note.trim()
        : null;

    const [existing] = await db
      .select({
        hostContentId: hostContents.hostContentId,
        status: hostContents.hostContentStatus,
      })
      .from(hostContents)
      .where(eq(hostContents.hostContentId, contentId))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Host content not found" });
      return;
    }

    const currentStatus = (existing.status ?? "").toLowerCase();
    if (!["pending", "published"].includes(currentStatus)) {
      res.status(409).json({
        error: "Only pending host contents can be moderated",
        currentStatus,
      });
      return;
    }

    const now = new Date();

    const txResult = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(hostContents)
        .set({
          hostContentStatus: nextStatus as unknown as string,
          hostContentUpdatedAt: now,
        })
        .where(
          and(
            eq(hostContents.hostContentId, contentId),
            eq(hostContents.hostContentStatus, existing.status ?? ""),
          ),
        )
        .returning({
          hostContentId: hostContents.hostContentId,
          hostContentStatus: hostContents.hostContentStatus,
          hostContentUpdatedAt: hostContents.hostContentUpdatedAt,
        });

      if (!updated) {
        throw new Error(HOST_CONTENT_STATE_CHANGED_ERROR);
      }

      const [actionLog] = await tx
        .insert(eventLogs)
        .values({
          eventLogUserId: managerId,
          eventLogEventType: MANAGER_HOST_CONTENT_STATUS_EVENT,
          eventLogMeta: {
            hostContentId: contentId,
            fromStatus: currentStatus,
            toStatus: nextStatus,
            reason,
            note,
          },
        })
        .returning({
          eventLogId: eventLogs.eventLogId,
          eventLogEventType: eventLogs.eventLogEventType,
          eventLogEventTime: eventLogs.eventLogEventTime,
          eventLogMeta: eventLogs.eventLogMeta,
        });

      return { updated, actionLog };
    });

    res.json({
      hostContent: txResult.updated,
      actionLog: formatActionLog(txResult.actionLog),
    });
  } catch (error) {
    if (error instanceof Error && error.message === HOST_CONTENT_STATE_CHANGED_ERROR) {
      res.status(409).json({
        error: "Host content state changed while processing request. Please retry.",
      });
      return;
    }

    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deriveReportSeverity = (
  reportReasonCode: string | null | undefined,
  reportReason: string | null | undefined,
): QueuePriority => {
  const normalizedCode = (reportReasonCode ?? "").toLowerCase();
  const normalizedReason = (reportReason ?? "").toLowerCase();

  if (
    SEVERE_REPORT_REASON_CODE_PARTS.some(
      (part) => normalizedCode.includes(part) || normalizedReason.includes(part),
    )
  ) {
    return "high";
  }

  if (normalizedCode.includes("spam") || normalizedReason.includes("spam")) {
    return "low";
  }

  return "medium";
};

const derivePostPriority = (status: string | null | undefined): QueuePriority => {
  const normalized = (status ?? "").toLowerCase();
  switch (normalized) {
    case "pending":
    case "hidden":
      return "high";
    case "rejected":
      return "medium";
    case "approved":
      return "low";
    default:
      return "medium";
  }
};

const deriveShopPriority = (status: string | null | undefined): QueuePriority => {
  const normalized = (status ?? "").toLowerCase();
  switch (normalized) {
    case "blocked":
      return "high";
    case "pending":
      return "medium";
    case "active":
      return "low";
    default:
      return "low";
  }
};

const formatActionLog = (eventLog: {
  eventLogId: number;
  eventLogEventType: string | null;
  eventLogEventTime: Date | null;
  eventLogMeta: unknown;
}) => ({
  actionLogId: eventLog.eventLogId,
  eventType: eventLog.eventLogEventType,
  actionType: formatEventActionType(eventLog.eventLogEventType ?? ""),
  createdAt: eventLog.eventLogEventTime,
  meta: toRecord(eventLog.eventLogMeta),
});

const ensureTargetExists = async (
  targetType: ModerationTargetType,
  targetId: number,
): Promise<TargetContext | null> => {
  if (targetType === "post") {
    const [post] = await db
      .select({ postId: posts.postId })
      .from(posts)
      .where(eq(posts.postId, targetId))
      .limit(1);

    if (!post) {
      return null;
    }

    return {
      targetType,
      targetId,
    };
  }

  if (targetType === "shop") {
    const [shop] = await db
      .select({ shopId: shops.shopId })
      .from(shops)
      .where(eq(shops.shopId, targetId))
      .limit(1);

    if (!shop) {
      return null;
    }

    return {
      targetType,
      targetId,
    };
  }

  const [report] = await db
    .select({
      reportId: reports.ticketId,
    })
    .from(reports)
    .where(and(eq(reports.ticketType, 'REPORT'), eq(reports.ticketId, targetId)))
    .limit(1);

  if (!report) {
    return null;
  }

  return {
    targetType,
    targetId,
  };
};

export const getModerationQueue = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const queueTypeFilter = normalizeOptionalEnum(req.query.type, VALID_QUEUE_TYPES);
    if (queueTypeFilter === null) {
      res.status(400).json({
        error: `type must be one of: ${VALID_QUEUE_TYPES.join(", ")}`,
      });
      return;
    }

    const priorityFilter = normalizeOptionalEnum(
      req.query.priority,
      VALID_SEVERITY_LEVELS,
    );
    if (priorityFilter === null) {
      res.status(400).json({
        error: `priority must be one of: ${VALID_SEVERITY_LEVELS.join(", ")}`,
      });
      return;
    }

    const statusFilter = getStringParam(req.query.status).trim().toLowerCase();
    const { page, limit, offset } = parsePagination(req.query.page, req.query.limit);

    const [postRows, reportRows, shopRows] = await Promise.all([
      !queueTypeFilter || queueTypeFilter === "post"
        ? db
            .select({
              postId: posts.postId,
              postTitle: posts.postTitle,
              postStatus: posts.postStatus,
              postRejectedReason: posts.postRejectedReason,
              postCreatedAt: posts.postCreatedAt,
              postUpdatedAt: posts.postUpdatedAt,
              authorName: users.userDisplayName,
            })
            .from(posts)
            .leftJoin(users, eq(posts.postAuthorId, users.userId))
            .where(inArray(posts.postStatus, ["pending", "approved", "rejected", "hidden"]))
        : Promise.resolve([]),
        !queueTypeFilter || queueTypeFilter === "report"
          ? db
              .select({
                reportId: reports.ticketId,
                reportStatus: reports.ticketStatus,
                reportReasonCode: reports.ticketTitle,
                reportReason: reports.ticketContent,
                reportCreatedAt: reports.ticketCreatedAt,
                reportUpdatedAt: reports.ticketUpdatedAt,
                reporterName: users.userDisplayName,
                postTitle: posts.postTitle,
                shopName: shops.shopName,
              })
              .from(reports)
              .leftJoin(users, eq(reports.ticketCreatorId, users.userId))
              .leftJoin(posts, and(eq(reports.ticketTargetType, 'post'), eq(reports.ticketTargetId, posts.postId)))
              .leftJoin(shops, and(eq(reports.ticketTargetType, 'shop'), eq(reports.ticketTargetId, shops.shopId)))
              .where(eq(reports.ticketType, 'REPORT'))
          : Promise.resolve([]),
      !queueTypeFilter || queueTypeFilter === "shop"
        ? db
            .select({
              shopId: shops.shopId,
              shopName: shops.shopName,
              shopStatus: shops.shopStatus,
              shopCreatedAt: shops.shopCreatedAt,
              shopUpdatedAt: shops.shopUpdatedAt,
              ownerName: users.userDisplayName,
            })
            .from(shops)
            .leftJoin(users, eq(shops.shopId, users.userId))
            .where(inArray(shops.shopStatus, ["pending", "active", "blocked", "closed"]))
        : Promise.resolve([]),
    ]);

    const queueItems: QueueItem[] = [
      ...postRows.map((item) => ({
        queueId: `post-${item.postId}`,
        type: "post" as const,
        targetId: item.postId,
        status: (item.postStatus ?? "unknown").toLowerCase(),
        priority: derivePostPriority(item.postStatus),
        title: item.postTitle,
        subtitle: item.authorName
          ? `Author: ${item.authorName}`
          : item.postRejectedReason ?? null,
        createdAt: item.postCreatedAt,
        updatedAt: item.postUpdatedAt,
      })),
      ...reportRows.map((item) => ({
        queueId: `report-${item.reportId}`,
        type: "report" as const,
        targetId: item.reportId,
        status: (item.reportStatus ?? "unknown").toLowerCase(),
        priority: deriveReportSeverity(item.reportReasonCode, item.reportReason),
        title: item.postTitle || item.shopName || `Report #${item.reportId}`,
        subtitle: item.reportReason || item.reportReasonCode || item.reporterName || null,
        createdAt: item.reportCreatedAt,
        updatedAt: item.reportUpdatedAt,
      })),
      ...shopRows.map((item) => ({
        queueId: `shop-${item.shopId}`,
        type: "shop" as const,
        targetId: item.shopId,
        status: (item.shopStatus ?? "unknown").toLowerCase(),
        priority: deriveShopPriority(item.shopStatus),
        title: item.shopName,
        subtitle: item.ownerName ? `Owner: ${item.ownerName}` : null,
        createdAt: item.shopCreatedAt,
        updatedAt: item.shopUpdatedAt,
      })),
    ];

    const filteredItems = queueItems
      .filter((item) => {
        if (statusFilter && item.status !== statusFilter) {
          return false;
        }

        if (priorityFilter && item.priority !== priorityFilter) {
          return false;
        }

        return true;
      })
      .sort((left, right) => {
        const priorityDiff = toPriorityWeight(right.priority) - toPriorityWeight(left.priority);
        if (priorityDiff !== 0) {
          return priorityDiff;
        }

        const leftTime = left.updatedAt?.getTime() ?? left.createdAt?.getTime() ?? 0;
        const rightTime = right.updatedAt?.getTime() ?? right.createdAt?.getTime() ?? 0;
        return rightTime - leftTime;
      });

    const data = filteredItems.slice(offset, offset + limit);
    const totalItems = filteredItems.length;
    const totalPages = Math.ceil(totalItems / limit);

    const summary = {
      byType: {
        post: filteredItems.filter((item) => item.type === "post").length,
        report: filteredItems.filter((item) => item.type === "report").length,
        shop: filteredItems.filter((item) => item.type === "shop").length,
      },
      byPriority: {
        low: filteredItems.filter((item) => item.priority === "low").length,
        medium: filteredItems.filter((item) => item.priority === "medium").length,
        high: filteredItems.filter((item) => item.priority === "high").length,
        critical: filteredItems.filter((item) => item.priority === "critical").length,
      },
    };

    res.json({
      data,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
      },
      summary,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateManagerPostStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const managerId = req.user?.id;
    if (!managerId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const postId = parseId(getStringParam(req.params.id));
    if (!postId) {
      res.status(400).json({ error: "Invalid post id" });
      return;
    }

    const nextStatus = normalizeOptionalEnum(req.body?.status, VALID_POST_STATUSES);
    if (!nextStatus) {
      res.status(400).json({
        error: `status must be one of: ${VALID_POST_STATUSES.join(", ")}`,
      });
      return;
    }

    const reason =
      typeof req.body?.reason === "string" && req.body.reason.trim()
        ? req.body.reason.trim()
        : null;
    const note =
      typeof req.body?.note === "string" && req.body.note.trim()
        ? req.body.note.trim()
        : null;

    const [existingPost] = await db
      .select({
        postId: posts.postId,
        status: posts.postStatus,
        rejectedReason: posts.postRejectedReason,
      })
      .from(posts)
      .where(eq(posts.postId, postId))
      .limit(1);

    if (!existingPost) {
      res.status(404).json({ error: "Post not found" });
      return;
    }

    const currentStatus = (existingPost.status ?? "").toLowerCase();
    if (currentStatus === nextStatus) {
      res.status(409).json({
        error: "Post is already in requested status",
        currentStatus,
      });
      return;
    }

    const allowedTransitions = POST_STATUS_TRANSITIONS[currentStatus] ?? [];
    if (!allowedTransitions.includes(nextStatus)) {
      res.status(409).json({
        error: "Invalid post status transition",
        currentStatus,
        nextStatus,
      });
      return;
    }

    const now = new Date();

    const txResult = await db.transaction(async (tx) => {
      const [updatedPost] = await tx
        .update(posts)
        .set({
          postStatus: nextStatus,
          postRejectedReason:
            nextStatus === "approved" ? null : reason ?? existingPost.rejectedReason ?? null,
          postModeratedAt: now,
          postUpdatedAt: now,
        })
        .where(and(eq(posts.postId, postId), eq(posts.postStatus, existingPost.status ?? "")))
        .returning({
          postId: posts.postId,
          postStatus: posts.postStatus,
          postRejectedReason: posts.postRejectedReason,
          postModeratedAt: posts.postModeratedAt,
          postUpdatedAt: posts.postUpdatedAt,
        });

      if (!updatedPost) {
        throw new Error(POST_STATE_CHANGED_ERROR);
      }

      const [actionLog] = await tx
        .insert(eventLogs)
        .values([{
          eventLogUserId: (managerId ?? null) as number | null,
          eventLogTargetType: "post",
          eventLogTargetId: postId,
          eventLogEventType: MANAGER_POST_STATUS_EVENT,
          eventLogMeta: {
            fromStatus: currentStatus,
            toStatus: nextStatus,
            reason,
            note,
          },
        }] as any[])
        .returning({
          eventLogId: eventLogs.eventLogId,
          eventLogEventType: eventLogs.eventLogEventType,
          eventLogEventTime: eventLogs.eventLogEventTime,
          eventLogMeta: eventLogs.eventLogMeta,
        });

      return {
        updatedPost,
        actionLog,
      };
    });

    res.json({
      post: txResult.updatedPost,
      actionLog: formatActionLog(txResult.actionLog),
    });
  } catch (error) {
    if (error instanceof Error && error.message === POST_STATE_CHANGED_ERROR) {
      res.status(409).json({
        error: "Post state changed while processing request. Please retry.",
      });
      return;
    }

    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateManagerShopStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const managerId = req.user?.id;
    if (!managerId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const shopId = parseId(getStringParam(req.params.id));
    if (!shopId) {
      res.status(400).json({ error: "Invalid shop id" });
      return;
    }

    const nextStatus = normalizeOptionalEnum(req.body?.status, VALID_SHOP_STATUSES);
    if (!nextStatus) {
      res.status(400).json({
        error: `status must be one of: ${VALID_SHOP_STATUSES.join(", ")}`,
      });
      return;
    }

    const reason =
      typeof req.body?.reason === "string" && req.body.reason.trim()
        ? req.body.reason.trim()
        : null;
    const note =
      typeof req.body?.note === "string" && req.body.note.trim()
        ? req.body.note.trim()
        : null;

    if (nextStatus === "blocked" && !reason) {
      res.status(400).json({ error: "reason is required when blocking a shop" });
      return;
    }

    const [existingShop] = await db
      .select({
        shopId: shops.shopId,
        status: shops.shopStatus,
      })
      .from(shops)
      .where(eq(shops.shopId, shopId))
      .limit(1);

    if (!existingShop) {
      res.status(404).json({ error: "Shop not found" });
      return;
    }

    const currentStatus = (existingShop.status ?? "").toLowerCase();
    if (currentStatus === nextStatus) {
      res.status(409).json({
        error: "Shop is already in requested status",
        currentStatus,
      });
      return;
    }

    const allowedTransitions = SHOP_STATUS_TRANSITIONS[currentStatus] ?? [];
    if (!allowedTransitions.includes(nextStatus)) {
      res.status(409).json({
        error: "Invalid shop status transition",
        currentStatus,
        nextStatus,
      });
      return;
    }

    const now = new Date();

    const txResult = await db.transaction(async (tx) => {
      const [updatedShop] = await tx
        .update(shops)
        .set({
          shopStatus: nextStatus,
          shopUpdatedAt: now,
        })
        .where(and(eq(shops.shopId, shopId), eq(shops.shopStatus, existingShop.status ?? "")))
        .returning({
          shopId: shops.shopId,
          shopName: shops.shopName,
          shopStatus: shops.shopStatus,
          shopUpdatedAt: shops.shopUpdatedAt,
        });

      if (!updatedShop) {
        throw new Error(SHOP_STATE_CHANGED_ERROR);
      }

      let postsAssigned = 0;
      if (nextStatus === "active") {
        const { rowCount } = await tx
          .update(posts)
          .set({
            postShopId: shopId,
            postUpdatedAt: now,
          })
          .where(eq(posts.postAuthorId, shopId));

        postsAssigned = rowCount ?? 0;
      }

      const [actionLog] = await tx
        .insert(eventLogs)
        .values([{
          eventLogUserId: (managerId ?? null) as number | null,
          eventLogTargetType: "shop",
          eventLogTargetId: shopId,
          eventLogEventType: MANAGER_SHOP_STATUS_EVENT,
          eventLogMeta: {
            fromStatus: currentStatus,
            toStatus: nextStatus,
            reason,
            note,
            postsAssigned,
          },
        }] as any[])
        .returning({
          eventLogId: eventLogs.eventLogId,
          eventLogEventType: eventLogs.eventLogEventType,
          eventLogEventTime: eventLogs.eventLogEventTime,
          eventLogMeta: eventLogs.eventLogMeta,
        });

      return {
        updatedShop,
        postsAssigned,
        actionLog,
      };
    });

    res.json({
      shop: txResult.updatedShop,
      postsAssigned: txResult.postsAssigned,
      actionLog: formatActionLog(txResult.actionLog),
    });
  } catch (error) {
    if (error instanceof Error && error.message === SHOP_STATE_CHANGED_ERROR) {
      res.status(409).json({
        error: "Shop state changed while processing request. Please retry.",
      });
      return;
    }

    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getManagerReports = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const statusFilter = normalizeOptionalEnum(req.query.status, VALID_REPORT_STATUSES);
    if (statusFilter === null) {
      res.status(400).json({
        error: `status must be one of: ${VALID_REPORT_STATUSES.join(", ")}`,
      });
      return;
    }

    const severityFilter = normalizeOptionalEnum(req.query.severity, VALID_SEVERITY_LEVELS);
    if (severityFilter === null) {
      res.status(400).json({
        error: `severity must be one of: ${VALID_SEVERITY_LEVELS.join(", ")}`,
      });
      return;
    }

    const { page, limit, offset } = parsePagination(req.query.page, req.query.limit);
    const conditions: SQL[] = [eq(reports.ticketType, 'REPORT')];
    if (statusFilter) {
      conditions.push(eq(reports.ticketStatus, statusFilter));
    }

    const rows = await db
      .select({
        reportId: reports.ticketId,
        reportStatus: reports.ticketStatus,
        reportReasonCode: reports.ticketTitle,
        reportReason: reports.ticketContent,
        reportNote: sql<string>`${reports.ticketMetaData}->>'note'`,
        adminNote: reports.ticketResolutionNote,
        reportCreatedAt: reports.ticketCreatedAt,
        reportUpdatedAt: reports.ticketUpdatedAt,
        reporterId: reports.ticketCreatorId,
        postId: sql<number>`case when ${reports.ticketTargetType} = 'post' then ${reports.ticketTargetId} end`,
        reportShopId: sql<number>`case when ${reports.ticketTargetType} = 'shop' then ${reports.ticketTargetId} end`,
        reporterName: users.userDisplayName,
        postTitle: posts.postTitle,
        shopName: shops.shopName,
      })
      .from(reports)
      .leftJoin(users, eq(reports.ticketCreatorId, users.userId))
      .leftJoin(posts, and(eq(reports.ticketTargetType, 'post'), eq(reports.ticketTargetId, posts.postId)))
      .leftJoin(shops, and(eq(reports.ticketTargetType, 'shop'), eq(reports.ticketTargetId, shops.shopId)))
      .where(and(...conditions))
      .orderBy(desc(reports.ticketCreatedAt), desc(reports.ticketId));

    const filteredRows = rows
      .map((item) => ({
        ...item,
        severity: deriveReportSeverity(item.reportReasonCode, item.reportReason),
      }))
      .filter((item) => !severityFilter || item.severity === severityFilter);

    const totalItems = filteredRows.length;
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      data: filteredRows.slice(offset, offset + limit),
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const resolveManagerReport = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const managerId = req.user?.id;
    if (!managerId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const reportId = parseId(getStringParam(req.params.id));
    if (!reportId) {
      res.status(400).json({ error: "Invalid report id" });
      return;
    }

    const status = normalizeOptionalEnum(req.body?.status, ["resolved", "dismissed"] as const);
    if (!status) {
      res.status(400).json({ error: "status must be resolved or dismissed" });
      return;
    }

    const resolution =
      typeof req.body?.resolution === "string" ? req.body.resolution.trim() : "";
    if (!resolution) {
      res.status(400).json({ error: "resolution is required" });
      return;
    }

    const note =
      typeof req.body?.note === "string" && req.body.note.trim()
        ? req.body.note.trim()
        : null;

    const [existingReport] = await db
      .select({
        reportId: reports.ticketId,
        status: reports.ticketStatus,
      })
      .from(reports)
      .where(and(eq(reports.ticketType, 'REPORT'), eq(reports.ticketId, reportId)))
      .limit(1);

    if (!existingReport) {
      res.status(404).json({ error: "Report not found" });
      return;
    }

    const currentStatus = (existingReport.status ?? "").toLowerCase();
    if (currentStatus !== "pending") {
      res.status(409).json({
        error: "Only pending reports can be resolved",
        currentStatus,
      });
      return;
    }

    const now = new Date();
    const decisionText = note ? `${resolution}\n\n${note}` : resolution;

    const txResult = await db.transaction(async (tx) => {
      const [updatedReport] = await tx
        .update(reports)
        .set({
          ticketStatus: status,
          ticketResolutionNote: decisionText,
          ticketUpdatedAt: now,
          ticketResolvedAt: now,
        })
        .where(and(eq(reports.ticketId, reportId), eq(reports.ticketType, 'REPORT'), eq(reports.ticketStatus, 'pending')))
        .returning({
          reportId: reports.ticketId,
          reportStatus: reports.ticketStatus,
          adminNote: reports.ticketResolutionNote,
          reportUpdatedAt: reports.ticketUpdatedAt,
        });

      if (!updatedReport) {
        throw new Error(REPORT_STATE_CHANGED_ERROR);
      }

      const [decisionLog] = await tx
        .insert(eventLogs)
        .values([{
          eventLogUserId: (managerId ?? null) as number | null,
          eventLogTargetType: "report",
          eventLogTargetId: reportId,
          eventLogEventType: MANAGER_REPORT_RESOLVED_EVENT,
          eventLogMeta: {
            fromStatus: currentStatus,
            toStatus: status,
            resolution,
            note,
          },
        }] as any[])
        .returning({
          eventLogId: eventLogs.eventLogId,
          eventLogEventType: eventLogs.eventLogEventType,
          eventLogEventTime: eventLogs.eventLogEventTime,
          eventLogMeta: eventLogs.eventLogMeta,
        });

      const [enrichedReport] = await tx
        .select({
          reportId: reports.ticketId,
          reportStatus: reports.ticketStatus,
          reportReasonCode: reports.ticketTitle,
          reportReason: reports.ticketContent,
          reportNote: sql<string>`${reports.ticketMetaData}->>'note'`,
          adminNote: reports.ticketResolutionNote,
          reportCreatedAt: reports.ticketCreatedAt,
          reportUpdatedAt: reports.ticketUpdatedAt,
          reporterId: reports.ticketCreatorId,
          postId: sql<number>`case when ${reports.ticketTargetType} = 'post' then ${reports.ticketTargetId} end`,
          reportShopId: sql<number>`case when ${reports.ticketTargetType} = 'shop' then ${reports.ticketTargetId} end`,
          reporterName: users.userDisplayName,
          postTitle: posts.postTitle,
          shopName: shops.shopName,
        })
        .from(reports)
        .leftJoin(users, eq(reports.ticketCreatorId, users.userId))
        .leftJoin(posts, and(eq(reports.ticketTargetType, 'post'), eq(reports.ticketTargetId, posts.postId)))
        .leftJoin(shops, and(eq(reports.ticketTargetType, 'shop'), eq(reports.ticketTargetId, shops.shopId)))
        .where(eq(reports.ticketId, reportId))
        .limit(1);

      return {
        report: enrichedReport ?? updatedReport,
        decisionLog,
      };
    });

    res.json({
      report: txResult.report,
      decisionLog: formatActionLog(txResult.decisionLog),
    });
  } catch (error) {
    if (error instanceof Error && error.message === REPORT_STATE_CHANGED_ERROR) {
      res.status(409).json({
        error: "Report state changed while processing request. Please retry.",
      });
      return;
    }

    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createModerationFeedback = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const managerId = req.user?.id;
    if (!managerId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const targetType = normalizeOptionalEnum(req.body?.targetType, VALID_TARGET_TYPES);
    if (!targetType) {
      res.status(400).json({
        error: `targetType must be one of: ${VALID_TARGET_TYPES.join(", ")}`,
      });
      return;
    }

    const targetId = parseBodyId(req.body?.targetId);
    if (!targetId) {
      res.status(400).json({ error: "targetId is required and must be numeric" });
      return;
    }

    const recipientUserId = parseBodyId(req.body?.recipientUserId);
    if (!recipientUserId) {
      res.status(400).json({
        error: "recipientUserId is required and must be numeric",
      });
      return;
    }

    const message =
      typeof req.body?.message === "string" ? req.body.message.trim() : "";
    if (!message) {
      res.status(400).json({ error: "message is required" });
      return;
    }

    if (message.length > 2000) {
      res.status(400).json({ error: "message must not exceed 2000 characters" });
      return;
    }

    const templateId =
      typeof req.body?.templateId === "string" && req.body.templateId.trim()
        ? req.body.templateId.trim()
        : null;

    const targetContext = await ensureTargetExists(targetType, targetId);
    if (!targetContext) {
      res.status(404).json({ error: "Target not found" });
      return;
    }

    const [recipient] = await db
      .select({ userId: users.userId })
      .from(users)
      .where(eq(users.userId, recipientUserId))
      .limit(1);

    if (!recipient) {
      res.status(404).json({ error: "Recipient user not found" });
      return;
    }

    const [notificationRow] = await db
      .insert(notifications)
      .values([{
        recipientId: recipientUserId!,
        senderId: (managerId ?? null) as number | null,
        title: `Phản hồi kiểm duyệt: ${targetType === "post" ? "Bài đăng" : "Cửa hàng"}`,
        message: message,
        type: "moderation",
        metaData: {
          targetType,
          targetId,
          templateId,
        },
      }] as any[])
      .returning();

    // Still keep event log for secondary tracking
    await db.insert(eventLogs).values([{
      eventLogUserId: (managerId ?? null) as number | null,
      eventLogTargetType: targetType,
      eventLogTargetId: targetId,
      eventLogEventType: MANAGER_FEEDBACK_EVENT,
      eventLogMeta: {
        notificationId: notificationRow.notificationId,
        targetType,
        targetId,
        recipientUserId,
        templateId,
      },
    }] as any[]);

    res.status(201).json({
      feedback: {
        id: notificationRow.notificationId,
        targetType,
        targetId,
        recipientUserId,
        message,
        templateId,
        createdAt: notificationRow.createdAt,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getManagerHistory = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const actionFilter = normalizeHistoryActionType(req.query.actionType);
    if (actionFilter === null) {
      res.status(400).json({ error: "Invalid actionType" });
      return;
    }

    const from = parseDateQuery(req.query.from);
    if (from === undefined) {
      res.status(400).json({ error: "Invalid from date format" });
      return;
    }

    const to = parseDateQuery(req.query.to, true);
    if (to === undefined) {
      res.status(400).json({ error: "Invalid to date format" });
      return;
    }

    if (from && to && from.getTime() > to.getTime()) {
      res.status(400).json({ error: "from must be before or equal to to" });
      return;
    }

    const { page, limit, offset } = parsePagination(req.query.page, req.query.limit);
    const conditions: SQL[] = [
      inArray(eventLogs.eventLogEventType, [...MANAGER_EVENT_TYPES]),
    ];

    if (actionFilter) {
      conditions.push(eq(eventLogs.eventLogEventType, actionFilter));
    }

    if (from) {
      conditions.push(gte(eventLogs.eventLogEventTime, from));
    }

    if (to) {
      conditions.push(lte(eventLogs.eventLogEventTime, to));
    }

    const whereClause = and(...conditions);

    const [countResult, rows] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(eventLogs)
        .where(whereClause),
      db
        .select({
          eventLogId: eventLogs.eventLogId,
          eventLogUserId: eventLogs.eventLogUserId,
          eventLogTargetType: eventLogs.eventLogTargetType,
          eventLogTargetId: eventLogs.eventLogTargetId,
          eventLogEventType: eventLogs.eventLogEventType,
          eventLogEventTime: eventLogs.eventLogEventTime,
          eventLogMeta: eventLogs.eventLogMeta,
          actorName: users.userDisplayName,
        })
        .from(eventLogs)
        .leftJoin(users, eq(eventLogs.eventLogUserId, users.userId))
        .where(whereClause)
        .orderBy(desc(eventLogs.eventLogEventTime), desc(eventLogs.eventLogId))
        .limit(limit)
        .offset(offset),
    ]);

    const totalItems = Number(countResult[0]?.count ?? 0);
    const totalPages = Math.ceil(totalItems / limit);

    const data = rows.map((item) => {
      const meta = toRecord(item.eventLogMeta);
      return {
        logId: item.eventLogId,
        actionType: formatEventActionType(item.eventLogEventType ?? ""),
        eventType: item.eventLogEventType,
        eventTime: item.eventLogEventTime,
        actor: {
          userId: item.eventLogUserId,
          displayName: item.actorName,
        },
        target: {
          targetType: item.eventLogTargetType,
          targetId: item.eventLogTargetId,
        },
        meta,
      };
    });

    res.json({
      data,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getManagerStatistics = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const from = parseDateQuery(req.query.from);
    if (from === undefined) {
      res.status(400).json({ error: "Invalid from date format" });
      return;
    }

    const to = parseDateQuery(req.query.to, true);
    if (to === undefined) {
      res.status(400).json({ error: "Invalid to date format" });
      return;
    }

    if (from && to && from.getTime() > to.getTime()) {
      res.status(400).json({ error: "from must be before or equal to to" });
      return;
    }

    const conditions: SQL[] = [
      inArray(eventLogs.eventLogEventType, [...MANAGER_EVENT_TYPES]),
    ];
    if (from) {
      conditions.push(gte(eventLogs.eventLogEventTime, from));
    }
    if (to) {
      conditions.push(lte(eventLogs.eventLogEventTime, to));
    }

    const whereClause = and(...conditions);

    const [logs, pendingPostsResult, pendingReportsResult, pendingShopsResult] =
      await Promise.all([
        db
          .select({
            eventLogId: eventLogs.eventLogId,
            eventLogEventType: eventLogs.eventLogEventType,
            eventLogEventTime: eventLogs.eventLogEventTime,
            eventLogMeta: eventLogs.eventLogMeta,
          })
          .from(eventLogs)
          .where(whereClause)
          .orderBy(desc(eventLogs.eventLogEventTime), desc(eventLogs.eventLogId)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(posts)
          .where(eq(posts.postStatus, "pending")),
        db
          .select({ count: sql<number>`count(*)` })
          .from(reports)
          .where(and(eq(reports.ticketType, 'REPORT'), eq(reports.ticketStatus, "pending"))),
        db
          .select({ count: sql<number>`count(*)` })
          .from(shops)
          .where(eq(shops.shopStatus, "pending")),
      ]);

    const actionCounters = {
      postStatusUpdates: 0,
      shopStatusUpdates: 0,
      reportResolved: 0,
      feedbackSent: 0,
      escalationsCreated: 0,
    };

    const dayMap = new Map<
      string,
      {
        date: string;
        totalActions: number;
        postStatusUpdates: number;
        shopStatusUpdates: number;
        reportResolved: number;
        feedbackSent: number;
        escalationsCreated: number;
      }
    >();

    const severityMap = new Map<QueuePriority, number>([
      ["low", 0],
      ["medium", 0],
      ["high", 0],
      ["critical", 0],
    ]);

    logs.forEach((item) => {
      const eventType = item.eventLogEventType ?? "";
      const dayKey = toDateKey(item.eventLogEventTime);
      const dayCounter = dayMap.get(dayKey) ?? {
        date: dayKey,
        totalActions: 0,
        postStatusUpdates: 0,
        shopStatusUpdates: 0,
        reportResolved: 0,
        feedbackSent: 0,
        escalationsCreated: 0,
      };

      dayCounter.totalActions += 1;

      if (eventType === MANAGER_POST_STATUS_EVENT) {
        actionCounters.postStatusUpdates += 1;
        dayCounter.postStatusUpdates += 1;
      } else if (eventType === MANAGER_SHOP_STATUS_EVENT) {
        actionCounters.shopStatusUpdates += 1;
        dayCounter.shopStatusUpdates += 1;
      } else if (eventType === MANAGER_REPORT_RESOLVED_EVENT) {
        actionCounters.reportResolved += 1;
        dayCounter.reportResolved += 1;
      } else if (eventType === MANAGER_FEEDBACK_EVENT) {
        actionCounters.feedbackSent += 1;
        dayCounter.feedbackSent += 1;
      } else if (eventType === MANAGER_ESCALATION_EVENT) {
        actionCounters.escalationsCreated += 1;
        dayCounter.escalationsCreated += 1;
      }

      dayMap.set(dayKey, dayCounter);

      const meta = toRecord(item.eventLogMeta);
      const severityValue =
        typeof meta?.severity === "string" ? meta.severity.toLowerCase() : null;
      if (severityValue && VALID_SEVERITY_LEVELS.includes(severityValue as QueuePriority)) {
        const key = severityValue as QueuePriority;
        severityMap.set(key, (severityMap.get(key) ?? 0) + 1);
      }
    });

    const pendingPosts = Number(pendingPostsResult[0]?.count ?? 0);
    const pendingReports = Number(pendingReportsResult[0]?.count ?? 0);
    const pendingShops = Number(pendingShopsResult[0]?.count ?? 0);

    res.json({
      kpi: {
        totalActions: logs.length,
        postStatusUpdates: actionCounters.postStatusUpdates,
        shopStatusUpdates: actionCounters.shopStatusUpdates,
        reportResolved: actionCounters.reportResolved,
        feedbackSent: actionCounters.feedbackSent,
        escalationsCreated: actionCounters.escalationsCreated,
        pendingPosts,
        pendingReports,
        pendingShops,
        openQueueItems: pendingPosts + pendingReports + pendingShops,
      },
      charts: {
        actionsByType: [
          { actionType: "post_status_updated", count: actionCounters.postStatusUpdates },
          { actionType: "shop_status_updated", count: actionCounters.shopStatusUpdates },
          { actionType: "report_resolved", count: actionCounters.reportResolved },
          { actionType: "feedback_sent", count: actionCounters.feedbackSent },
          { actionType: "escalation_created", count: actionCounters.escalationsCreated },
        ],
        actionsByDay: Array.from(dayMap.values()).sort((left, right) =>
          left.date.localeCompare(right.date),
        ),
        severityBreakdown: Array.from(severityMap.entries()).map(([severity, count]) => ({
          severity,
          count,
        })),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createManagerEscalation = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const managerId = req.user?.id;
    if (!managerId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const targetType = normalizeOptionalEnum(req.body?.targetType, VALID_TARGET_TYPES);
    if (!targetType) {
      res.status(400).json({
        error: `targetType must be one of: ${VALID_TARGET_TYPES.join(", ")}`,
      });
      return;
    }

    const targetId = parseBodyId(req.body?.targetId);
    if (!targetId) {
      res.status(400).json({ error: "targetId is required and must be numeric" });
      return;
    }

    const severity = normalizeOptionalEnum(req.body?.severity, VALID_SEVERITY_LEVELS);
    if (!severity) {
      res.status(400).json({
        error: `severity must be one of: ${VALID_SEVERITY_LEVELS.join(", ")}`,
      });
      return;
    }

    const reason =
      typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
    if (!reason) {
      res.status(400).json({ error: "reason is required" });
      return;
    }

    if (reason.length > 2000) {
      res.status(400).json({ error: "reason must not exceed 2000 characters" });
      return;
    }

    const evidenceUrls = Array.isArray(req.body?.evidenceUrls)
      ? req.body.evidenceUrls.filter(
          (item: unknown): item is string =>
            typeof item === "string" && item.trim().length > 0,
        )
      : [];

    const targetContext = await ensureTargetExists(targetType, targetId);
    if (!targetContext) {
      res.status(404).json({ error: "Target not found" });
      return;
    }

    const [escalationRow] = await db
      .insert(escalations)
      .values({
        ticketType: 'ESCALATION',
        ticketTargetType: targetType,
        ticketTargetId: targetId,
        ticketCreatorId: managerId,
        ticketPriority: severity as any,
        ticketContent: reason,
        ticketMetaData: { evidenceUrls },
        ticketStatus: "open",
      })
      .returning();

    await db.insert(eventLogs).values([{
      eventLogUserId: (managerId ?? null) as number | null,
      eventLogTargetType: targetType,
      eventLogTargetId: targetId,
      eventLogEventType: MANAGER_ESCALATION_EVENT,
      eventLogMeta: {
        escalationId: escalationRow.ticketId,
        targetType,
        targetId,
        severity,
      },
    }] as any[]);

    res.status(201).json({
      escalationTicket: {
        escalationId: escalationRow.ticketId,
        ticketCode: `ESC-${escalationRow.ticketId}`,
        status: escalationRow.ticketStatus,
        targetType,
        targetId,
        severity,
        reason,
        evidenceUrls,
        createdAt: escalationRow.ticketCreatedAt,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
