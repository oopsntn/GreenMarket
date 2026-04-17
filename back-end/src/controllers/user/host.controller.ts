import { Request, Response } from "express";
import {
  and,
  desc,
  eq,
  sql,
  ilike,
  or,
} from "drizzle-orm";
import { db } from "../../config/db.ts";
import { AuthRequest } from "../../dtos/auth.ts";
import {
  hostContents,
  hostEarnings,
  hostPayoutRequests,
  favoriteContents,
  users,
  posts,
  shops,
} from "../../models/schema/index.ts";
import { parseId } from "../../utils/parseId.ts";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MIN_PAYOUT_AMOUNT = 500_000;
const PUBLIC_CONTENT_TARGET_TYPES = new Set(["post", "shop", "external"]);

const parsePagination = (queryPage: unknown, queryLimit: unknown) => {
  const parsedPage = Number(queryPage);
  const parsedLimit = Number(queryLimit);

  const page =
    Number.isFinite(parsedPage) && parsedPage > 0
      ? Math.floor(parsedPage)
      : DEFAULT_PAGE;
  const limit =
    Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(Math.floor(parsedLimit), MAX_LIMIT)
      : DEFAULT_LIMIT;

  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const toNumber = (value: string | number | null | undefined) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

// --- Dashboard ---
export const getHostDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // KPI Summary
    const [contentStats] = await db
      .select({
        totalContents: sql<number>`COUNT(*)`,
        totalViews: sql<number>`COALESCE(SUM(${hostContents.hostContentViewCount}), 0)`,
        totalClicks: sql<number>`COALESCE(SUM(${hostContents.hostContentClickCount}), 0)`,
      })
      .from(hostContents)
      .where(eq(hostContents.hostContentAuthorId, userId));

    const [earningSummary] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${hostEarnings.hostEarningAmount}), 0)`,
        available: sql<string>`COALESCE(SUM(CASE WHEN ${hostEarnings.hostEarningStatus} = 'available' THEN ${hostEarnings.hostEarningAmount} ELSE 0 END), 0)`,
      })
      .from(hostEarnings)
      .where(eq(hostEarnings.hostEarningHostId, userId));

    const [payoutSummary] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${hostPayoutRequests.hostPayoutAmount}), 0)`,
      })
      .from(hostPayoutRequests)
      .where(
        and(
          eq(hostPayoutRequests.hostPayoutHostId, userId),
          eq(hostPayoutRequests.hostPayoutStatus, "completed")
        )
      );

    const totalEarnings = toNumber(earningSummary?.total);
    const paidOut = toNumber(payoutSummary?.total);
    const availableBalance = Math.max(toNumber(earningSummary?.available) - paidOut, 0);

    res.json({
      stats: {
        totalContents: Number(contentStats?.totalContents ?? 0),
        totalViews: Number(contentStats?.totalViews ?? 0),
        totalClicks: Number(contentStats?.totalClicks ?? 0),
        totalEarnings,
        availableBalance,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// --- Earnings ---
export const getHostEarnings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { page, limit, offset } = parsePagination(req.query.page, req.query.limit);

    const rows = await db
      .select()
      .from(hostEarnings)
      .where(eq(hostEarnings.hostEarningHostId, userId))
      .orderBy(desc(hostEarnings.hostEarningCreatedAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(hostEarnings)
      .where(eq(hostEarnings.hostEarningHostId, userId));

    res.json({
      data: rows,
      meta: {
        page,
        limit,
        totalItems: Number(countResult?.count ?? 0),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// --- Payouts ---
export const getPayoutRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { page, limit, offset } = parsePagination(req.query.page, req.query.limit);

    const rows = await db
      .select()
      .from(hostPayoutRequests)
      .where(eq(hostPayoutRequests.hostPayoutHostId, userId))
      .orderBy(desc(hostPayoutRequests.hostPayoutCreatedAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(hostPayoutRequests)
      .where(eq(hostPayoutRequests.hostPayoutHostId, userId));

    res.json({
      data: rows,
      meta: {
        page,
        limit,
        totalItems: Number(countResult?.count ?? 0),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createPayoutRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const amount = Number(req.body.amount);
    const method = req.body.method;
    const note = req.body.note;

    if (!amount || amount < MIN_PAYOUT_AMOUNT) {
      res.status(400).json({ error: `Amount must be at least ${MIN_PAYOUT_AMOUNT} VND` });
      return;
    }

    if (!method) {
      res.status(400).json({ error: "Payout method is required" });
      return;
    }

    // Check balance
    const [earningSummary] = await db
      .select({
        available: sql<string>`COALESCE(SUM(CASE WHEN ${hostEarnings.hostEarningStatus} = 'available' THEN ${hostEarnings.hostEarningAmount} ELSE 0 END), 0)`,
      })
      .from(hostEarnings)
      .where(eq(hostEarnings.hostEarningHostId, userId));

    const [payoutSummary] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${hostPayoutRequests.hostPayoutAmount}), 0)`,
      })
      .from(hostPayoutRequests)
      .where(
        and(
          eq(hostPayoutRequests.hostPayoutHostId, userId),
          sql`${hostPayoutRequests.hostPayoutStatus} IN ('completed', 'pending')`
        )
      );

    const availableBalance = toNumber(earningSummary?.available) - toNumber(payoutSummary?.total);

    if (amount > availableBalance) {
      res.status(400).json({ error: "Insufficient available balance" });
      return;
    }

    const [newRequest] = await db
      .insert(hostPayoutRequests)
      .values({
        hostPayoutHostId: userId,
        hostPayoutAmount: amount.toString(),
        hostPayoutMethod: method,
        hostPayoutNote: note,
        hostPayoutStatus: "pending",
      })
      .returning();

    res.status(201).json({
      message: "Payout request created successfully",
      data: newRequest,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// --- Content CRUD ---
export const getContents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const rows = await db
      .select()
      .from(hostContents)
      .where(
        and(
          eq(hostContents.hostContentAuthorId, userId),
          sql`${hostContents.hostContentDeletedAt} IS NULL`
        )
      )
      .orderBy(desc(hostContents.hostContentCreatedAt));

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createContent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { title, description, body, targetType, targetId, mediaUrls } = req.body;

    if (!title || !targetType) {
      res.status(400).json({ error: "Title and targetType are required" });
      return;
    }

    const [newContent] = await db
      .insert(hostContents)
      .values({
        hostContentAuthorId: userId,
        hostContentTitle: title,
        hostContentDescription: description,
        hostContentBody: body,
        hostContentTargetType: targetType,
        hostContentTargetId: targetId,
        hostContentMediaUrls: mediaUrls || [],
        hostContentStatus: "published",
      })
      .returning();

    // Generate tracking URL (Mock base URL)
    const baseUrl = process.env.BASE_URL || "http://localhost:5000";
    const trackingUrl = `${baseUrl}/api/host/tracking/${newContent.hostContentId}`;

    await db
      .update(hostContents)
      .set({ hostContentTrackingUrl: trackingUrl })
      .where(eq(hostContents.hostContentId, newContent.hostContentId));

    res.status(201).json({
      ...newContent,
      hostContentTrackingUrl: trackingUrl,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateContent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const contentId = parseId(req.params.id as string);

    if (!userId || !contentId) {
      res.status(400).json({ error: "Invalid content ID" });
      return;
    }

    const [updated] = await db
      .update(hostContents)
      .set({
        ...req.body,
        hostContentUpdatedAt: new Date(),
      })
      .where(
        and(
          eq(hostContents.hostContentId, contentId),
          eq(hostContents.hostContentAuthorId, userId)
        )
      )
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Content not found or not owned by you" });
      return;
    }

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteContent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const contentId = parseId(req.params.id as string);

    if (!userId || !contentId) {
      res.status(400).json({ error: "Invalid content ID" });
      return;
    }

    const [deleted] = await db
      .update(hostContents)
      .set({ hostContentDeletedAt: new Date() })
      .where(
        and(
          eq(hostContents.hostContentId, contentId),
          eq(hostContents.hostContentAuthorId, userId)
        )
      )
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Content not found or not owned by you" });
      return;
    }

    res.json({ message: "Content deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// --- Tracking ---
export const trackContentClick = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const contentId = parseId(req.params.id as string);
    if (!contentId) {
      res.status(400).json({ error: "Invalid content ID" });
      return;
    }

    const [content] = await db
      .select()
      .from(hostContents)
      .where(eq(hostContents.hostContentId, contentId))
      .limit(1);

    if (!content) {
      res.status(404).json({ error: "Content not found" });
      return;
    }

    // Logging Click
    await db
      .update(hostContents)
      .set({ hostContentClickCount: (content.hostContentClickCount || 0) + 1 })
      .where(eq(hostContents.hostContentId, contentId));

    // Log Earning (Mock: 5,000 VND per click)
    await db
      .insert(hostEarnings)
      .values({
        hostEarningHostId: content.hostContentAuthorId,
        hostEarningAmount: "5000.00",
        hostEarningStatus: "available",
        hostEarningSourceType: "click",
        hostEarningSourceId: contentId,
      });

    // Redirect Logic
    const frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    let redirectUrl = frontendBaseUrl;

    if (content.hostContentTargetType === "post" && content.hostContentTargetId) {
       // Need to find post slug
       const [post] = await db.select({ slug: posts.postSlug }).from(posts).where(eq(posts.postId, content.hostContentTargetId)).limit(1);
       if (post) redirectUrl = `${frontendBaseUrl}/posts/detail/${post.slug}`;
    } else if (content.hostContentTargetType === "shop" && content.hostContentTargetId) {
       redirectUrl = `${frontendBaseUrl}/shops/${content.hostContentTargetId}`;
    }

    res.redirect(redirectUrl);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// --- Public Content APIs ---
export const getPublicContents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, offset } = parsePagination(req.query.page, req.query.limit);
    const search = (req.query.search as string) || "";
    const targetType = (req.query.targetType as string) || "";
    const normalizedTargetType = targetType.trim().toLowerCase();

    const conditions = [
      eq(hostContents.hostContentStatus, "published"),
      sql`${hostContents.hostContentDeletedAt} IS NULL`,
    ];

    if (search.trim()) {
      conditions.push(
        or(
          ilike(hostContents.hostContentTitle, `%${search.trim()}%`),
          ilike(hostContents.hostContentDescription, `%${search.trim()}%`)
        )!
      );
    }

    if (normalizedTargetType) {
      if (!PUBLIC_CONTENT_TARGET_TYPES.has(normalizedTargetType)) {
        res.status(400).json({ error: "targetType must be one of: post, shop" });
        return;
      }

      conditions.push(eq(hostContents.hostContentTargetType, normalizedTargetType));
    }

    const rows = await db
      .select({
        hostContentId: hostContents.hostContentId,
        hostContentTitle: hostContents.hostContentTitle,
        hostContentDescription: hostContents.hostContentDescription,
        hostContentBody: hostContents.hostContentBody,
        hostContentTargetType: hostContents.hostContentTargetType,
        hostContentTargetId: hostContents.hostContentTargetId,
        hostContentMediaUrls: hostContents.hostContentMediaUrls,
        hostContentViewCount: hostContents.hostContentViewCount,
        hostContentClickCount: hostContents.hostContentClickCount,
        hostContentCreatedAt: hostContents.hostContentCreatedAt,
        authorId: users.userId,
        authorName: users.userDisplayName,
        authorAvatar: users.userAvatarUrl,
      })
      .from(hostContents)
      .leftJoin(users, eq(hostContents.hostContentAuthorId, users.userId))
      .where(and(...conditions))
      .orderBy(desc(hostContents.hostContentCreatedAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(hostContents)
      .where(and(...conditions));

    res.json({
      data: rows,
      meta: {
        page,
        limit,
        totalItems: Number(countResult?.count ?? 0),
        totalPages: Math.ceil(Number(countResult?.count ?? 0) / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getPublicContentDetail = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const contentId = parseId(req.params.id as string);
    if (!contentId) {
      res.status(400).json({ error: "Invalid content ID" });
      return;
    }

    const [content] = await db
      .select({
        hostContentId: hostContents.hostContentId,
        hostContentTitle: hostContents.hostContentTitle,
        hostContentDescription: hostContents.hostContentDescription,
        hostContentBody: hostContents.hostContentBody,
        hostContentTargetType: hostContents.hostContentTargetType,
        hostContentTargetId: hostContents.hostContentTargetId,
        hostContentTrackingUrl: hostContents.hostContentTrackingUrl,
        hostContentMediaUrls: hostContents.hostContentMediaUrls,
        hostContentViewCount: hostContents.hostContentViewCount,
        hostContentClickCount: hostContents.hostContentClickCount,
        hostContentCreatedAt: hostContents.hostContentCreatedAt,
        hostContentUpdatedAt: hostContents.hostContentUpdatedAt,
        authorId: users.userId,
        authorName: users.userDisplayName,
        authorAvatar: users.userAvatarUrl,
      })
      .from(hostContents)
      .leftJoin(users, eq(hostContents.hostContentAuthorId, users.userId))
      .where(
        and(
          eq(hostContents.hostContentId, contentId),
          eq(hostContents.hostContentStatus, "published"),
          sql`${hostContents.hostContentDeletedAt} IS NULL`
        )
      )
      .limit(1);

    if (!content) {
      res.status(404).json({ error: "Content not found" });
      return;
    }

    // Increment view count
    await db
      .update(hostContents)
      .set({
        hostContentViewCount: sql`COALESCE(${hostContents.hostContentViewCount}, 0) + 1`,
      })
      .where(eq(hostContents.hostContentId, contentId));

    // Fetch linked target details
    let target: any = null;
    if (content.hostContentTargetType === "post" && content.hostContentTargetId) {
      const [post] = await db
        .select({ postId: posts.postId, postTitle: posts.postTitle, postSlug: posts.postSlug })
        .from(posts)
        .where(eq(posts.postId, content.hostContentTargetId))
        .limit(1);
      target = post || null;
    } else if (content.hostContentTargetType === "shop" && content.hostContentTargetId) {
      const [shop] = await db
        .select({ shopId: shops.shopId, shopName: shops.shopName, shopLogoUrl: shops.shopLogoUrl })
        .from(shops)
        .where(eq(shops.shopId, content.hostContentTargetId))
        .limit(1);
      target = shop || null;
    }

    res.json({
      ...content,
      hostContentViewCount: (content.hostContentViewCount || 0) + 1,
      target,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// --- Favorite Content APIs ---
export const toggleFavoriteContent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const contentId = parseId(req.params.id as string);

    if (!userId || !contentId) {
      res.status(400).json({ error: "Invalid user or content ID" });
      return;
    }

    // Verify content exists and is published
    const [content] = await db
      .select({ hostContentId: hostContents.hostContentId })
      .from(hostContents)
      .where(
        and(
          eq(hostContents.hostContentId, contentId),
          eq(hostContents.hostContentStatus, "published"),
          sql`${hostContents.hostContentDeletedAt} IS NULL`
        )
      )
      .limit(1);

    if (!content) {
      res.status(404).json({ error: "Content not found" });
      return;
    }

    const [existing] = await db
      .select()
      .from(favoriteContents)
      .where(
        and(
          eq(favoriteContents.favoriteContentUserId, userId),
          eq(favoriteContents.favoriteContentId, contentId)
        )
      )
      .limit(1);

    if (existing) {
      await db
        .delete(favoriteContents)
        .where(
          and(
            eq(favoriteContents.favoriteContentUserId, userId),
            eq(favoriteContents.favoriteContentId, contentId)
          )
        );
      res.json({ message: "Content removed from bookmarks", isSaved: false });
    } else {
      await db.insert(favoriteContents).values({
        favoriteContentUserId: userId,
        favoriteContentId: contentId,
      });
      res.json({ message: "Content added to bookmarks", isSaved: true });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMyFavoriteContents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { page, limit, offset } = parsePagination(req.query.page, req.query.limit);

    const rows = await db
      .select({
        favoriteCreatedAt: favoriteContents.favoriteContentCreatedAt,
        hostContentId: hostContents.hostContentId,
        hostContentTitle: hostContents.hostContentTitle,
        hostContentDescription: hostContents.hostContentDescription,
        hostContentTargetType: hostContents.hostContentTargetType,
        hostContentMediaUrls: hostContents.hostContentMediaUrls,
        hostContentViewCount: hostContents.hostContentViewCount,
        hostContentCreatedAt: hostContents.hostContentCreatedAt,
        authorName: users.userDisplayName,
        authorAvatar: users.userAvatarUrl,
        authorId: users.userId,
      })
      .from(favoriteContents)
      .innerJoin(hostContents, eq(favoriteContents.favoriteContentId, hostContents.hostContentId))
      .leftJoin(users, eq(hostContents.hostContentAuthorId, users.userId))
      .where(
        and(
          eq(favoriteContents.favoriteContentUserId, userId),
          eq(hostContents.hostContentStatus, "published"),
          sql`${hostContents.hostContentDeletedAt} IS NULL`
        )
      )
      .orderBy(desc(favoriteContents.favoriteContentCreatedAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(favoriteContents)
      .innerJoin(hostContents, eq(favoriteContents.favoriteContentId, hostContents.hostContentId))
      .where(
        and(
          eq(favoriteContents.favoriteContentUserId, userId),
          eq(hostContents.hostContentStatus, "published"),
          sql`${hostContents.hostContentDeletedAt} IS NULL`
        )
      );

    res.json({
      data: rows,
      meta: {
        page,
        limit,
        totalItems: Number(countResult?.count ?? 0),
        totalPages: Math.ceil(Number(countResult?.count ?? 0) / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const checkIsContentSaved = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const contentId = parseId(req.params.id as string);
    if (!userId || !contentId) {
      res.json({ isSaved: false });
      return;
    }

    const [existing] = await db
      .select()
      .from(favoriteContents)
      .where(
        and(
          eq(favoriteContents.favoriteContentUserId, userId),
          eq(favoriteContents.favoriteContentId, contentId)
        )
      )
      .limit(1);

    res.json({ isSaved: !!existing });
  } catch (error) {
    console.error(error);
    res.json({ isSaved: false });
  }
};
