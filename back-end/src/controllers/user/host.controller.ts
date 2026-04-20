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
  earnings,
  payoutRequests,
  userFavorites,
  users,
  posts,
  shops,
} from "../../models/schema/index.ts";
import { parseId } from "../../utils/parseId.ts";
import { notificationService } from "../../services/notification.service.ts";
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

// --- Dashboard ---
export const getHostDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Chưa xác thực người dùng." });
      return;
    }

    await hostIncomePolicyService.syncForUser(userId);

    // KPI Summary
    const [contentStats] = await db
      .select({
        totalContents: sql<number>`COUNT(*)`,
        totalViews: sql<number>`COALESCE(SUM(${hostContents.hostContentViewCount}), 0)`,
      })
      .from(hostContents)
      .where(eq(hostContents.hostContentAuthorId, userId));

    const [earningSummary] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${earnings.amount}), 0)`,
        available: sql<string>`COALESCE(SUM(CASE WHEN ${earnings.status} = 'available' THEN ${earnings.amount} ELSE 0 END), 0)`,
      })
      .from(earnings)
      .where(eq(earnings.userId, userId));

    const [payoutSummary] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${payoutRequests.payoutRequestAmount}), 0)`,
      })
      .from(payoutRequests)
      .where(
        and(
          eq(payoutRequests.payoutRequestUserId, userId),
          sql`${payoutRequests.payoutRequestStatus} IN ('completed', 'pending')`
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
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

// --- Earnings ---
export const getHostEarnings = async (req: AuthRequest, res: Response): Promise<void> => {
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
      .from(earnings)
      .where(eq(earnings.userId, userId))
      .orderBy(desc(earnings.createdAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(earnings)
      .where(eq(earnings.userId, userId));

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
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

// --- Payouts ---
export const getPayoutRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Chưa xác thực người dùng." });
      return;
    }

    const { page, limit, offset } = parsePagination(req.query.page, req.query.limit);

    const rows = await db
      .select({
        hostPayoutId: payoutRequests.payoutRequestId,
        hostPayoutHostId: payoutRequests.payoutRequestUserId,
        hostPayoutAmount: payoutRequests.payoutRequestAmount,
        hostPayoutMethod: payoutRequests.payoutRequestMethod,
        hostPayoutStatus: payoutRequests.payoutRequestStatus,
        hostPayoutNote: payoutRequests.payoutRequestNote,
        hostPayoutProcessedAt: payoutRequests.payoutRequestProcessedAt,
        hostPayoutCreatedAt: payoutRequests.payoutRequestCreatedAt,
      })
      .from(payoutRequests)
      .where(eq(payoutRequests.payoutRequestUserId, userId))
      .orderBy(desc(payoutRequests.payoutRequestCreatedAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(payoutRequests)
      .where(eq(payoutRequests.payoutRequestUserId, userId));

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
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

export const createPayoutRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Chưa xác thực người dùng." });
      return;
    }

    await hostIncomePolicyService.syncForUser(userId);
    const policy = await hostIncomePolicyService.getPolicy();

    const amount = Number(req.body.amount);
    const method = req.body.method;
    const note = req.body.note;

    if (!amount || amount < policy.minimumPayoutRequestAmount) {
      res.status(400).json({
        error: `Số tiền yêu cầu phải từ ${policy.minimumPayoutRequestAmount.toLocaleString("vi-VN")} VND trở lên.`,
      });
      return;
    }

    if (!method) {
      res.status(400).json({ error: "Phương thức chi trả là bắt buộc." });
      return;
    }

    // Check balance
    const [earningSummary] = await db
      .select({
        available: sql<string>`COALESCE(SUM(CASE WHEN ${earnings.status} = 'available' THEN ${earnings.amount} ELSE 0 END), 0)`,
      })
      .from(earnings)
      .where(eq(earnings.userId, userId));

    const [payoutSummary] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${payoutRequests.payoutRequestAmount}), 0)`,
      })
      .from(payoutRequests)
      .where(
        and(
          eq(payoutRequests.payoutRequestUserId, userId),
          sql`${payoutRequests.payoutRequestStatus} IN ('completed', 'pending')`
        )
      );

    const availableBalance = toNumber(earningSummary?.available) - toNumber(payoutSummary?.total);

    if (amount > availableBalance) {
      res.status(400).json({ error: "Số dư có thể chi không đủ cho yêu cầu này." });
      return;
    }

    const [newRequest] = await db
      .insert(payoutRequests)
      .values({
        payoutRequestUserId: userId,
        payoutRequestAmount: amount.toFixed(2),
        payoutRequestMethod: method,
        payoutRequestNote: note,
        payoutRequestStatus: "pending",
        payoutRequestCreatedAt: new Date(),
      })
      .returning();

    // Map back to old field names for frontend compatibility if necessary
    const responseData = {
      hostPayoutId: newRequest.payoutRequestId,
      hostPayoutHostId: newRequest.payoutRequestUserId,
      hostPayoutAmount: toNumber(newRequest.payoutRequestAmount),
      hostPayoutMethod: newRequest.payoutRequestMethod,
      hostPayoutStatus: newRequest.payoutRequestStatus,
      hostPayoutNote: newRequest.payoutRequestNote,
      hostPayoutCreatedAt: newRequest.payoutRequestCreatedAt,
    };

    res.status(201).json({
      message: "Đã tạo yêu cầu chi trả thành công.",
      data: responseData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

// --- Content CRUD ---
export const getContents = async (req: AuthRequest, res: Response): Promise<void> => {
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
          sql`${hostContents.hostContentDeletedAt} IS NULL`
        )
      )
      .orderBy(desc(hostContents.hostContentCreatedAt));

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

export const createContent = async (req: AuthRequest, res: Response): Promise<void> => {
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
    const PAYOUT_AMOUNT = policy.articlePayoutAmount;

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
        hostContentStatus: "published", // Default to published for demo
      })
      .returning();

    await hostIncomePolicyService.syncForContentIds([newContent.hostContentId]);

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
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

export const updateContent = async (req: AuthRequest, res: Response): Promise<void> => {
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
          eq(hostContents.hostContentAuthorId, userId)
        )
      )
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Không tìm thấy nội dung hoặc bạn không có quyền chỉnh sửa." });
      return;
    }

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

export const deleteContent = async (req: AuthRequest, res: Response): Promise<void> => {
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
          eq(hostContents.hostContentAuthorId, userId)
        )
      )
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Không tìm thấy nội dung hoặc bạn không có quyền xóa." });
      return;
    }

    res.json({ message: "Content deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
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
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

export const getPublicContentDetail = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
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
          sql`${hostContents.hostContentDeletedAt} IS NULL`
        )
      )
      .limit(1);

    if (!content) {
      res.status(404).json({ error: "Không tìm thấy nội dung." });
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
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
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
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

export const getMyFavoriteContents = async (req: AuthRequest, res: Response): Promise<void> => {
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
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
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
