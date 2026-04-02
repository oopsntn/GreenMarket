import { Request, Response } from "express";
import { db } from "../../config/db";
import { eq, and } from "drizzle-orm";
import { posts } from "../../models/schema/posts";
import { promotionPackages } from "../../models/schema/promotion-packages";
import { paymentTxn } from "../../models/schema/payment-txn";
import { postPromotions } from "../../models/schema/post-promotions";
import { placementSlots } from "../../models/schema/placement-slots";
import { AuthRequest } from "../../dtos/auth";
import { parseId } from "../../utils/parseId";
import {
    createVNPayUrl,
    verifyVNPayCallback,
    validateVNPayConfig,
    buildFrontendPaymentResultUrl
} from "../../utils/vnpay";
import { v4 as uuidv4 } from "uuid";

type CallbackStatus =
    | "success"
    | "failed"
    | "already_success"
    | "already_failed"
    | "not_found"
    | "invalid_amount";

type CallbackResult = {
    status: CallbackStatus;
    txnRef?: string;
    responseCode?: string;
};

const normalizeIpAddress = (rawIp: string): string => {
    if (!rawIp) return "127.0.0.1";
    const firstIp = rawIp.split(",")[0]?.trim();
    return firstIp || "127.0.0.1";
};

const updateTxnStatusIfPending = async (txnId: number, status: "success" | "failed") => {
    const [updatedTxn] = await db
        .update(paymentTxn)
        .set({ paymentTxnStatus: status })
        .where(
            and(
                eq(paymentTxn.paymentTxnId, txnId),
                eq(paymentTxn.paymentTxnStatus, "pending")
            )
        )
        .returning();

    return updatedTxn || null;
};

const activatePromotionForTransaction = async (txn: typeof paymentTxn.$inferSelect): Promise<void> => {
    if (!txn.paymentTxnPostId) return;

    const [pkg] = await db
        .select()
        .from(promotionPackages)
        .where(eq(promotionPackages.promotionPackageId, txn.paymentTxnPackageId))
        .limit(1);

    if (!pkg) return;

    const now = new Date();
    const durationDays = Number(pkg.promotionPackageDurationDays || 0);
    const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    await db.insert(postPromotions).values({
        postPromotionPostId: txn.paymentTxnPostId,
        postPromotionBuyerId: txn.paymentTxnUserId,
        postPromotionPackageId: txn.paymentTxnPackageId,
        postPromotionSlotId: pkg.promotionPackageSlotId,
        postPromotionStartAt: now,
        postPromotionEndAt: endDate,
        postPromotionStatus: "active"
    });
};

const processVNPayCallback = async (query: Record<string, unknown>): Promise<CallbackResult> => {
    const txnRef = String(query["vnp_TxnRef"] || "");
    const responseCode = String(query["vnp_ResponseCode"] || "");

    const [txn] = await db
        .select()
        .from(paymentTxn)
        .where(eq(paymentTxn.paymentTxnProviderTxnId, txnRef))
        .limit(1);

    if (!txn) {
        return { status: "not_found", txnRef, responseCode };
    }

    if (txn.paymentTxnStatus === "success") {
        return { status: "already_success", txnRef, responseCode };
    }

    if (txn.paymentTxnStatus === "failed") {
        return { status: "already_failed", txnRef, responseCode };
    }

    const vnpAmount = Number(query["vnp_Amount"]);
    const requiredAmount = Math.round(Number(txn.paymentTxnAmount || 0) * 100);
    if (Number.isFinite(vnpAmount) && requiredAmount > 0 && vnpAmount !== requiredAmount) {
        await updateTxnStatusIfPending(txn.paymentTxnId, "failed");
        return { status: "invalid_amount", txnRef, responseCode };
    }

    if (responseCode === "00") {
        const updated = await updateTxnStatusIfPending(txn.paymentTxnId, "success");
        if (updated) {
            await activatePromotionForTransaction(updated);
            return { status: "success", txnRef, responseCode };
        }

        const [latestTxn] = await db
            .select()
            .from(paymentTxn)
            .where(eq(paymentTxn.paymentTxnId, txn.paymentTxnId))
            .limit(1);

        if (latestTxn?.paymentTxnStatus === "success") {
            return { status: "already_success", txnRef, responseCode };
        }

        return { status: "failed", txnRef, responseCode };
    }

    await updateTxnStatusIfPending(txn.paymentTxnId, "failed");
    return { status: "failed", txnRef, responseCode };
};

export const createPayment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const configCheck = validateVNPayConfig();
        if (!configCheck.isValid) {
            res.status(500).json({
                error: "VNPay configuration is missing",
                missing: configCheck.missingFields
            });
            return;
        }

        const { postId, packageId } = req.body;
        const parsedPostId = parseId(postId);
        const parsedPackageId = parseId(packageId);

        if (!parsedPostId || !parsedPackageId) {
            res.status(400).json({ error: "postId and packageId are required" });
            return;
        }

        const [post] = await db.select().from(posts).where(eq(posts.postId, parsedPostId)).limit(1);
        if (!post) {
            res.status(404).json({ error: "Post not found" });
            return;
        }
        if (post.postAuthorId !== userId) {
            res.status(403).json({ error: "You do not have permission to promote this post" });
            return;
        }
        if (post.postStatus !== "approved") {
            res.status(400).json({ error: "Only approved posts can be promoted" });
            return;
        }

        const [pkg] = await db
            .select({
                packageId: promotionPackages.promotionPackageId,
                price: promotionPackages.promotionPackagePrice,
                isPublished: promotionPackages.promotionPackagePublished,
                slotId: promotionPackages.promotionPackageSlotId,
            })
            .from(promotionPackages)
            .where(eq(promotionPackages.promotionPackageId, parsedPackageId))
            .limit(1);

        if (!pkg || !pkg.isPublished) {
            res.status(404).json({ error: "Promotion package not found or not available" });
            return;
        }

        const [slot] = await db
            .select()
            .from(placementSlots)
            .where(eq(placementSlots.placementSlotId, pkg.slotId))
            .limit(1);

        if (!slot || !slot.placementSlotPublished) {
            res.status(400).json({ error: "The associated placement slot is currently disabled" });
            return;
        }

        const amount = Number(pkg.price);
        if (!Number.isFinite(amount) || amount <= 0) {
            res.status(400).json({ error: "Invalid package price" });
            return;
        }

        const txnRef = `TXN-${uuidv4().substring(0, 8)}-${Date.now()}`;

        await db.insert(paymentTxn).values({
            paymentTxnUserId: userId,
            paymentTxnPostId: parsedPostId,
            paymentTxnPackageId: parsedPackageId,
            paymentTxnAmount: String(pkg.price),
            paymentTxnProvider: "VNPAY",
            paymentTxnProviderTxnId: txnRef,
            paymentTxnStatus: "pending",
        });

        const rawIp = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "127.0.0.1");
        const ipAddr = normalizeIpAddress(rawIp);
        const orderInfo = `Thanh toan goi quang ba ${pkg.packageId} cho bai ${parsedPostId}`;

        const paymentUrl = createVNPayUrl(ipAddr, amount, orderInfo, txnRef);
        res.json({ paymentUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const vnpayReturn = async (req: Request, res: Response): Promise<void> => {
    try {
        const query = req.query as Record<string, unknown>;
        const txnRef = String(query["vnp_TxnRef"] || "");

        if (!verifyVNPayCallback(query)) {
            const redirectUrl = buildFrontendPaymentResultUrl({
                status: "failed",
                code: "97",
                txnRef,
                message: "invalid_signature"
            });
            res.redirect(302, redirectUrl);
            return;
        }

        const result = await processVNPayCallback(query);
        const isSuccess = result.status === "success" || result.status === "already_success";

        const redirectUrl = buildFrontendPaymentResultUrl({
            status: isSuccess ? "success" : "failed",
            code: result.responseCode || (isSuccess ? "00" : "99"),
            txnRef: result.txnRef,
            message: result.status
        });
        res.redirect(302, redirectUrl);
    } catch (error) {
        console.error("Return URL Error:", error);
        const redirectUrl = buildFrontendPaymentResultUrl({
            status: "failed",
            code: "99",
            message: "system_error"
        });
        res.redirect(302, redirectUrl);
    }
};

export const vnpayIpn = async (req: Request, res: Response): Promise<void> => {
    try {
        const query = req.query as Record<string, unknown>;

        if (!verifyVNPayCallback(query)) {
            res.status(200).json({ RspCode: "97", Message: "Invalid signature" });
            return;
        }

        const result = await processVNPayCallback(query);

        if (result.status === "not_found") {
            res.status(200).json({ RspCode: "01", Message: "Order not found" });
            return;
        }

        if (result.status === "already_success" || result.status === "already_failed") {
            res.status(200).json({ RspCode: "02", Message: "Order already confirmed" });
            return;
        }

        if (result.status === "invalid_amount") {
            res.status(200).json({ RspCode: "04", Message: "Invalid amount" });
            return;
        }

        res.status(200).json({ RspCode: "00", Message: "Confirm Success" });
    } catch (error) {
        console.error("IPN Error:", error);
        res.status(200).json({ RspCode: "99", Message: "Unknown error" });
    }
};
