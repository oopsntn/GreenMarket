import { and, desc, eq, gt, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "../config/db.ts";
import {
  paymentTxn,
  type PaymentTxn,
  placementSlots,
  postPromotions,
  posts,
  promotionPackagePrices,
  promotionPackages,
  shops,
} from "../models/schema/index.ts";
import { parseId } from "../utils/parseId.ts";
import {
  createVNPayPaymentRequest,
  validateVNPayConfig,
  verifyVNPaySignature,
} from "../utils/vnpay.ts";
import {
  BOOST_POST_SLOT_PREFIX,
  SHOP_VIP_SLOT_CODE,
  isBoostPostSlotCode,
  SHOP_REGISTRATION_SLOT_CODE,
  PERSONAL_PLAN_SLOT_CODE,
} from "../constants/promotion.ts";
import { readSettingNumber } from "../controllers/user/pricing-config.controller.ts";
import { postingPolicyService } from "./posting-policy.service.ts";

export class PaymentServiceError extends Error {
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

export type VNPayCallbackStatus =
  | "success"
  | "failed"
  | "already_success"
  | "already_failed"
  | "not_found"
  | "invalid_amount"
  | "invalid_signature";

export type VNPayCallbackResult = {
  status: VNPayCallbackStatus;
  txnRef?: string;
  responseCode?: string;
};

const toSafeIntegerAmount = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed);
};

const createOrderId = () => {
  const randomPart = Math.floor(Math.random() * 900000 + 100000);
  return `GM${Date.now()}${randomPart}`;
};

const getLivePromotionCondition = () =>
  and(
    sql`${postPromotions.postPromotionEndAt} > NOW()`,
    or(
      eq(postPromotions.postPromotionStatus, "active"),
      eq(postPromotions.postPromotionStatus, "scheduled"),
      eq(postPromotions.postPromotionStatus, "paused"),
      eq(postPromotions.postPromotionStatus, "pending"),
    ),
  );

const activatePromotionForTransaction = async (
  tx: any,
  txn: typeof paymentTxn.$inferSelect,
) => {
  if (!txn.paymentTxnPostId || !txn.paymentTxnPackageId) {
    throw new PaymentServiceError(
      500,
      "PAYMENT_TXN_POST_MISSING",
      "Payment transaction does not include a post or package reference.",
    );
  }

  const [pkg] = await tx
    .select({
      promotionPackageId: promotionPackages.promotionPackageId,
      promotionPackageSlotId: promotionPackages.promotionPackageSlotId,
      promotionPackageDurationDays: promotionPackages.promotionPackageDurationDays,
      promotionPackageMaxPosts: promotionPackages.promotionPackageMaxPosts,
      promotionPackageTitle: promotionPackages.promotionPackageTitle,
      slotCapacity: placementSlots.placementSlotCapacity,
      priority: sql<number>`
        CASE 
          WHEN (${placementSlots.placementSlotRules} ->> 'priority') ~ '^[0-9]+$' 
            THEN (${placementSlots.placementSlotRules} ->> 'priority')::int 
          ELSE 1 
        END
      `,
    })
    .from(promotionPackages)
    .innerJoin(
      placementSlots,
      eq(promotionPackages.promotionPackageSlotId, placementSlots.placementSlotId),
    )
    .where(eq(promotionPackages.promotionPackageId, txn.paymentTxnPackageId!))
    .limit(1);

  if (!pkg) {
    throw new PaymentServiceError(
      500,
      "PROMOTION_PACKAGE_NOT_FOUND",
      "Promotion package linked to payment does not exist.",
    );
  }

  const livePromotionCondition = getLivePromotionCondition();

  const [existingPostPromotion] = await tx
    .select({ promotionId: postPromotions.postPromotionId })
    .from(postPromotions)
    .where(
      and(
        eq(postPromotions.postPromotionPostId, txn.paymentTxnPostId),
        livePromotionCondition,
      ),
    )
    .limit(1);

  if (existingPostPromotion) {
    throw new PaymentServiceError(
      409,
      "POST_ALREADY_PROMOTED",
      "Bài viết này đang có gói quảng bá còn hiệu lực.",
    );
  }

  const slotCapacity = Number(pkg.slotCapacity ?? 0);
  if (slotCapacity > 0) {
    const [slotUsage] = await tx
      .select({ count: sql<number>`COUNT(*)` })
      .from(postPromotions)
      .where(
        and(
          eq(postPromotions.postPromotionSlotId, pkg.promotionPackageSlotId),
          livePromotionCondition,
        ),
      );

    if (Number(slotUsage?.count ?? 0) >= slotCapacity) {
      throw new PaymentServiceError(
        409,
        "PLACEMENT_SLOT_FULL",
        "Vị trí hiển thị này đã đủ sức chứa trong thời gian hiện tại.",
      );
    }
  }

  const packageMaxPosts = Number(pkg.promotionPackageMaxPosts ?? 0);
  if (packageMaxPosts > 0) {
    const [packageUsage] = await tx
      .select({ count: sql<number>`COUNT(*)` })
      .from(postPromotions)
      .where(
        and(
          eq(postPromotions.postPromotionPackageId, txn.paymentTxnPackageId),
          livePromotionCondition,
        ),
      );

    if (Number(packageUsage?.count ?? 0) >= packageMaxPosts) {
      throw new PaymentServiceError(
        409,
        "PROMOTION_PACKAGE_SOLD_OUT",
        "Gói quảng bá này đã hết số lượng bài có thể áp dụng.",
      );
    }
  }

  const startAt = new Date();
  const durationDays = Number(pkg.promotionPackageDurationDays || 0);
  const endAt = new Date(startAt.getTime() + durationDays * 24 * 60 * 60 * 1000);
  await tx.insert(postPromotions).values({
    postPromotionPostId: txn.paymentTxnPostId,
    postPromotionBuyerId: txn.paymentTxnUserId,
    postPromotionPackageId: txn.paymentTxnPackageId,
    postPromotionSlotId: pkg.promotionPackageSlotId,
    postPromotionSnapshotTitle: pkg.promotionPackageTitle,
    postPromotionSnapshotPriority: pkg.priority,
    postPromotionStartAt: startAt,
    postPromotionEndAt: endAt,
    postPromotionStatus: "active",
  });
};

const activateShopVipForTransaction = async (
  tx: any,
  txn: PaymentTxn,
) => {
  if (!txn.paymentTxnPackageId || txn.paymentTxnPostId) {
    throw new PaymentServiceError(
      500,
      "SHOP_VIP_TXN_INVALID",
      "Shop VIP transaction payload is invalid.",
    );
  }

  const [pkg] = await tx
    .select({
      promotionPackageId: promotionPackages.promotionPackageId,
      promotionPackageDurationDays: promotionPackages.promotionPackageDurationDays,
      slotCode: placementSlots.placementSlotCode,
    })
    .from(promotionPackages)
    .innerJoin(
      placementSlots,
      eq(promotionPackages.promotionPackageSlotId, placementSlots.placementSlotId),
    )
    .where(eq(promotionPackages.promotionPackageId, txn.paymentTxnPackageId))
    .limit(1);

  if (!pkg || pkg.slotCode !== SHOP_VIP_SLOT_CODE) {
    throw new PaymentServiceError(
      500,
      "SHOP_VIP_PACKAGE_INVALID",
      "Shop VIP package is missing or invalid.",
    );
  }

  const durationDays = Number(pkg.promotionPackageDurationDays || 0);
  if (!Number.isFinite(durationDays) || durationDays <= 0) {
    throw new PaymentServiceError(
      500,
      "SHOP_VIP_DURATION_INVALID",
      "Shop VIP package duration is invalid.",
    );
  }

  const [shop] = await tx
    .select({
      shopId: shops.shopId,
      shopStatus: shops.shopStatus,
      shopVipStartedAt: shops.shopVipStartedAt,
      shopVipExpiresAt: shops.shopVipExpiresAt,
    })
    .from(shops)
    .where(eq(shops.shopId, txn.paymentTxnUserId))
    .limit(1);

  if (!shop) {
    throw new PaymentServiceError(
      404,
      "SHOP_NOT_FOUND",
      "Shop does not exist for Shop VIP activation.",
    );
  }

  if (shop.shopStatus !== "active") {
    throw new PaymentServiceError(
      400,
      "SHOP_NOT_ACTIVE",
      "Only active shops can be upgraded to VIP.",
    );
  }

  const now = new Date();
  const currentExpiresAt = shop.shopVipExpiresAt ? new Date(shop.shopVipExpiresAt) : null;
  const isCurrentlyVip = currentExpiresAt && currentExpiresAt > now;

  const newStartAt = isCurrentlyVip
    ? shop.shopVipStartedAt
      ? new Date(shop.shopVipStartedAt)
      : now
    : now;
  const baseDate = isCurrentlyVip ? currentExpiresAt : now;
  const newExpiresAt = new Date(
    baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000,
  );

  await tx
    .update(shops)
    .set({
      shopVipStartedAt: newStartAt,
      shopVipExpiresAt: newExpiresAt,
      shopUpdatedAt: now,
    })
    .where(eq(shops.shopId, txn.paymentTxnUserId));
};

const activateRegistrationForTransaction = async (tx: any, userId: number) => {
  await tx
    .update(shops)
    .set({ shopStatus: "active", shopUpdatedAt: new Date() })
    .where(eq(shops.shopId, userId));

  // Migrate all existing posts of this author to the shop profile
  await tx
    .update(posts)
    .set({
      postShopId: userId,
      postUpdatedAt: new Date(),
    })
    .where(eq(posts.postAuthorId, userId));
};

const handleNonPostPackageActivation = async (
  tx: any,
  txn: PaymentTxn,
) => {
  const [pkg] = await tx
    .select({
      slotCode: placementSlots.placementSlotCode,
    })
    .from(promotionPackages)
    .innerJoin(
      placementSlots,
      eq(promotionPackages.promotionPackageSlotId, placementSlots.placementSlotId),
    )
    .where(eq(promotionPackages.promotionPackageId, txn.paymentTxnPackageId!))
    .limit(1);

  if (!pkg) return;

  switch (pkg.slotCode) {
    case SHOP_VIP_SLOT_CODE:
      await activateShopVipForTransaction(tx, txn);
      break;
    case SHOP_REGISTRATION_SLOT_CODE:
      await activateRegistrationForTransaction(tx, txn.paymentTxnUserId);
      break;
    case PERSONAL_PLAN_SLOT_CODE:
      await postingPolicyService.activatePersonalMonthlyPlan({
        userId: txn.paymentTxnUserId,
        durationDays: 30,
      });
      break;
  }
};

const processVerifiedCallback = async (
  body: Record<string, unknown>,
): Promise<VNPayCallbackResult> => {
  const txnRef = String(body.vnp_TxnRef ?? "");
  const responseCode = String(body.vnp_ResponseCode ?? "");
  const callbackAmount = Number(body.vnp_Amount) / 100;

  if (!txnRef) {
    return { status: "not_found", txnRef: "", responseCode };
  }

  return db.transaction(async (tx) => {
    const [txn] = await tx
      .select()
      .from(paymentTxn)
      .where(eq(paymentTxn.paymentTxnProviderTxnId, txnRef))
      .limit(1);

    if (!txn) {
      return { status: "not_found", txnRef, responseCode };
    }

    const requiredAmount = Number(txn.paymentTxnAmount || 0);
    if (
      Number.isFinite(callbackAmount) &&
      Number.isFinite(requiredAmount) &&
      requiredAmount > 0 &&
      callbackAmount !== requiredAmount
    ) {
      await tx
        .update(paymentTxn)
        .set({ paymentTxnStatus: "failed" })
        .where(
          and(
            eq(paymentTxn.paymentTxnId, txn.paymentTxnId),
            or(
              eq(paymentTxn.paymentTxnStatus, "pending"),
              isNull(paymentTxn.paymentTxnStatus),
            ),
          ),
        );

      return { status: "invalid_amount", txnRef, responseCode };
    }

    if (responseCode === "00") {
      if (txn.paymentTxnStatus === "success") {
        return { status: "already_success", txnRef, responseCode };
      }

      if (txn.paymentTxnStatus === "failed") {
        return { status: "already_failed", txnRef, responseCode };
      }

      const [updatedTxn] = await tx
        .update(paymentTxn)
        .set({ paymentTxnStatus: "success" })
        .where(
          and(
            eq(paymentTxn.paymentTxnId, txn.paymentTxnId),
            or(
              eq(paymentTxn.paymentTxnStatus, "pending"),
              isNull(paymentTxn.paymentTxnStatus),
            ),
          ),
        )
        .returning();

      if (!updatedTxn) {
        const [latestTxn] = await tx
          .select()
          .from(paymentTxn)
          .where(eq(paymentTxn.paymentTxnId, txn.paymentTxnId))
          .limit(1);

        if (latestTxn?.paymentTxnStatus === "success") {
          return { status: "already_success", txnRef, responseCode };
        }

        if (latestTxn?.paymentTxnStatus === "failed") {
          return { status: "already_failed", txnRef, responseCode };
        }

        return { status: "failed", txnRef, responseCode };
      }

      if (updatedTxn.paymentTxnPackageId) {
        if (updatedTxn.paymentTxnPostId) {
          await activatePromotionForTransaction(tx, updatedTxn);
        } else {
          await handleNonPostPackageActivation(tx, updatedTxn);
        }
      } else {
        // Fallback for legacy transactions (missing packageId)
        const orderInfo = String(body.vnp_OrderInfo || "");
        if (orderInfo.startsWith("PayPersonalPkg")) {
          await postingPolicyService.activatePersonalMonthlyPlan({
            userId: updatedTxn.paymentTxnUserId,
            durationDays: 30,
          });
        } else {
          await activateRegistrationForTransaction(tx, updatedTxn.paymentTxnUserId);
        }
      }
      return { status: "success", txnRef, responseCode };
    }

    if (txn.paymentTxnStatus === "success") {
      return { status: "already_success", txnRef, responseCode };
    }

    if (txn.paymentTxnStatus === "failed") {
      return { status: "already_failed", txnRef, responseCode };
    }

    await tx
      .update(paymentTxn)
      .set({ paymentTxnStatus: "failed" })
      .where(
        and(
          eq(paymentTxn.paymentTxnId, txn.paymentTxnId),
          or(
            eq(paymentTxn.paymentTxnStatus, "pending"),
            isNull(paymentTxn.paymentTxnStatus),
          ),
        ),
      );

    return { status: "failed", txnRef, responseCode };
  });
};

const findPublishedPackageBySlotCode = async (slotCode: string) => {
  const now = new Date();
  const [pkg] = await db
    .select({
      promotionPackageId: promotionPackages.promotionPackageId,
      promotionPackagePublished: promotionPackages.promotionPackagePublished,
      promotionPackageDurationDays: promotionPackages.promotionPackageDurationDays,
      promotionPackagePriceId: promotionPackagePrices.priceId,
      promotionPackagePrice: promotionPackagePrices.price,
      placementSlotPublished: placementSlots.placementSlotPublished,
      placementSlotCode: placementSlots.placementSlotCode,
    })
    .from(promotionPackages)
    .innerJoin(
      placementSlots,
      eq(promotionPackages.promotionPackageSlotId, placementSlots.placementSlotId),
    )
    .leftJoin(
      promotionPackagePrices,
      and(
        eq(promotionPackagePrices.packageId, promotionPackages.promotionPackageId),
        lte(promotionPackagePrices.effectiveFrom, now),
        or(
          isNull(promotionPackagePrices.effectiveTo),
          gt(promotionPackagePrices.effectiveTo, now),
        ),
      ),
    )
    .where(eq(placementSlots.placementSlotCode, slotCode))
    .limit(1);

  return pkg ?? null;
};

export const paymentService = {
  async createShopPaymentIntent(userId: number, ipAddr: string): Promise<{ paymentUrl: string }> {
    const configCheck = validateVNPayConfig();
    if (!configCheck.isValid) {
      throw new PaymentServiceError(
        500,
        "VNPAY_CONFIG_MISSING",
        "VNPay configuration is missing.",
        { missing: configCheck.missingFields },
      );
    }
    const [shop] = await db.select().from(shops).where(eq(shops.shopId, userId)).limit(1);
    if (!shop) throw new PaymentServiceError(404, "SHOP_NOT_FOUND", "Thong tin shop khong ton tai.");
    if (shop.shopStatus === "active") throw new PaymentServiceError(400, "SHOP_ALREADY_ACTIVE", "Shop da duoc kich hoat tien trinh dang ky.");

    const pkg = await findPublishedPackageBySlotCode(SHOP_REGISTRATION_SLOT_CODE);
    if (!pkg) throw new PaymentServiceError(404, "SHOP_REG_PACKAGE_NOT_FOUND", "Goi dang ky nha vuon chua duoc cau hinh.");

    const finalAmount = toSafeIntegerAmount(pkg.promotionPackagePrice);
    const orderId = createOrderId();
    const orderInfo = `PayShopReg${userId}`;

    const { payUrl } = await createVNPayPaymentRequest(finalAmount, orderId, orderInfo, ipAddr);

    await db.insert(paymentTxn).values({
      paymentTxnUserId: userId,
      paymentTxnPackageId: pkg.promotionPackageId,
      paymentTxnPriceId: pkg.promotionPackagePriceId ?? null,
      paymentTxnAmount: String(finalAmount),
      paymentTxnProvider: "VNPAY",
      paymentTxnProviderTxnId: orderId,
      paymentTxnStatus: "pending",
    });

    return { paymentUrl: payUrl };
  },

  async createPersonalPackagePaymentIntent(userId: number, ipAddr: string): Promise<{ paymentUrl: string }> {
    const configCheck = validateVNPayConfig();
    if (!configCheck.isValid) {
      throw new PaymentServiceError(
        500,
        "VNPAY_CONFIG_MISSING",
        "VNPay configuration is missing.",
        { missing: configCheck.missingFields },
      );
    }
    const [shop] = await db.select().from(shops).where(eq(shops.shopId, userId)).limit(1);
    if (shop?.shopStatus === "active") {
      throw new PaymentServiceError(400, "ALREADY_GARDEN_OWNER", "Shop owner cannot buy personal plan.");
    }

    const pkg = await findPublishedPackageBySlotCode(PERSONAL_PLAN_SLOT_CODE);
    if (!pkg) throw new PaymentServiceError(404, "PERSONAL_PLAN_PACKAGE_NOT_FOUND", "Goi ca nhan chua duoc cau hinh.");

    const finalAmount = toSafeIntegerAmount(pkg.promotionPackagePrice);
    const orderId = createOrderId();
    const orderInfo = `PayPersonalPkg${userId}`;

    const { payUrl } = await createVNPayPaymentRequest(finalAmount, orderId, orderInfo, ipAddr);

    await db.insert(paymentTxn).values({
      paymentTxnUserId: userId,
      paymentTxnPackageId: pkg.promotionPackageId,
      paymentTxnPriceId: pkg.promotionPackagePriceId ?? null,
      paymentTxnAmount: String(finalAmount),
      paymentTxnProvider: "VNPAY",
      paymentTxnProviderTxnId: orderId,
      paymentTxnStatus: "pending",
    });

    return { paymentUrl: payUrl };
  },

  async createShopVipPaymentIntent(userId: number, ipAddr: string): Promise<{ paymentUrl: string }> {
    const configCheck = validateVNPayConfig();
    if (!configCheck.isValid) {
      throw new PaymentServiceError(
        500,
        "VNPAY_CONFIG_MISSING",
        "VNPay configuration is missing.",
        { missing: configCheck.missingFields },
      );
    }

    const [shop] = await db
      .select({
        shopId: shops.shopId,
        shopStatus: shops.shopStatus,
      })
      .from(shops)
      .where(eq(shops.shopId, userId))
      .limit(1);

    if (!shop) {
      throw new PaymentServiceError(
        404,
        "SHOP_NOT_FOUND",
        "Thong tin shop khong ton tai.",
      );
    }

    if (shop.shopStatus !== "active") {
      throw new PaymentServiceError(
        400,
        "SHOP_NOT_ACTIVE",
        "Chi shop dang active moi co the mua goi Nha Vuon VIP.",
      );
    }

    const vipPackage = await findPublishedPackageBySlotCode(SHOP_VIP_SLOT_CODE);
    if (
      !vipPackage ||
      !vipPackage.promotionPackagePublished ||
      !vipPackage.placementSlotPublished ||
      vipPackage.placementSlotCode !== SHOP_VIP_SLOT_CODE
    ) {
      throw new PaymentServiceError(
        404,
        "SHOP_VIP_PACKAGE_NOT_AVAILABLE",
        "Goi Nha Vuon VIP hien khong kha dung.",
      );
    }

    const vipDurationDays = Number(vipPackage.promotionPackageDurationDays || 0);
    if (!Number.isFinite(vipDurationDays) || vipDurationDays <= 0) {
      throw new PaymentServiceError(
        500,
        "SHOP_VIP_DURATION_INVALID",
        "Goi Nha Vuon VIP co thoi luong khong hop le.",
      );
    }

    const finalAmount = toSafeIntegerAmount(vipPackage.promotionPackagePrice);
    if (finalAmount <= 0) {
      throw new PaymentServiceError(
        400,
        "INVALID_PACKAGE_PRICE",
        "Invalid package price.",
      );
    }

    const orderId = createOrderId();
    const orderInfo = `PayShopVipPkg${vipPackage.promotionPackageId}Shop${userId}`;

    const { payUrl } = await createVNPayPaymentRequest(
      finalAmount,
      orderId,
      orderInfo,
      ipAddr,
    );

    await db.insert(paymentTxn).values({
      paymentTxnUserId: userId,
      paymentTxnPackageId: vipPackage.promotionPackageId,
      paymentTxnPriceId: vipPackage.promotionPackagePriceId ?? null,
      paymentTxnAmount: String(finalAmount),
      paymentTxnProvider: "VNPAY",
      paymentTxnProviderTxnId: orderId,
      paymentTxnStatus: "pending",
    });

    return { paymentUrl: payUrl };
  },

  async createPaymentIntent(params: {
    userId: number;
    postIdRaw: unknown;
    packageIdRaw: unknown;
    ipAddr: string;
  }): Promise<{ paymentUrl: string }> {
    const { userId, postIdRaw, packageIdRaw, ipAddr } = params;

    const configCheck = validateVNPayConfig();
    if (!configCheck.isValid) {
      throw new PaymentServiceError(
        500,
        "VNPAY_CONFIG_MISSING",
        "VNPay configuration is missing.",
        { missing: configCheck.missingFields },
      );
    }

    const parsedPostId = parseId(String(postIdRaw ?? ""));
    const parsedPackageId = parseId(String(packageIdRaw ?? ""));

    if (!parsedPostId || !parsedPackageId) {
      throw new PaymentServiceError(
        400,
        "INVALID_PAYMENT_INPUT",
        "postId and packageId are required.",
      );
    }

    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.postId, parsedPostId))
      .limit(1);

    if (!post) {
      throw new PaymentServiceError(404, "POST_NOT_FOUND", "Post not found.");
    }

    if (post.postAuthorId !== userId) {
      throw new PaymentServiceError(
        403,
        "POST_PERMISSION_DENIED",
        "You do not have permission to promote this post.",
      );
    }

    if (post.postStatus !== "approved") {
      throw new PaymentServiceError(
        400,
        "POST_NOT_APPROVED",
        "Only approved posts can be promoted.",
      );
    }

    // No longer forcing personal posts to become shop posts when promoted.
    // Garden owners can keep personal posts if they want.

    const now = new Date();
    const [pkg] = await db
      .select({
        promotionPackageId: promotionPackages.promotionPackageId,
        promotionPackagePublished: promotionPackages.promotionPackagePublished,
        promotionPackageSlotId: promotionPackages.promotionPackageSlotId,
        promotionPackageDurationDays: promotionPackages.promotionPackageDurationDays,
        promotionPackageMaxPosts: promotionPackages.promotionPackageMaxPosts,
        promotionPackagePriceId: promotionPackagePrices.priceId,
        promotionPackagePrice: promotionPackagePrices.price,
      })
      .from(promotionPackages)
      .leftJoin(
        promotionPackagePrices,
        and(
          eq(
            promotionPackagePrices.packageId,
            promotionPackages.promotionPackageId,
          ),
          lte(promotionPackagePrices.effectiveFrom, now),
          or(
            isNull(promotionPackagePrices.effectiveTo),
            gt(promotionPackagePrices.effectiveTo, now),
          ),
        ),
      )
      .where(eq(promotionPackages.promotionPackageId, parsedPackageId))
      .limit(1);

    if (!pkg || !pkg.promotionPackagePublished) {
      throw new PaymentServiceError(
        404,
        "PROMOTION_PACKAGE_NOT_AVAILABLE",
        "Promotion package not found or not available.",
      );
    }

    const [slot] = await db
      .select({
        placementSlotId: placementSlots.placementSlotId,
        placementSlotPublished: placementSlots.placementSlotPublished,
        placementSlotCode: placementSlots.placementSlotCode,
        placementSlotCapacity: placementSlots.placementSlotCapacity,
      })
      .from(placementSlots)
      .where(eq(placementSlots.placementSlotId, pkg.promotionPackageSlotId))
      .limit(1);

    if (!slot || !slot.placementSlotPublished) {
      throw new PaymentServiceError(
        400,
        "PLACEMENT_SLOT_DISABLED",
        "The associated placement slot is currently disabled.",
      );
    }

    if (!isBoostPostSlotCode(slot.placementSlotCode)) {
      throw new PaymentServiceError(
        400,
        "BOOST_PACKAGE_TYPE_INVALID",
        "This package is not available for post boost purchases.",
      );
    }

    const livePromotionCondition = getLivePromotionCondition();

    const [existingPromotion] = await db
      .select({ promotionId: postPromotions.postPromotionId })
      .from(postPromotions)
      .where(
        and(
          eq(postPromotions.postPromotionPostId, parsedPostId),
          livePromotionCondition,
        ),
      )
      .limit(1);

    if (existingPromotion) {
      throw new PaymentServiceError(
        409,
        "POST_ALREADY_PROMOTED",
        "Bài viết này đã có gói quảng bá còn hiệu lực, không thể mua thêm gói khác.",
      );
    }

    const slotCapacity = Number(slot.placementSlotCapacity ?? 0);
    if (slotCapacity > 0) {
      const [slotUsage] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(postPromotions)
        .where(
          and(
            eq(postPromotions.postPromotionSlotId, slot.placementSlotId),
            livePromotionCondition,
          ),
        );

      if (Number(slotUsage?.count ?? 0) >= slotCapacity) {
        throw new PaymentServiceError(
          409,
          "PLACEMENT_SLOT_FULL",
          "Vị trí hiển thị này đã đủ sức chứa. Hãy chọn gói ở vị trí khác hoặc chờ gói hiện tại hết hạn.",
        );
      }
    }

    const packageMaxPosts = Number(pkg.promotionPackageMaxPosts ?? 0);
    if (packageMaxPosts > 0) {
      const [packageUsage] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(postPromotions)
        .where(
          and(
            eq(postPromotions.postPromotionPackageId, parsedPackageId),
            livePromotionCondition,
          ),
        );

      if (Number(packageUsage?.count ?? 0) >= packageMaxPosts) {
        throw new PaymentServiceError(
          409,
          "PROMOTION_PACKAGE_SOLD_OUT",
          "Gói quảng bá này đã đạt số bài tối đa cho phép và hiện không thể mua thêm.",
        );
      }
    }

    const finalAmount = toSafeIntegerAmount(pkg.promotionPackagePrice);
    if (finalAmount <= 0) {
      throw new PaymentServiceError(
        400,
        "INVALID_PACKAGE_PRICE",
        "Invalid package price.",
      );
    }

    const orderId = createOrderId();
    const requestId = orderId;
    const orderInfo = `PayPromotionPkg${pkg.promotionPackageId}Post${parsedPostId}`;

    const { payUrl } = await createVNPayPaymentRequest(finalAmount, orderId, orderInfo, ipAddr);

    await db.insert(paymentTxn).values({
      paymentTxnUserId: userId,
      paymentTxnPostId: parsedPostId,
      paymentTxnPackageId: parsedPackageId,
      paymentTxnPriceId: pkg.promotionPackagePriceId ?? null,
      paymentTxnAmount: String(finalAmount),
      paymentTxnProvider: "VNPAY",
      paymentTxnProviderTxnId: orderId,
      paymentTxnStatus: "pending",
    });

    return { paymentUrl: payUrl };
  },

  async processVNPayCallback(
    body: Record<string, unknown>,
  ): Promise<VNPayCallbackResult> {
    if (!verifyVNPaySignature(body)) {
      return {
        status: "invalid_signature",
        txnRef: String(body.vnp_TxnRef ?? ""),
        responseCode: "97",
      };
    }

    return processVerifiedCallback(body);
  },

  async getUserTransactionHistory(userId: number) {
    const transactionsResult = await db
      .select({
        id: paymentTxn.paymentTxnId,
        amount: paymentTxn.paymentTxnAmount,
        status: paymentTxn.paymentTxnStatus,
        createdAt: paymentTxn.paymentTxnCreatedAt,
        packageId: paymentTxn.paymentTxnPackageId,
        postId: paymentTxn.paymentTxnPostId,
        packageTitle: promotionPackages.promotionPackageTitle,
        postTitle: posts.postTitle,
        postShopId: posts.postShopId,
      })
      .from(paymentTxn)
      .leftJoin(promotionPackages, eq(paymentTxn.paymentTxnPackageId, promotionPackages.promotionPackageId))
      .leftJoin(posts, eq(paymentTxn.paymentTxnPostId, posts.postId))
      .where(eq(paymentTxn.paymentTxnUserId, userId))
      .orderBy(sql`${paymentTxn.paymentTxnCreatedAt} DESC`)
      .limit(50);

    const activePromotionsResult = await db
      .select({
        promotionId: postPromotions.postPromotionId,
        postId: postPromotions.postPromotionPostId,
        postTitle: posts.postTitle,
        packageTitle: promotionPackages.promotionPackageTitle,
        startAt: postPromotions.postPromotionStartAt,
        endAt: postPromotions.postPromotionEndAt,
        status: postPromotions.postPromotionStatus,
      })
      .from(postPromotions)
      .innerJoin(posts, eq(postPromotions.postPromotionPostId, posts.postId))
      .innerJoin(promotionPackages, eq(postPromotions.postPromotionPackageId, promotionPackages.promotionPackageId))
      .innerJoin(placementSlots, eq(postPromotions.postPromotionSlotId, placementSlots.placementSlotId))
      .where(
        and(
          eq(posts.postAuthorId, userId),
          or(eq(postPromotions.postPromotionStatus, "active"), eq(postPromotions.postPromotionStatus, "pending")),
          sql`UPPER(${placementSlots.placementSlotCode}) LIKE ${`${BOOST_POST_SLOT_PREFIX}%`}`
        )
      )
      .orderBy(sql`${postPromotions.postPromotionStartAt} DESC`);

    return { 
      transactions: transactionsResult, 
      activePromotions: activePromotionsResult 
    };
  },
};
