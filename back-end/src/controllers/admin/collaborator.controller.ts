import { Response } from "express";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../../config/db.ts";
import { AuthRequest } from "../../dtos/auth";
import {
  businessRoles,
  posts,
  shopCollaborators,
  shops,
  users,
} from "../../models/schema/index.ts";
import { parseId } from "../../utils/parseId.ts";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const normalizeString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const parsePagination = (queryPage: unknown, queryLimit: unknown) => {
  const page = Math.max(DEFAULT_PAGE, Number(queryPage) || DEFAULT_PAGE);
  const rawLimit = Number(queryLimit) || DEFAULT_LIMIT;
  const limit = Math.min(MAX_LIMIT, Math.max(1, rawLimit));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

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
