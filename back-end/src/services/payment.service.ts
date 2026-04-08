import { and, eq, gt, isNull, lte, or } from "drizzle-orm";
import { db } from "../config/db.ts";
import {
  paymentTxn,
  placementSlots,
  postPromotions,
  posts,
  promotionPackagePrices,
  promotionPackages,
} from "../models/schema/index.ts";
import { parseId } from "../utils/parseId.ts";
import {
  createMoMoPaymentRequest,
  validateMoMoConfig,
  verifyMoMoSignature,
} from "../utils/momo.ts";

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

export type MoMoCallbackStatus =
  | "success"
  | "failed"
  | "already_success"
  | "already_failed"
  | "not_found"
  | "invalid_amount"
  | "invalid_signature";

export type MoMoCallbackResult = {
  status: MoMoCallbackStatus;
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

const activatePromotionForTransaction = async (
  tx: any,
  txn: typeof paymentTxn.$inferSelect,
) => {
  if (!txn.paymentTxnPostId) {
    throw new PaymentServiceError(
      500,
      "PAYMENT_TXN_POST_MISSING",
      "Payment transaction does not include a post reference.",
    );
  }

  const [pkg] = await tx
    .select({
      promotionPackageId: promotionPackages.promotionPackageId,
      promotionPackageSlotId: promotionPackages.promotionPackageSlotId,
      promotionPackageDurationDays: promotionPackages.promotionPackageDurationDays,
    })
    .from(promotionPackages)
    .where(eq(promotionPackages.promotionPackageId, txn.paymentTxnPackageId))
    .limit(1);

  if (!pkg) {
    throw new PaymentServiceError(
      500,
      "PROMOTION_PACKAGE_NOT_FOUND",
      "Promotion package linked to payment does not exist.",
    );
  }

  const startAt = new Date();
  const durationDays = Number(pkg.promotionPackageDurationDays || 0);
  const endAt = new Date(startAt.getTime() + durationDays * 24 * 60 * 60 * 1000);

  await tx.insert(postPromotions).values({
    postPromotionPostId: txn.paymentTxnPostId,
    postPromotionBuyerId: txn.paymentTxnUserId,
    postPromotionPackageId: txn.paymentTxnPackageId,
    postPromotionSlotId: pkg.promotionPackageSlotId,
    postPromotionStartAt: startAt,
    postPromotionEndAt: endAt,
    postPromotionStatus: "active",
  });
};

const processVerifiedCallback = async (
  body: Record<string, unknown>,
): Promise<MoMoCallbackResult> => {
  const txnRef = String(body.orderId || "");
  const responseCode = String(body.resultCode || "");
  const callbackAmount = Number(body.amount);

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

    if (responseCode === "0") {
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

      await activatePromotionForTransaction(tx, updatedTxn);
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

export const paymentService = {
  async createPaymentIntent(params: {
    userId: number;
    postIdRaw: unknown;
    packageIdRaw: unknown;
  }): Promise<{ paymentUrl: string }> {
    const { userId, postIdRaw, packageIdRaw } = params;

    const configCheck = validateMoMoConfig();
    if (!configCheck.isValid) {
      throw new PaymentServiceError(
        500,
        "MOMO_CONFIG_MISSING",
        "MoMo configuration is missing.",
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

    const now = new Date();
    const [pkg] = await db
      .select({
        promotionPackageId: promotionPackages.promotionPackageId,
        promotionPackagePublished: promotionPackages.promotionPackagePublished,
        promotionPackageSlotId: promotionPackages.promotionPackageSlotId,
        promotionPackageDurationDays: promotionPackages.promotionPackageDurationDays,
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

    const { payUrl } = await createMoMoPaymentRequest(
      finalAmount,
      orderId,
      orderInfo,
      requestId,
    );

    await db.insert(paymentTxn).values({
      paymentTxnUserId: userId,
      paymentTxnPostId: parsedPostId,
      paymentTxnPackageId: parsedPackageId,
      paymentTxnPriceId: pkg.promotionPackagePriceId ?? null,
      paymentTxnAmount: String(finalAmount),
      paymentTxnProvider: "MOMO",
      paymentTxnProviderTxnId: orderId,
      paymentTxnStatus: "pending",
    });

    return { paymentUrl: payUrl };
  },

  async processMoMoCallback(
    body: Record<string, unknown>,
  ): Promise<MoMoCallbackResult> {
    if (!verifyMoMoSignature(body)) {
      return {
        status: "invalid_signature",
        txnRef: String(body.orderId || ""),
        responseCode: "97",
      };
    }

    return processVerifiedCallback(body);
  },
};
