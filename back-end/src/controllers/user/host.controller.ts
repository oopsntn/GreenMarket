import { Request, Response } from "express";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../../config/db.ts";
import { AuthRequest } from "../../dtos/auth.ts";
import {
  hostContents,
  ledgers,
  transactions,
  userFavorites,
  users,
} from "../../models/schema/index.ts";
import { parseId } from "../../utils/parseId.ts";
import { hostIncomePolicyService } from "../../services/hostIncomePolicy.service.ts";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

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

const normalizePayoutStatus = (status: string | null | undefined) => {
  const normalized = (status || "").trim().toLowerCase();
  if (normalized === "success") {
    return "completed";
  }

  return normalized || "pending";
};

// --- Dashboard ---
export const getHostDashboard = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Chưa xác thực người dùng." });
      return;
    }

    await hostIncomePolicyService.syncForUser(userId);

    const [contentStats] = await db
      .select({
        totalContents: sql<number>`COUNT(*)`,
        totalViews:
          sql<number>`COALESCE(SUM(${hostContents.hostContentViewCount}), 0)`,
      })
      .from(hostContents)
      .where(eq(hostContents.hostContentAuthorId, userId));

    const [earningSummary] = await db
      .select({
        total:
          sql<string>`COALESCE(SUM(CASE WHEN ${ledgers.ledgerDirection} = 'CREDIT' THEN ${ledgers.ledgerAmount} ELSE 0 END), 0)`,
      })
      .from(ledgers)
      .where(eq(ledgers.ledgerUserId, userId));

    const [payoutSummary] = await db
      .select({
        total:
          sql<string>`COALESCE(SUM(${transactions.transactionAmount}), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.transactionUserId, userId),
          eq(transactions.transactionType, "payout"),
          eq(transactions.transactionStatus, "success"),
        ),
      );

    const totalEarnings = toNumber(earningSummary?.total);
    const paidOut = toNumber(payoutSummary?.total);

    res.json({
      stats: {
        totalContents: Number(contentStats?.totalContents ?? 0),
        totalViews: Number(contentStats?.totalViews ?? 0),
        totalEarnings,
        availableBalance: Math.max(totalEarnings - paidOut, 0),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ." });
  }
};

// --- Earnings ---
export const getHostEarnings = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Chưa xác thực người dùng." });
      return;
    }

    await hostIncomePolicyService.syncForUser(userId);
    const { page, limit, offset } = parsePagination(req.query.page, req.query.limit);

    const rows = await db
      .select()
      .from(ledgers)
      .where(eq(ledgers.ledgerUserId, userId))
      .orderBy(desc(ledgers.ledgerCreatedAt), desc(ledgers.ledgerId))
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
    res.status(500).json({ error: "Lỗi máy chủ nội bộ." });
  }
};

// --- Payouts ---
export const getPayoutRequests = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Chưa xác thực người dùng." });
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
        hostPayoutProcessedAt: transactions.transactionProcessedAt,
        hostPayoutCreatedAt: transactions.transactionCreatedAt,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.transactionUserId, userId),
          eq(transactions.transactionType, "payout"),
        ),
      )
      .orderBy(desc(transactions.transactionCreatedAt), desc(transactions.transactionId))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(
        and(
          eq(transactions.transactionUserId, userId),
          eq(transactions.transactionType, "payout"),
        ),
      );

    res.json({
      data: rows.map((item) => ({
        hostPayoutId: item.hostPayoutId,
        hostPayoutHostId: item.hostPayoutHostId,
        hostPayoutAmount: toNumber(item.hostPayoutAmount),
        hostPayoutMethod: item.hostPayoutMethod,
        hostPayoutStatus: normalizePayoutStatus(item.hostPayoutStatus),
        hostPayoutNote: item.hostPayoutNote,
        hostPayoutProcessedAt: item.hostPayoutProcessedAt,
        hostPayoutCreatedAt: item.hostPayoutCreatedAt,
      })),
      meta: {
        page,
        limit,
        totalItems: Number(countResult?.count ?? 0),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ." });
  }
};

export const createPayoutRequest = async (
  _req: AuthRequest,
  res: Response,
): Promise<void> => {
  res.status(410).json({
    error:
      "Luồng Host tự gửi yêu cầu chi trả không còn sử dụng. GreenMarket sẽ chuyển khoản thủ công và admin tự đánh dấu đã chi trả.",
  });
};

// --- Content CRUD ---
export const getContents = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Chưa xác thực người dùng." });
      return;
    }

    const rows = await db
      .select()
      .from(hostContents)
      .where(
        and(
          eq(hostContents.hostContentAuthorId, userId),
          sql`${hostContents.hostContentDeletedAt} IS NULL`,
        ),
      )
      .orderBy(desc(hostContents.hostContentCreatedAt), desc(hostContents.hostContentId));

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ." });
  }
};

export const createContent = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Chưa xác thực người dùng." });
      return;
    }

    const { title, description, body, category, mediaUrls } = req.body;

    if (!title) {
      res.status(400).json({ error: "Tiêu đề là bắt buộc." });
      return;
    }

    const policy = await hostIncomePolicyService.getPolicy();

    const [newContent] = await db
      .insert(hostContents)
      .values({
        hostContentAuthorId: userId,
        hostContentTitle: title,
        hostContentDescription: description,
        hostContentBody: body,
        hostContentCategory: category,
        hostContentMediaUrls: mediaUrls || [],
        hostContentPayoutAmount: policy.articlePayoutAmount.toFixed(2),
        hostContentStatus: "pending_admin",
      })
      .returning();

    res.status(201).json({
      ...newContent,
      message:
        "Bài Host đã được gửi chờ duyệt. Thu nhập chỉ được ghi nhận sau khi admin duyệt bài.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ." });
  }
};

export const updateContent = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const contentId = parseId(req.params.id as string);

    if (!userId || !contentId) {
      res.status(400).json({ error: "ID nội dung không hợp lệ." });
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
          eq(hostContents.hostContentAuthorId, userId),
        ),
      )
      .returning();

    if (!updated) {
      res.status(404).json({
        error: "Không tìm thấy nội dung hoặc bạn không có quyền chỉnh sửa.",
      });
      return;
    }

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ." });
  }
};

export const deleteContent = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const contentId = parseId(req.params.id as string);

    if (!userId || !contentId) {
      res.status(400).json({ error: "ID nội dung không hợp lệ." });
      return;
    }

    const [deleted] = await db
      .update(hostContents)
      .set({ hostContentDeletedAt: new Date() })
      .where(
        and(
          eq(hostContents.hostContentId, contentId),
          eq(hostContents.hostContentAuthorId, userId),
        ),
      )
      .returning();

    if (!deleted) {
      res.status(404).json({
        error: "Không tìm thấy nội dung hoặc bạn không có quyền xóa.",
      });
      return;
    }

    res.json({ message: "Đã ẩn nội dung thành công." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ." });
  }
};

// --- Public Content APIs ---
export const getPublicContents = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { page, limit, offset } = parsePagination(req.query.page, req.query.limit);
    const search = ((req.query.search as string) || "").trim();
    const category = ((req.query.category as string) || "").trim();

    const conditions: Array<
      ReturnType<typeof eq> | ReturnType<typeof sql> | ReturnType<typeof ilike> | ReturnType<typeof or>
    > = [
      eq(hostContents.hostContentStatus, "published"),
      sql`${hostContents.hostContentDeletedAt} IS NULL`,
    ];

    if (search) {
      conditions.push(
        or(
          ilike(hostContents.hostContentTitle, `%${search}%`),
          ilike(hostContents.hostContentDescription, `%${search}%`),
        )!,
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
    res.status(500).json({ error: "Lỗi máy chủ nội bộ." });
  }
};

export const getPublicContentDetail = async (
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> => {
  try {
    const contentId = parseId(req.params.id as string);
    if (!contentId) {
      res.status(400).json({ error: "ID nội dung không hợp lệ." });
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
          eq(hostContents.hostContentStatus, "published"),
          sql`${hostContents.hostContentDeletedAt} IS NULL`,
        ),
      )
      .limit(1);

    if (!content) {
      res.status(404).json({ error: "Không tìm thấy nội dung." });
      return;
    }

    await db
      .update(hostContents)
      .set({
        hostContentViewCount:
          sql`COALESCE(${hostContents.hostContentViewCount}, 0) + 1`,
      })
      .where(eq(hostContents.hostContentId, contentId));

    await hostIncomePolicyService.syncForContentIds([contentId]);

    res.json({
      ...content,
      hostContentViewCount: (content.hostContentViewCount || 0) + 1,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ." });
  }
};

// --- Favorite Content APIs ---
export const toggleFavoriteContent = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const contentId = parseId(req.params.id as string);

    if (!userId || !contentId) {
      res.status(400).json({ error: "ID người dùng hoặc nội dung không hợp lệ." });
      return;
    }

    const [content] = await db
      .select({ hostContentId: hostContents.hostContentId })
      .from(hostContents)
      .where(
        and(
          eq(hostContents.hostContentId, contentId),
          eq(hostContents.hostContentStatus, "published"),
          sql`${hostContents.hostContentDeletedAt} IS NULL`,
        ),
      )
      .limit(1);

    if (!content) {
      res.status(404).json({ error: "Không tìm thấy nội dung." });
      return;
    }

    const [existing] = await db
      .select()
      .from(userFavorites)
      .where(
        and(
          eq(userFavorites.userId, userId),
          eq(userFavorites.targetId, contentId),
          eq(userFavorites.targetType, "host_content"),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .delete(userFavorites)
        .where(
          and(
            eq(userFavorites.userId, userId),
            eq(userFavorites.targetId, contentId),
            eq(userFavorites.targetType, "host_content"),
          ),
        );
      res.json({ message: "Đã bỏ lưu nội dung.", isSaved: false });
      return;
    }

    await db.insert(userFavorites).values({
      userId,
      targetId: contentId,
      targetType: "host_content",
    });
    res.json({ message: "Đã lưu nội dung.", isSaved: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ." });
  }
};

export const getMyFavoriteContents = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Chưa xác thực người dùng." });
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
          sql`${hostContents.hostContentDeletedAt} IS NULL`,
        ),
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
          sql`${hostContents.hostContentDeletedAt} IS NULL`,
        ),
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
    res.status(500).json({ error: "Lỗi máy chủ nội bộ." });
  }
};

export const checkIsContentSaved = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
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
          eq(userFavorites.targetType, "host_content"),
        ),
      )
      .limit(1);

    res.json({ isSaved: Boolean(existing) });
  } catch (error) {
    console.error(error);
    res.json({ isSaved: false });
  }
};
