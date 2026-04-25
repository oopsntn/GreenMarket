import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../config/db";
import {
  eventLogs,
  transactions,
  placementSlots,
  postPromotions,
  posts,
  promotionPackages,
  shops,
} from "../models/schema/index.ts";
import { BOOST_POST_SLOT_PREFIX } from "../constants/promotion";

const SHOP_EVENT_VIEW = "shop_view";
const SHOP_EVENT_CONTACT_CLICK = "shop_contact_click";

export class OwnerDashboardError extends Error {
  statusCode: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

const toNumber = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export type OwnerDashboardResponse = {
  shop: {
    shopId: number;
    shopName: string | null;
    shopStatus: string | null;
  };
  summary: {
    totalPosts: number;
    approvedPosts: number;
    pendingPosts: number;
    rejectedPosts: number;
    totalViews: number;
    totalContacts: number;
    totalShopViews: number;
    totalShopContactClicks: number;
    contactRate: number;
    postContactRate: number;
    totalPromotionSpend: number;
    totalBoostPackageSpend: number;
    successfulPayments: number;
    successfulBoostPurchases: number;
    activePromotions: number;
    boostedPostsActive: number;
    pendingCollaboratorPosts: number;
  };
  topPosts: Array<{
    postId: number;
    postTitle: string;
    postSlug: string;
    postStatus: string;
    postViewCount: number;
    postContactCount: number;
    isPromoted: boolean;
    postUpdatedAt: Date | null;
  }>;
  recentPayments: Array<{
    paymentTxnId: number;
    paymentTxnProviderTxnId: string | null;
    paymentTxnStatus: string | null;
    paymentTxnAmount: number;
    paymentTxnCreatedAt: Date | null;
    postId: number | null;
    postTitle: string | null;
    packageId: number | null;
    packageTitle: string | null;
  }>;
};

export const ownerDashboardService = {
  async getByOwnerId(userId: number): Promise<OwnerDashboardResponse> {
    const [shop] = await db
      .select({
        shopId: shops.shopId,
        shopName: shops.shopName,
        shopStatus: shops.shopStatus,
      })
      .from(shops)
      .where(eq(shops.shopId, userId))
      .limit(1);

    if (!shop) {
      throw new OwnerDashboardError(
        404,
        "SHOP_NOT_FOUND",
        "Shop profile not found for this account.",
      );
    }

    if (shop.shopStatus !== "active") {
      throw new OwnerDashboardError(
        403,
        "SHOP_NOT_ACTIVE",
        "Shop must be active to access owner dashboard.",
        { shopStatus: shop.shopStatus },
      );
    }

    const shopPosts = await db
      .select({
        postId: posts.postId,
        postTitle: posts.postTitle,
        postSlug: posts.postSlug,
        postStatus: posts.postStatus,
        postViewCount: posts.postViewCount,
        postContactCount: posts.postContactCount,
        postUpdatedAt: posts.postUpdatedAt,
      })
      .from(posts)
      .where(eq(posts.postShopId, shop.shopId));

    const postIds = shopPosts.map((item) => item.postId);
    const postIdSet = new Set(postIds);
    const now = new Date();

    const promotions = await db
      .select({
        postPromotionPostId: postPromotions.postPromotionPostId,
        postPromotionStatus: postPromotions.postPromotionStatus,
        postPromotionEndAt: postPromotions.postPromotionEndAt,
      })
      .from(postPromotions)
      .innerJoin(
        placementSlots,
        eq(postPromotions.postPromotionSlotId, placementSlots.placementSlotId),
      )
      .where(
        and(
          eq(postPromotions.postPromotionBuyerId, userId),
          sql`UPPER(${placementSlots.placementSlotCode}) LIKE ${`${BOOST_POST_SLOT_PREFIX}%`}`,
        ),
      );

    const activePromotionPostIds = new Set<number>();
    let activePromotions = 0;

    for (const item of promotions) {
      if (!postIdSet.has(item.postPromotionPostId)) continue;
      if (item.postPromotionStatus !== "active") continue;
      if (!item.postPromotionEndAt || item.postPromotionEndAt.getTime() <= now.getTime()) {
        continue;
      }

      activePromotions += 1;
      activePromotionPostIds.add(item.postPromotionPostId);
    }

    const paymentRows = await db
      .select({
        paymentTxnId: transactions.transactionId,
        paymentTxnProviderTxnId: transactions.transactionProviderTxnId,
        paymentTxnStatus: transactions.transactionStatus,
        paymentTxnAmount: transactions.transactionAmount,
        paymentTxnCreatedAt: transactions.transactionCreatedAt,
        postId: sql<number | null>`(${transactions.transactionMeta}->>'postId')::int`,
        postTitle: posts.postTitle,
        packageId: sql<number | null>`CASE WHEN ${transactions.transactionReferenceType} = 'promotion_package' THEN (${transactions.transactionReferenceId})::int ELSE NULL END`,
        packageTitle: promotionPackages.promotionPackageTitle,
      })
      .from(transactions)
      .leftJoin(posts, eq(sql<number>`(${transactions.transactionMeta}->>'postId')::int`, posts.postId))
      .leftJoin(
        promotionPackages,
        eq(sql<number>`(${transactions.transactionReferenceId})::int`, promotionPackages.promotionPackageId),
      )
      .where(eq(transactions.transactionUserId, userId))
      .orderBy(desc(transactions.transactionCreatedAt));

    const shopPayments = paymentRows.filter((item) => {
      // Include if it belongs to a post in this shop
      if (item.postId !== null && postIdSet.has(item.postId)) return true;
      // Include shop-level/account-level transactions (where postId is null)
      if (item.postId === null) return true;
      return false;
    });

    const successfulPaymentRows = shopPayments.filter(
      (item) => item.paymentTxnStatus === "success",
    );

    const totalPromotionSpend = successfulPaymentRows.reduce(
      (sum, item) => sum + toNumber(item.paymentTxnAmount),
      0,
    );

    const totalViews = shopPosts.reduce(
      (sum, item) => sum + (item.postViewCount ?? 0),
      0,
    );
    const totalContacts = shopPosts.reduce(
      (sum, item) => sum + (item.postContactCount ?? 0),
      0,
    );
    const shopEventRows = await db
      .select({
        eventType: eventLogs.eventLogEventType,
        total: sql<number>`count(*)`,
      })
      .from(eventLogs)
      .where(
        and(
          eq(eventLogs.eventLogTargetType, "shop"),
          eq(eventLogs.eventLogTargetId, shop.shopId),
          inArray(eventLogs.eventLogEventType, [
            SHOP_EVENT_VIEW,
            SHOP_EVENT_CONTACT_CLICK,
          ]),
        ),
      )
      .groupBy(eventLogs.eventLogEventType);

    let totalShopViews = 0;
    let totalShopContactClicks = 0;

    for (const event of shopEventRows) {
      const count = toNumber(event.total);
      if (event.eventType === SHOP_EVENT_VIEW) {
        totalShopViews = count;
      } else if (event.eventType === SHOP_EVENT_CONTACT_CLICK) {
        totalShopContactClicks = count;
      }
    }

    const topPosts = [...shopPosts]
      .sort((a, b) => {
        const viewDiff = (b.postViewCount ?? 0) - (a.postViewCount ?? 0);
        if (viewDiff !== 0) return viewDiff;

        const left = a.postUpdatedAt?.getTime() ?? 0;
        const right = b.postUpdatedAt?.getTime() ?? 0;
        return right - left;
      })
      .slice(0, 5)
      .map((item) => ({
        postId: item.postId,
        postTitle: item.postTitle,
        postSlug: item.postSlug,
        postStatus: item.postStatus,
        postViewCount: item.postViewCount ?? 0,
        postContactCount: item.postContactCount ?? 0,
        isPromoted: activePromotionPostIds.has(item.postId),
        postUpdatedAt: item.postUpdatedAt ?? null,
      }));

    const postContactRate =
      totalViews > 0
        ? Number(((totalContacts / totalViews) * 100).toFixed(2))
        : 0;

    return {
      shop,
      summary: {
        totalPosts: shopPosts.length,
        approvedPosts: shopPosts.filter((item) => item.postStatus === "approved").length,
        pendingPosts: shopPosts.filter((item) => item.postStatus === "pending").length,
        rejectedPosts: shopPosts.filter((item) => item.postStatus === "rejected").length,
        totalViews,
        totalContacts,
        totalShopViews,
        totalShopContactClicks,
        contactRate: postContactRate,
        postContactRate,
        totalPromotionSpend,
        totalBoostPackageSpend: totalPromotionSpend,
        successfulPayments: successfulPaymentRows.length,
        successfulBoostPurchases: successfulPaymentRows.length,
        activePromotions,
        boostedPostsActive: activePromotions,
        pendingCollaboratorPosts: shopPosts.filter((item) => item.postStatus === "pending_owner").length,
      },
      topPosts,
      recentPayments: shopPayments.slice(0, 10).map((item) => ({
        paymentTxnId: item.paymentTxnId,
        paymentTxnProviderTxnId: item.paymentTxnProviderTxnId,
        paymentTxnStatus: item.paymentTxnStatus,
        paymentTxnAmount: toNumber(item.paymentTxnAmount),
        paymentTxnCreatedAt: item.paymentTxnCreatedAt,
        postId: item.postId,
        postTitle: item.postTitle,
        packageId: item.packageId,
        packageTitle: item.packageTitle || (item.packageId === null ? "Đăng ký nhà vườn" : "Nâng cấp tài khoản"),
      })),
    };
  },
};
