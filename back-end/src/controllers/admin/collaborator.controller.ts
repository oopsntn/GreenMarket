import { Response } from "express";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../../config/db.ts";
import { AuthRequest } from "../../dtos/auth.ts";
import {
  businessRoles,
  eventLogs,
  posts,
  shopCollaborators,
  shops,
  users,
} from "../../models/schema/index.ts";
import { parseId } from "../../utils/parseId.ts";
import { notificationService } from "../../services/notification.service.ts";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const COLLABORATOR_EVENT_PREFIX = "admin_collaborator_relationship";

type CollaboratorStatus = "active" | "pending" | "rejected" | "removed";

type UpdateCollaboratorStatusPayload = {
  status?: string;
  note?: string;
};

const ALLOWED_STATUS_TRANSITIONS: Record<CollaboratorStatus, CollaboratorStatus[]> = {
  pending: ["active", "rejected"],
  active: ["removed"],
  rejected: ["pending", "active"],
  removed: ["pending", "active"],
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

const resolveRelationshipStatusLabel = (status: string | null) => {
  switch ((status || "").toLowerCase()) {
    case "active":
      return "Đang hoạt động";
    case "pending":
      return "Chờ phản hồi";
    case "rejected":
      return "Đã từ chối";
    case "removed":
      return "Đã kết thúc";
    default:
      return "Chưa xác định";
  }
};

const buildListWhereClause = (req: AuthRequest) => {
  const keyword = normalizeString(req.query.keyword);
  const status = normalizeString(req.query.status).toLowerCase();

  const conditions = [];

  if (status && status !== "all") {
    conditions.push(eq(shopCollaborators.shopCollaboratorsStatus, status));
  }

  if (keyword) {
    conditions.push(
      or(
        ilike(shops.shopName, `%${keyword}%`),
        ilike(users.userDisplayName, `%${keyword}%`),
        ilike(users.userEmail, `%${keyword}%`),
        ilike(users.userMobile, `%${keyword}%`),
      )!,
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
};

const buildNotificationByStatus = (
  status: CollaboratorStatus,
  shopName: string,
  note: string,
) => {
  if (status === "active") {
    return {
      title: "Quan hệ cộng tác đã được kích hoạt",
      message: `Bạn hiện đang được ghi nhận là cộng tác viên hoạt động của shop ${shopName}.`,
      type: "success" as const,
    };
  }

  if (status === "removed") {
    return {
      title: "Quan hệ cộng tác đã kết thúc",
      message: note
        ? `Quan hệ cộng tác với shop ${shopName} đã được quản trị viên kết thúc. Ghi chú: ${note}`
        : `Quan hệ cộng tác với shop ${shopName} đã được quản trị viên kết thúc.`,
      type: "warning" as const,
    };
  }

  if (status === "rejected") {
    return {
      title: "Lời mời cộng tác đã bị từ chối",
      message: note
        ? `Lời mời cộng tác với shop ${shopName} không được chấp nhận. Ghi chú: ${note}`
        : `Lời mời cộng tác với shop ${shopName} không được chấp nhận.`,
      type: "warning" as const,
    };
  }

  return {
    title: "Quan hệ cộng tác chuyển về chờ xử lý",
    message: note
      ? `Quan hệ cộng tác với shop ${shopName} đang được đưa về trạng thái chờ xử lý. Ghi chú: ${note}`
      : `Quan hệ cộng tác với shop ${shopName} đang được đưa về trạng thái chờ xử lý.`,
    type: "info" as const,
  };
};

export const getAdminCollaborators = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { page, limit, offset } = parsePagination(
      req.query.page,
      req.query.limit,
    );
    const whereClause = buildListWhereClause(req);

    const rows = await db
      .select({
        relationshipId: shopCollaborators.collaboratorId,
        shopId: shopCollaborators.shopCollaboratorsShopId,
        collaboratorId: shopCollaborators.collaboratorId,
        relationshipStatus: shopCollaborators.shopCollaboratorsStatus,
        joinedAt: shopCollaborators.shopCollaboratorsCreatedAt,
        shopName: shops.shopName,
        shopStatus: shops.shopStatus,
        collaboratorName: users.userDisplayName,
        collaboratorEmail: users.userEmail,
        collaboratorMobile: users.userMobile,
        roleTitle: businessRoles.businessRoleTitle,
        publishedPostCount: sql<number>`(
          select count(*)::int
          from posts p
          where p.post_author_id = ${shopCollaborators.collaboratorId}
            and p.post_shop_id = ${shopCollaborators.shopCollaboratorsShopId}
            and p.post_status = 'approved'
        )`,
        pendingPostCount: sql<number>`(
          select count(*)::int
          from posts p
          where p.post_author_id = ${shopCollaborators.collaboratorId}
            and p.post_shop_id = ${shopCollaborators.shopCollaboratorsShopId}
            and p.post_status in ('pending', 'pending_owner')
        )`,
      })
      .from(shopCollaborators)
      .innerJoin(
        shops,
        eq(shopCollaborators.shopCollaboratorsShopId, shops.shopId),
      )
      .innerJoin(users, eq(shopCollaborators.collaboratorId, users.userId))
      .leftJoin(
        businessRoles,
        eq(users.userBusinessRoleId, businessRoles.businessRoleId),
      )
      .where(whereClause)
      .orderBy(desc(shopCollaborators.shopCollaboratorsCreatedAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(shopCollaborators)
      .innerJoin(
        shops,
        eq(shopCollaborators.shopCollaboratorsShopId, shops.shopId),
      )
      .innerJoin(users, eq(shopCollaborators.collaboratorId, users.userId))
      .where(whereClause);

    const [summary] = await db
      .select({
        totalRelationships: sql<number>`count(*)`,
        activeRelationships:
          sql<number>`count(*) filter (where ${shopCollaborators.shopCollaboratorsStatus} = 'active')`,
        pendingRelationships:
          sql<number>`count(*) filter (where ${shopCollaborators.shopCollaboratorsStatus} = 'pending')`,
        endedRelationships:
          sql<number>`count(*) filter (where ${shopCollaborators.shopCollaboratorsStatus} in ('rejected', 'removed'))`,
      })
      .from(shopCollaborators)
      .innerJoin(
        shops,
        eq(shopCollaborators.shopCollaboratorsShopId, shops.shopId),
      )
      .innerJoin(users, eq(shopCollaborators.collaboratorId, users.userId))
      .where(whereClause);

    res.json({
      data: rows.map((row) => ({
        relationshipId: row.relationshipId,
        shopId: row.shopId,
        collaboratorId: row.collaboratorId,
        shopName: row.shopName,
        shopStatus: row.shopStatus,
        collaboratorName:
          normalizeString(row.collaboratorName) ||
          normalizeString(row.collaboratorEmail) ||
          `Cộng tác viên #${row.collaboratorId}`,
        collaboratorEmail: row.collaboratorEmail,
        collaboratorMobile: row.collaboratorMobile,
        roleTitle: row.roleTitle || "Cộng tác viên",
        relationshipStatus: row.relationshipStatus,
        relationshipStatusLabel: resolveRelationshipStatusLabel(
          row.relationshipStatus,
        ),
        joinedAt: row.joinedAt,
        publishedPostCount: Number(row.publishedPostCount ?? 0),
        pendingPostCount: Number(row.pendingPostCount ?? 0),
      })),
      meta: {
        page,
        limit,
        totalItems: Number(countResult?.count ?? 0),
        totalPages: Math.ceil(Number(countResult?.count ?? 0) / limit),
      },
      summary: {
        totalRelationships: Number(summary?.totalRelationships ?? 0),
        activeRelationships: Number(summary?.activeRelationships ?? 0),
        pendingRelationships: Number(summary?.pendingRelationships ?? 0),
        endedRelationships: Number(summary?.endedRelationships ?? 0),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Không thể tải danh sách cộng tác viên." });
  }
};

export const getAdminCollaboratorDetail = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const collaboratorId = parseId(req.params.id as string);
    const shopId = parseId(req.query.shopId as string);

    if (!collaboratorId || !shopId) {
      res.status(400).json({ error: "Thiếu thông tin shop hoặc cộng tác viên." });
      return;
    }

    const [relationship] = await db
      .select({
        shopId: shopCollaborators.shopCollaboratorsShopId,
        collaboratorId: shopCollaborators.collaboratorId,
        relationshipStatus: shopCollaborators.shopCollaboratorsStatus,
        joinedAt: shopCollaborators.shopCollaboratorsCreatedAt,
        shopName: shops.shopName,
        shopStatus: shops.shopStatus,
        shopEmail: shops.shopEmail,
        shopPhone: shops.shopPhone,
        collaboratorName: users.userDisplayName,
        collaboratorEmail: users.userEmail,
        collaboratorMobile: users.userMobile,
        collaboratorLocation: users.userLocation,
        collaboratorBio: users.userBio,
        roleCode: businessRoles.businessRoleCode,
        roleTitle: businessRoles.businessRoleTitle,
      })
      .from(shopCollaborators)
      .innerJoin(
        shops,
        eq(shopCollaborators.shopCollaboratorsShopId, shops.shopId),
      )
      .innerJoin(users, eq(shopCollaborators.collaboratorId, users.userId))
      .leftJoin(
        businessRoles,
        eq(users.userBusinessRoleId, businessRoles.businessRoleId),
      )
      .where(
        and(
          eq(shopCollaborators.shopCollaboratorsShopId, shopId),
          eq(shopCollaborators.collaboratorId, collaboratorId),
        ),
      )
      .limit(1);

    if (!relationship) {
      res.status(404).json({ error: "Không tìm thấy quan hệ cộng tác này." });
      return;
    }

    const recentPosts = await db
      .select({
        postId: posts.postId,
        title: posts.postTitle,
        status: posts.postStatus,
        createdAt: posts.postCreatedAt,
        updatedAt: posts.postUpdatedAt,
      })
      .from(posts)
      .where(
        and(
          eq(posts.postAuthorId, collaboratorId),
          eq(posts.postShopId, shopId),
        ),
      )
      .orderBy(desc(posts.postUpdatedAt), desc(posts.postCreatedAt))
      .limit(8);

    const [totals] = await db
      .select({
        totalPosts: sql<number>`count(*)`,
        approvedPosts:
          sql<number>`count(*) filter (where ${posts.postStatus} = 'approved')`,
        pendingPosts:
          sql<number>`count(*) filter (where ${posts.postStatus} in ('pending', 'pending_owner'))`,
        rejectedPosts:
          sql<number>`count(*) filter (where ${posts.postStatus} = 'rejected')`,
      })
      .from(posts)
      .where(
        and(
          eq(posts.postAuthorId, collaboratorId),
          eq(posts.postShopId, shopId),
        ),
      );

    res.json({
      data: {
        shopId: relationship.shopId,
        collaboratorId: relationship.collaboratorId,
        shopName: relationship.shopName,
        shopStatus: relationship.shopStatus,
        shopEmail: relationship.shopEmail,
        shopPhone: relationship.shopPhone,
        collaboratorName:
          normalizeString(relationship.collaboratorName) ||
          normalizeString(relationship.collaboratorEmail) ||
          `Cộng tác viên #${relationship.collaboratorId}`,
        collaboratorEmail: relationship.collaboratorEmail,
        collaboratorMobile: relationship.collaboratorMobile,
        collaboratorLocation: relationship.collaboratorLocation,
        collaboratorBio: relationship.collaboratorBio,
        roleCode: relationship.roleCode,
        roleTitle: relationship.roleTitle || "Cộng tác viên",
        relationshipStatus: relationship.relationshipStatus,
        relationshipStatusLabel: resolveRelationshipStatusLabel(
          relationship.relationshipStatus,
        ),
        joinedAt: relationship.joinedAt,
        postSummary: {
          totalPosts: Number(totals?.totalPosts ?? 0),
          approvedPosts: Number(totals?.approvedPosts ?? 0),
          pendingPosts: Number(totals?.pendingPosts ?? 0),
          rejectedPosts: Number(totals?.rejectedPosts ?? 0),
        },
        recentPosts,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Không thể tải chi tiết cộng tác viên." });
  }
};

export const updateAdminCollaboratorStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const collaboratorId = parseId(req.params.id as string);
    const shopId = parseId(req.body?.shopId);
    const nextStatus = normalizeString(
      (req.body as UpdateCollaboratorStatusPayload).status,
    ).toLowerCase() as CollaboratorStatus;
    const note = normalizeString((req.body as UpdateCollaboratorStatusPayload).note);

    if (!collaboratorId || !shopId) {
      res.status(400).json({ error: "Thiếu thông tin shop hoặc cộng tác viên." });
      return;
    }

    if (!["active", "pending", "rejected", "removed"].includes(nextStatus)) {
      res.status(400).json({ error: "Trạng thái cộng tác không hợp lệ." });
      return;
    }

    const [relationship] = await db
      .select({
        shopId: shopCollaborators.shopCollaboratorsShopId,
        collaboratorId: shopCollaborators.collaboratorId,
        previousStatus: shopCollaborators.shopCollaboratorsStatus,
        shopName: shops.shopName,
        collaboratorName: users.userDisplayName,
        collaboratorEmail: users.userEmail,
      })
      .from(shopCollaborators)
      .innerJoin(
        shops,
        eq(shopCollaborators.shopCollaboratorsShopId, shops.shopId),
      )
      .innerJoin(users, eq(shopCollaborators.collaboratorId, users.userId))
      .where(
        and(
          eq(shopCollaborators.shopCollaboratorsShopId, shopId),
          eq(shopCollaborators.collaboratorId, collaboratorId),
        ),
      )
      .limit(1);

    if (!relationship) {
      res.status(404).json({ error: "Không tìm thấy quan hệ cộng tác này." });
      return;
    }

    const previousStatus = relationship.previousStatus as CollaboratorStatus;
    if (previousStatus === nextStatus) {
      res.json({
        message: "Trạng thái cộng tác không thay đổi.",
        data: {
          relationshipStatus: previousStatus,
          relationshipStatusLabel: resolveRelationshipStatusLabel(previousStatus),
        },
      });
      return;
    }

    const allowedNextStatuses = ALLOWED_STATUS_TRANSITIONS[previousStatus] ?? [];
    if (!allowedNextStatuses.includes(nextStatus)) {
      res.status(400).json({
        error: `Không thể chuyển trạng thái từ ${resolveRelationshipStatusLabel(previousStatus)} sang ${resolveRelationshipStatusLabel(nextStatus)}.`,
      });
      return;
    }

    if ((nextStatus === "rejected" || nextStatus === "removed") && !note) {
      res.status(400).json({
        error: "Vui lòng nhập ghi chú khi từ chối hoặc kết thúc cộng tác.",
      });
      return;
    }

    const [updated] = await db
      .update(shopCollaborators)
      .set({
        shopCollaboratorsStatus: nextStatus,
      })
      .where(
        and(
          eq(shopCollaborators.shopCollaboratorsShopId, shopId),
          eq(shopCollaborators.collaboratorId, collaboratorId),
        ),
      )
      .returning();

    const performedBy = getPerformedBy(req);
    const notification = buildNotificationByStatus(
      nextStatus,
      relationship.shopName,
      note,
    );

    await notificationService.sendNotification({
      recipientId: collaboratorId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      metaData: {
        source: "admin_collaborator",
        shopId,
        collaboratorId,
        relationshipStatus: nextStatus,
      },
    });

    await db.insert(eventLogs).values({
      eventLogUserId: null,
      eventLogTargetType: "shop",
      eventLogTargetId: shopId,
      eventLogEventType: `${COLLABORATOR_EVENT_PREFIX}_${nextStatus}`,
      eventLogEventTime: new Date(),
      eventLogMeta: {
        collaboratorId,
        shopId,
        previousStatus: relationship.previousStatus,
        nextStatus,
        note,
        performedBy,
        collaboratorName:
          normalizeString(relationship.collaboratorName) ||
          normalizeString(relationship.collaboratorEmail) ||
          `Cộng tác viên #${collaboratorId}`,
        shopName: relationship.shopName,
      },
    });

    res.json({
      message: "Đã cập nhật trạng thái cộng tác.",
      data: {
        ...updated,
        relationshipStatusLabel: resolveRelationshipStatusLabel(
          updated.shopCollaboratorsStatus,
        ),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Không thể cập nhật trạng thái cộng tác." });
  }
};
