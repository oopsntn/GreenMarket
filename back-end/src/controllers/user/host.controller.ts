import { Request, Response } from "express";
import {
  and,
  desc,
  eq,
  sql,
  ilike,
  or,
  inArray,
} from "drizzle-orm";
import { db } from "../../config/db.ts";
import { AuthRequest } from "../../dtos/auth.ts";
import {
  hostContents,
  ledgers,
  transactions,
  userFavorites,
  users,
  posts,
  shops,
} from "../../models/schema/index.ts";
import { parseId } from "../../utils/parseId.ts";
import { notificationService } from "../../services/notification.service.ts";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MIN_PAYOUT_AMOUNT = 500_000;

const PUBLIC_HOST_CONTENT_STATUSES = ["published"] as const;

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
      })
      .from(hostContents)
      .where(
        and(
          eq(hostContents.hostContentAuthorId, userId),
          inArray(hostContents.hostContentStatus, [...PUBLIC_HOST_CONTENT_STATUSES]),
          sql`${hostContents.hostContentDeletedAt} IS NULL`,
        ),
      );

    const [earningSummary] = await db
      .select({
        total: sql<string>`COALESCE(SUM(CASE WHEN ${ledgers.ledgerDirection} = 'CREDIT' THEN ${ledgers.ledgerAmount} ELSE 0 END), 0)`,
        available: sql<string>`COALESCE(SUM(CASE WHEN ${ledgers.ledgerDirection} = 'CREDIT' AND ${ledgers.ledgerStatus} = 'available' THEN ${ledgers.ledgerAmount} ELSE 0 END), 0)`,
      })
      .from(ledgers)
      .where(eq(ledgers.ledgerUserId, userId));

    const [payoutSummary] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${transactions.transactionAmount}), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.transactionUserId, userId),
          eq(transactions.transactionType, "payout"),
          eq(transactions.transactionStatus, "success")
        )
      );

    const totalEarnings = toNumber(earningSummary?.total);
    const paidOut = toNumber(payoutSummary?.total);
    const availableBalance = Math.max(toNumber(earningSummary?.available) - paidOut, 0);

    res.json({
      stats: {
        totalContents: Number(contentStats?.totalContents ?? 0),
        totalViews: Number(contentStats?.totalViews ?? 0),
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
      .from(ledgers)
      .where(eq(ledgers.ledgerUserId, userId))
      .orderBy(desc(ledgers.ledgerCreatedAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(ledgers)
      .where(eq(ledgers.ledgerUserId, userId));

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
      .select({
        hostPayoutId: transactions.transactionId,
        hostPayoutHostId: transactions.transactionUserId,
        hostPayoutAmount: transactions.transactionAmount,
        hostPayoutMethod: transactions.transactionProvider,
        hostPayoutStatus: transactions.transactionStatus,
        hostPayoutNote: sql<string>`${transactions.transactionMeta}->>'note'`,
        hostPayoutProcessedAt: transactions.transactionUpdatedAt,
        hostPayoutCreatedAt: transactions.transactionCreatedAt,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.transactionUserId, userId),
          eq(transactions.transactionType, "payout")
        )
      )
      .orderBy(desc(transactions.transactionCreatedAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(
        and(
          eq(transactions.transactionUserId, userId),
          eq(transactions.transactionType, "payout")
        )
      );

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
        available: sql<string>`COALESCE(SUM(CASE WHEN ${ledgers.ledgerDirection} = 'CREDIT' AND ${ledgers.ledgerStatus} = 'available' THEN ${ledgers.ledgerAmount} ELSE 0 END), 0)`,
      })
      .from(ledgers)
      .where(eq(ledgers.ledgerUserId, userId));

    const [payoutSummary] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${transactions.transactionAmount}), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.transactionUserId, userId),
          eq(transactions.transactionType, "payout"),
          sql`${transactions.transactionStatus} IN ('success', 'pending')`
        )
      );

    const availableBalance = toNumber(earningSummary?.available) - toNumber(payoutSummary?.total);

    if (amount > availableBalance) {
      res.status(400).json({ error: "Insufficient available balance" });
      return;
    }

    const [newRequest] = await db
      .insert(transactions)
      .values({
        transactionUserId: userId,
        transactionType: "payout",
        transactionAmount: amount.toFixed(2),
        transactionProvider: method,
        transactionMeta: { note },
        transactionStatus: "pending",
        transactionCreatedAt: new Date(),
      })
      .returning();

    // Map back to old field names for frontend compatibility if necessary
    const responseData = {
      hostPayoutId: newRequest.transactionId,
      hostPayoutHostId: newRequest.transactionUserId,
      hostPayoutAmount: toNumber(newRequest.transactionAmount),
      hostPayoutMethod: newRequest.transactionProvider,
      hostPayoutStatus: newRequest.transactionStatus,
      hostPayoutNote: note,
      hostPayoutCreatedAt: newRequest.transactionCreatedAt,
    };

    res.status(201).json({
      message: "Payout request created successfully",
      data: responseData,
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

    const { title, description, body, category, mediaUrls, payoutAmount } = req.body;

    if (!title) {
      res.status(400).json({ error: "Title is required" });
      return;
    }

    const [newContent] = await db
      .insert(hostContents)
      .values({
        hostContentAuthorId: userId,
        hostContentTitle: title,
        hostContentDescription: description,
        hostContentBody: body,
        hostContentCategory: category,
        hostContentMediaUrls: mediaUrls || [],
        hostContentPayoutAmount: payoutAmount?.toString(),
        hostContentStatus: "published", // Default to published for demo
      })
      .returning();

    // 1. Create earning for host
    const PAYOUT_AMOUNT = 50000;
    await db.insert(ledgers).values({
      ledgerUserId: userId,
      ledgerAmount: PAYOUT_AMOUNT.toString(),
      ledgerType: "earning",
      ledgerDirection: "CREDIT",
      ledgerStatus: "available",
      ledgerMeta: {
        type: "article_payout",
        sourceId: newContent.hostContentId
      },
    });

    // 2. Notify host
    await notificationService.sendNotification({
      recipientId: userId,
      title: "Thu nhập mới!",
      message: `Bạn vừa nhận được ${PAYOUT_AMOUNT.toLocaleString("vi-VN")} VND cho bài viết mới: "${title}".`,
      type: "earning",
      metaData: { contentId: newContent.hostContentId },
    });

    res.status(201).json(newContent);
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

// --- Public Content APIs ---
export const getPublicContents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, offset } = parsePagination(req.query.page, req.query.limit);
    const search = ((req.query.search as string) || "").trim();
    const category = ((req.query.category as string) || "").trim();

    const conditions: any[] = [
      eq(hostContents.hostContentStatus, "published"),
      sql`${hostContents.hostContentDeletedAt} IS NULL`,
    ];

    if (search) {
      conditions.push(
        or(
          ilike(hostContents.hostContentTitle, `%${search}%`),
          ilike(hostContents.hostContentDescription, `%${search}%`)
        )
      );
    }

    if (category) {
      conditions.push(ilike(hostContents.hostContentCategory, `%${category}%`));
    }

    const rows = await db
      .select({
        hostContentId: hostContents.hostContentId,
        hostContentTitle: hostContents.hostContentTitle,
        hostContentDescription: hostContents.hostContentDescription,
        hostContentBody: hostContents.hostContentBody,
        hostContentCategory: hostContents.hostContentCategory,
        hostContentMediaUrls: hostContents.hostContentMediaUrls,
        hostContentViewCount: hostContents.hostContentViewCount,
        hostContentCreatedAt: hostContents.hostContentCreatedAt,
        authorId: users.userId,
        authorName: users.userDisplayName,
        authorAvatar: users.userAvatarUrl,
      })
      .from(hostContents)
      .leftJoin(users, eq(hostContents.hostContentAuthorId, users.userId))
      .where(and(...conditions))
      .orderBy(desc(hostContents.hostContentCreatedAt), desc(hostContents.hostContentId))
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
        hostContentCategory: hostContents.hostContentCategory,
        hostContentMediaUrls: hostContents.hostContentMediaUrls,
        hostContentViewCount: hostContents.hostContentViewCount,
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
          inArray(hostContents.hostContentStatus, [...PUBLIC_HOST_CONTENT_STATUSES]),
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

    res.json({
      ...content,
      hostContentViewCount: (content.hostContentViewCount || 0) + 1,
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
          inArray(hostContents.hostContentStatus, [...PUBLIC_HOST_CONTENT_STATUSES]),
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
      .from(userFavorites)
      .where(
        and(
          eq(userFavorites.userId, userId),
          eq(userFavorites.targetId, contentId),
          eq(userFavorites.targetType, "host_content")
        )
      )
      .limit(1);

    if (existing) {
      await db
        .delete(userFavorites)
        .where(
          and(
            eq(userFavorites.userId, userId),
            eq(userFavorites.targetId, contentId),
            eq(userFavorites.targetType, "host_content")
          )
        );
      res.json({ message: "Content removed from bookmarks", isSaved: false });
    } else {
      await db.insert(userFavorites).values({
        userId: userId,
        targetId: contentId,
        targetType: "host_content"
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
        favoriteCreatedAt: userFavorites.createdAt,
        hostContentId: hostContents.hostContentId,
        hostContentTitle: hostContents.hostContentTitle,
        hostContentDescription: hostContents.hostContentDescription,
        hostContentCategory: hostContents.hostContentCategory,
        hostContentMediaUrls: hostContents.hostContentMediaUrls,
        hostContentViewCount: hostContents.hostContentViewCount,
        hostContentCreatedAt: hostContents.hostContentCreatedAt,
        authorName: users.userDisplayName,
        authorAvatar: users.userAvatarUrl,
        authorId: users.userId,
      })
      .from(userFavorites)
      .innerJoin(hostContents, eq(userFavorites.targetId, hostContents.hostContentId))
      .leftJoin(users, eq(hostContents.hostContentAuthorId, users.userId))
      .where(
        and(
          eq(userFavorites.userId, userId),
          eq(userFavorites.targetType, "host_content"),
          eq(hostContents.hostContentStatus, "published"),
          sql`${hostContents.hostContentDeletedAt} IS NULL`
        )
      )
      .orderBy(desc(userFavorites.createdAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(userFavorites)
      .innerJoin(hostContents, eq(userFavorites.targetId, hostContents.hostContentId))
      .where(
        and(
          eq(userFavorites.userId, userId),
          eq(userFavorites.targetType, "host_content"),
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
      .from(userFavorites)
      .where(
        and(
          eq(userFavorites.userId, userId),
          eq(userFavorites.targetId, contentId),
          eq(userFavorites.targetType, "host_content")
        )
      )
      .limit(1);

    res.json({ isSaved: !!existing });
  } catch (error) {
    console.error(error);
    res.json({ isSaved: false });
  }
};
