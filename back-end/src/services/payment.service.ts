import { and, desc, eq, gt, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "../config/db";
import {
  transactions,
  type Transaction,
  placementSlots,
  postPromotions,
  posts,
  promotionPackagePrices,
  promotionPackages,
  shops,
} from "../models/schema/index.ts";
import { parseId } from "../utils/parseId";
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
import { readSettingNumber } from "../controllers/user/pricing-config.controller";
import { postingPolicyService } from "./posting-policy.service";
import { notificationService } from "./notification.service";

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

const countSuccessfulPackageSales = async (
  executor: typeof db | any,
  packageId: number,
) => {
  const [usage] = await executor
    .select({ count: sql<number>`COUNT(*)` })
    .from(transactions)
    .where(
      and(
        eq(transactions.transactionType, "payment"),
        eq(transactions.transactionStatus, "success"),
        eq(transactions.transactionReferenceType, "package"),
        eq(transactions.transactionReferenceId, packageId),
      ),
    );

  return Number(usage?.count ?? 0);
};

const assertPackageSalesAvailable = async (params: {
  executor: typeof db | any;
  packageId: number;
  maxSales: number;
  message: string;
}) => {
  if (!Number.isFinite(params.maxSales) || params.maxSales <= 0) {
    return;
  }

  const soldCount = await countSuccessfulPackageSales(
    params.executor,
    params.packageId,
  );

  if (soldCount >= params.maxSales) {
    throw new PaymentServiceError(
      409,
      "ACCOUNT_PACKAGE_SOLD_OUT",
      params.message,
    );
  }
};

const activatePromotionForTransaction = async (
  tx: any,
  txn: Transaction,
) => {
  const meta = txn.transactionMeta as any;
  const packageId = txn.transactionReferenceId;
  const postId = meta?.postId;

  if (!postId || !packageId || txn.transactionReferenceType !== 'package') {
    throw new PaymentServiceError(
      500,
      "PAYMENT_TXN_POST_MISSING",
      "Payment transaction does not include a valid post or package reference.",
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
    .where(eq(promotionPackages.promotionPackageId, packageId))
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
        eq(postPromotions.postPromotionPostId, postId),
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
          eq(postPromotions.postPromotionPackageId, packageId),
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
    postPromotionPostId: postId,
    postPromotionBuyerId: txn.transactionUserId,
    postPromotionPackageId: packageId,
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
  txn: Transaction,
) => {
  if (!txn.transactionReferenceId || txn.transactionReferenceType !== 'package' || (txn.transactionMeta as any)?.postId) {
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
    .where(eq(promotionPackages.promotionPackageId, txn.transactionReferenceId!))
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
    .where(eq(shops.shopId, txn.transactionUserId))
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
    .where(eq(shops.shopId, txn.transactionUserId));
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
  txn: Transaction,
) => {
  const [pkg] = await tx
    .select({
      slotCode: placementSlots.placementSlotCode,
      maxSales: promotionPackages.promotionPackageMaxPosts,
    })
    .from(promotionPackages)
    .innerJoin(
      placementSlots,
      eq(promotionPackages.promotionPackageSlotId, placementSlots.placementSlotId),
    )
    .where(eq(promotionPackages.promotionPackageId, txn.transactionReferenceId!))
    .limit(1);

  if (!pkg) return;

  const maxSales = Number(pkg.maxSales ?? 0);
  if (maxSales > 0) {
    const soldCount = await countSuccessfulPackageSales(
      tx,
      txn.transactionReferenceId!,
    );

    if (soldCount > maxSales) {
      throw new PaymentServiceError(
        409,
        "ACCOUNT_PACKAGE_SOLD_OUT",
        "Gói tài khoản / shop này đã đạt số lượt bán tối đa.",
      );
    }
  }

  switch (pkg.slotCode) {
    case SHOP_VIP_SLOT_CODE:
      await activateShopVipForTransaction(tx, txn);
      break;
    case SHOP_REGISTRATION_SLOT_CODE:
      await activateRegistrationForTransaction(tx, txn.transactionUserId);
      break;
    case PERSONAL_PLAN_SLOT_CODE:
      await postingPolicyService.activatePersonalMonthlyPlan({
        userId: txn.transactionUserId,
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
      .from(transactions)
      .where(eq(transactions.transactionProviderTxnId, txnRef))
      .limit(1);

    if (!txn) {
      return { status: "not_found", txnRef, responseCode };
    }

    const requiredAmount = Number(txn.transactionAmount || 0);
    if (
      Number.isFinite(callbackAmount) &&
      Number.isFinite(requiredAmount) &&
      requiredAmount > 0 &&
      callbackAmount !== requiredAmount
    ) {
      await tx
        .update(transactions)
        .set({ transactionStatus: "failed", transactionUpdatedAt: new Date() })
        .where(
          and(
            eq(transactions.transactionId, txn.transactionId),
            or(
              eq(transactions.transactionStatus, "pending"),
              isNull(transactions.transactionStatus),
            ),
          ),
        );

      return { status: "invalid_amount", txnRef, responseCode };
    }

    if (responseCode === "00") {
      if (txn.transactionStatus === "success") {
        return { status: "already_success", txnRef, responseCode };
      }

      if (txn.transactionStatus === "failed") {
        return { status: "already_failed", txnRef, responseCode };
      }

      const [updatedTxn] = await tx
        .update(transactions)
        .set({ 
          transactionStatus: "success", 
          transactionUpdatedAt: new Date(),
          transactionProcessedAt: new Date()
        })
        .where(
          and(
            eq(transactions.transactionId, txn.transactionId),
            or(
              eq(transactions.transactionStatus, "pending"),
              isNull(transactions.transactionStatus),
            ),
          ),
        )
        .returning();

      if (!updatedTxn) {
        const [latestTxn] = await tx
          .select()
          .from(transactions)
          .where(eq(transactions.transactionId, txn.transactionId))
          .limit(1);

        if (latestTxn?.transactionStatus === "success") {
          return { status: "already_success", txnRef, responseCode };
        }

        if (latestTxn?.transactionStatus === "failed") {
          return { status: "already_failed", txnRef, responseCode };
        }

        return { status: "failed", txnRef, responseCode };
      }

      const meta = updatedTxn.transactionMeta as any;
      if (updatedTxn.transactionReferenceType === 'package' && updatedTxn.transactionReferenceId) {
        if (meta?.postId) {
          await activatePromotionForTransaction(tx, updatedTxn);
        } else {
          await handleNonPostPackageActivation(tx, updatedTxn);
        }
      } else {
        // Fallback or other transaction types
        const orderInfo = String(body.vnp_OrderInfo || "");
        if (orderInfo.startsWith("PayPersonalPkg")) {
          await postingPolicyService.activatePersonalMonthlyPlan({
            userId: updatedTxn.transactionUserId,
            durationDays: 30,
          });
        } else if (orderInfo.startsWith("PayShopReg")) {
          await activateRegistrationForTransaction(tx, updatedTxn.transactionUserId);
        }
      }

      try {
        await notificationService.sendNotification({
          recipientId: updatedTxn.transactionUserId,
          title: "Kích hoạt gói thành công",
          message: `Giao dịch #${updatedTxn.transactionProviderTxnId} đã được xử lý thành công. Các đặc quyền của bạn đã được kích hoạt.`,
          type: "success",
          metaData: { txnId: updatedTxn.transactionId, status: "success" }
        });
      } catch (notifError) {
        console.error("Payment success notification failed (txnId:", updatedTxn.transactionId, "):", notifError);
      }

      return { status: "success", txnRef, responseCode };
    }

    if (txn.transactionStatus === "success") {
      return { status: "already_success", txnRef, responseCode };
    }

    if (txn.transactionStatus === "failed") {
      return { status: "already_failed", txnRef, responseCode };
    }

    await tx
      .update(transactions)
      .set({ transactionStatus: "failed", transactionUpdatedAt: new Date() })
      .where(
        and(
          eq(transactions.transactionId, txn.transactionId),
          or(
            eq(transactions.transactionStatus, "pending"),
            isNull(transactions.transactionStatus),
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
      promotionPackageMaxPosts: promotionPackages.promotionPackageMaxPosts,
      promotionPackagePriceId: promotionPackagePrices.priceId,
      promotionPackagePrice: promotionPackagePrices.price,
      placementSlotPublished: placementSlots.placementSlotPublished,
      placementSlotCode: placementSlots.placementSlotCode,
      placementSlotCapacity: placementSlots.placementSlotCapacity,
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
  async createShopPaymentIntent(
    userId: number,
    ipAddr: string,
    platform: "web" | "mobile" = "web",
    mobileRedirectUrl?: string,
  ): Promise<{ paymentUrl: string }> {
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
    await assertPackageSalesAvailable({
      executor: db,
      packageId: pkg.promotionPackageId,
      maxSales: Number(pkg.promotionPackageMaxPosts ?? 0),
      message: "Gói Chủ Vườn Vĩnh Viễn đã đạt số lượt bán tối đa.",
    });

    const finalAmount = toSafeIntegerAmount(pkg.promotionPackagePrice);
    const orderId = createOrderId();
    const orderInfo = `PayShopReg${userId}`;

    const { payUrl } = await createVNPayPaymentRequest(finalAmount, orderId, orderInfo, ipAddr, platform, {
      mobileRedirectUrl,
    });

    await db.insert(transactions).values({
      transactionUserId: userId,
      transactionType: "payment",
      transactionReferenceType: "package",
      transactionReferenceId: pkg.promotionPackageId,
      transactionAmount: String(finalAmount),
      transactionProvider: "VNPAY",
      transactionProviderTxnId: orderId,
      transactionStatus: "pending",
      transactionMeta: { priceId: pkg.promotionPackagePriceId },
    });

    return { paymentUrl: payUrl };
  },

  async createPersonalPackagePaymentIntent(
    userId: number,
    ipAddr: string,
    platform: "web" | "mobile" = "web",
    mobileRedirectUrl?: string,
  ): Promise<{ paymentUrl: string }> {
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
    await assertPackageSalesAvailable({
      executor: db,
      packageId: pkg.promotionPackageId,
      maxSales: Number(pkg.promotionPackageMaxPosts ?? 0),
      message: "Gói Cá Nhân Theo Tháng đã đạt số lượt bán tối đa.",
    });

    const finalAmount = toSafeIntegerAmount(pkg.promotionPackagePrice);
    const orderId = createOrderId();
    const orderInfo = `PayPersonalPkg${userId}`;

    const { payUrl } = await createVNPayPaymentRequest(finalAmount, orderId, orderInfo, ipAddr, platform, {
      mobileRedirectUrl,
    });

    await db.insert(transactions).values({
      transactionUserId: userId,
      transactionType: "payment",
      transactionReferenceType: "package",
      transactionReferenceId: pkg.promotionPackageId,
      transactionAmount: String(finalAmount),
      transactionProvider: "VNPAY",
      transactionProviderTxnId: orderId,
      transactionStatus: "pending",
      transactionMeta: { priceId: pkg.promotionPackagePriceId },
    });

    return { paymentUrl: payUrl };
  },

  async createShopVipPaymentIntent(
    userId: number,
    ipAddr: string,
    platform: "web" | "mobile" = "web",
    mobileRedirectUrl?: string,
  ): Promise<{ paymentUrl: string }> {
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
    await assertPackageSalesAvailable({
      executor: db,
      packageId: vipPackage.promotionPackageId,
      maxSales: Number(vipPackage.promotionPackageMaxPosts ?? 0),
      message: "Gói Nhà Vườn VIP đã đạt số lượt bán tối đa.",
    });

    const slotCapacity = Number(vipPackage.placementSlotCapacity ?? 0);
    if (slotCapacity > 0) {
      const [slotUsage] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(shops)
        .where(
          and(
            eq(shops.shopStatus, "active"),
            gt(shops.shopVipExpiresAt, new Date()),
          ),
        );

      if (Number(slotUsage?.count ?? 0) >= slotCapacity) {
        throw new PaymentServiceError(
          409,
          "PLACEMENT_SLOT_FULL",
          "Vị trí Nhà vườn VIP đã đủ sức chứa (tối đa 10 nhà vườn). Vui lòng thử lại sau.",
        );
      }
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
      platform,
      { mobileRedirectUrl },
    );

    await db.insert(transactions).values({
      transactionUserId: userId,
      transactionType: "payment",
      transactionReferenceType: "package",
      transactionReferenceId: vipPackage.promotionPackageId,
      transactionAmount: String(finalAmount),
      transactionProvider: "VNPAY",
      transactionProviderTxnId: orderId,
      transactionStatus: "pending",
      transactionMeta: { priceId: vipPackage.promotionPackagePriceId },
    });

    return { paymentUrl: payUrl };
  },

  async createPaymentIntent(params: {
    userId: number;
    postIdRaw: unknown;
    packageIdRaw: unknown;
    ipAddr: string;
    platform?: "web" | "mobile";
    mobileRedirectUrl?: string;
  }): Promise<{ paymentUrl: string }> {
    const { userId, postIdRaw, packageIdRaw, ipAddr, platform = "web", mobileRedirectUrl } = params;

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

    const isAuthorized = post.postAuthorId === userId || 
                       (post.postShopId !== null && post.postShopId === userId);

    if (!isAuthorized) {
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

    const { payUrl } = await createVNPayPaymentRequest(finalAmount, orderId, orderInfo, ipAddr, platform, {
      mobileRedirectUrl,
    });

    await db.insert(transactions).values({
      transactionUserId: userId,
      transactionType: "payment",
      transactionReferenceType: "package",
      transactionReferenceId: parsedPackageId,
      transactionAmount: String(finalAmount),
      transactionProvider: "VNPAY",
      transactionProviderTxnId: orderId,
      transactionStatus: "pending",
      transactionMeta: { 
        postId: parsedPostId, 
        priceId: pkg.promotionPackagePriceId 
      },
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
        id: transactions.transactionId,
        amount: transactions.transactionAmount,
        status: transactions.transactionStatus,
        createdAt: transactions.transactionCreatedAt,
        packageId: transactions.transactionReferenceId,
        postId: sql<number | null>`(${transactions.transactionMeta}->>'postId')::int`,
        packageTitle: promotionPackages.promotionPackageTitle,
        postTitle: posts.postTitle,
        postShopId: posts.postShopId,
      })
      .from(transactions)
      .leftJoin(promotionPackages, and(
        eq(transactions.transactionReferenceType, 'package'),
        eq(transactions.transactionReferenceId, promotionPackages.promotionPackageId)
      ))
      .leftJoin(posts, eq(sql<number>`(${transactions.transactionMeta}->>'postId')::int`, posts.postId))
      .where(eq(transactions.transactionUserId, userId))
      .orderBy(sql`${transactions.transactionCreatedAt} DESC`)
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
