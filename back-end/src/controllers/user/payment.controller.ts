import { Request, Response } from "express";
import { db } from "../../config/db.ts";
import { eq, and, lte, or, isNull, gt } from "drizzle-orm";
import { posts } from "../../models/schema/posts.ts";
import { promotionPackages } from "../../models/schema/promotion-packages.ts";
import { promotionPackagePrices } from "../../models/schema/promotion-package-prices.ts";
import { paymentTxn } from "../../models/schema/payment-txn.ts";
import { postPromotions } from "../../models/schema/post-promotions.ts";
import { placementSlots } from "../../models/schema/placement-slots.ts";
import { AuthRequest } from "../../dtos/auth.ts";
import { parseId } from "../../utils/parseId.ts";
import {
    createMoMoPaymentRequest,
    validateMoMoConfig,
    verifyMoMoSignature,
    buildFrontendPaymentResultUrl,
    getMoMoConfig,
    createMoMoSignature
} from "../../utils/momo.ts";
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

const processMoMoCallback = async (body: Record<string, any>): Promise<CallbackResult> => {
    const txnRef = String(body.orderId || "");
    const responseCode = String(body.resultCode); // 0 = Success

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

    const moMoAmount = Number(body.amount);
    const requiredAmount = Number(txn.paymentTxnAmount || 0);
    if (Number.isFinite(moMoAmount) && requiredAmount > 0 && moMoAmount !== requiredAmount) {
        await updateTxnStatusIfPending(txn.paymentTxnId, "failed");
        return { status: "invalid_amount", txnRef, responseCode };
    }

    if (responseCode === "0") {
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

        const configCheck = validateMoMoConfig();
        if (!configCheck.isValid) {
            res.status(500).json({
                error: "MoMo configuration is missing",
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

        const now = new Date();
        const [pkg] = await db
            .select({
                promotionPackageId: promotionPackages.promotionPackageId,
                promotionPackagePublished: promotionPackages.promotionPackagePublished,
                promotionPackageSlotId: promotionPackages.promotionPackageSlotId,
                promotionPackageDurationDays: promotionPackages.promotionPackageDurationDays,
                promotionPackagePrice: promotionPackagePrices.price,
            })
            .from(promotionPackages)
            .leftJoin(
                promotionPackagePrices,
                and(
                    eq(promotionPackagePrices.packageId, promotionPackages.promotionPackageId),
                    lte(promotionPackagePrices.effectiveFrom, now),
                    or(
                        isNull(promotionPackagePrices.effectiveTo),
                        gt(promotionPackagePrices.effectiveTo, now)
                    )
                )
            )
            .where(eq(promotionPackages.promotionPackageId, parsedPackageId))
            .limit(1);

        if (!pkg || !pkg.promotionPackagePublished) {
            res.status(404).json({ error: "Promotion package not found or not available" });
            return;
        }

        const [slot] = await db
            .select()
            .from(placementSlots)
            .where(eq(placementSlots.placementSlotId, pkg.promotionPackageSlotId))
            .limit(1);

        if (!slot || !slot.placementSlotPublished) {
            res.status(400).json({ error: "The associated placement slot is currently disabled" });
            return;
        }

        const amount = Number(pkg.promotionPackagePrice);
        if (!Number.isFinite(amount) || amount <= 0) {
            res.status(400).json({ error: "Invalid package price" });
            return;
        }

        const finalAmount = Math.round(amount);

        const orderId = `GM${Date.now()}`; // Simplified orderId
        const requestId = orderId; 
        
        // Strictly alphanumeric orderInfo for maximum reliability
        const orderInfo = `PayPromotionPkg${pkg.promotionPackageId}Post${parsedPostId}`;

        await db.insert(paymentTxn).values({
            paymentTxnUserId: userId,
            paymentTxnPostId: parsedPostId,
            paymentTxnPackageId: parsedPackageId,
            paymentTxnAmount: String(finalAmount),
            paymentTxnProvider: "MOMO",
            paymentTxnProviderTxnId: orderId,
            paymentTxnStatus: "pending",
        });

        const { payUrl } = await createMoMoPaymentRequest(finalAmount, orderId, orderInfo, requestId);
        res.json({ paymentUrl: payUrl });
    } catch (error: any) {
        console.error("Create Payment Error:", error.message);
        res.status(500).json({ 
            error: "MoMo Payment Initiation Failed", 
            message: error.message 
        });
    }
};

export const momoReturn = async (req: Request, res: Response): Promise<void> => {
    try {
        const body = req.query; // MoMo uses GET for return URL
        const orderId = String(body.orderId || "");

        if (!verifyMoMoSignature(body)) {
            const redirectUrl = buildFrontendPaymentResultUrl({
                status: "failed",
                code: "97",
                txnRef: orderId,
                message: "invalid_signature"
            });
            res.redirect(302, redirectUrl);
            return;
        }

        const result = await processMoMoCallback(body);
        const isSuccess = result.status === "success" || result.status === "already_success";

        const redirectUrl = buildFrontendPaymentResultUrl({
            status: isSuccess ? "success" : "failed",
            code: result.responseCode || (isSuccess ? "0" : "99"),
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

export const momoIpn = async (req: Request, res: Response): Promise<void> => {
    try {
        const body = req.body; // MoMo uses POST for IPN
        
        if (!verifyMoMoSignature(body)) {
            res.status(200).json({ resultCode: 97, message: "Invalid signature" });
            return;
        }

        const result = await processMoMoCallback(body);

        if (result.status === "not_found") {
            res.status(200).json({ resultCode: 11, message: "Order not found" });
            return;
        }

        // MoMo resultCode 0 is success
        res.status(204).send(); // Standard IPN response
    } catch (error) {
        console.error("IPN Error:", error);
        res.status(500).send();
    }
};

export const mockGate = async (req: Request, res: Response): Promise<void> => {
    const { orderId, amount, extraData, orderInfo, requestId } = req.query;

    const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thanh Toán MoMo (MOCK)</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f4; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .container { background-color: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 100%; max-width: 400px; text-align: center; }
            .logo { width: 80px; height: 80px; background-color: #a50064; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; }
            .logo span { color: white; font-weight: bold; font-size: 24px; }
            .amount { font-size: 28px; font-weight: bold; color: #a50064; margin-bottom: 10px; }
            .info { color: #666; margin-bottom: 30px; font-size: 14px; line-height: 1.5; }
            .btn { background-color: #a50064; color: white; border: none; padding: 14px 24px; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; width: 100%; margin-bottom: 10px; transition: background 0.2s; }
            .btn:hover { background-color: #8c0054; }
            .btn-cancel { background-color: #fce4ec; color: #a50064; }
            .btn-cancel:hover { background-color: #f8bbd0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo"><span>MoMo</span></div>
            <h2>Môi trường Thử nghiệm</h2>
            <div class="amount">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount))}</div>
            <div class="info">Mã ĐH: <strong>${orderId}</strong><br/>${orderInfo}</div>
            
            <form action="/api/payment/mock-gate-process" method="POST">
                <input type="hidden" name="orderId" value="${orderId}">
                <input type="hidden" name="amount" value="${amount}">
                <input type="hidden" name="extraData" value="${extraData || ''}">
                <input type="hidden" name="orderInfo" value="${orderInfo}">
                <input type="hidden" name="requestId" value="${requestId}">
                <input type="hidden" name="action" value="success">
                <button type="submit" class="btn">Thanh Toán Trực Tiếp (0đ)</button>
            </form>

            <form action="/api/payment/mock-gate-process" method="POST">
                <input type="hidden" name="orderId" value="${orderId}">
                <input type="hidden" name="amount" value="${amount}">
                <input type="hidden" name="extraData" value="${extraData || ''}">
                <input type="hidden" name="orderInfo" value="${orderInfo}">
                <input type="hidden" name="requestId" value="${requestId}">
                <input type="hidden" name="action" value="cancel">
                <button type="submit" class="btn btn-cancel">Huỷ Thanh Toán</button>
            </form>
        </div>
    </body>
    </html>
    `;

    res.send(html);
};

export const mockGateProcess = async (req: Request, res: Response): Promise<void> => {
    const { orderId, amount, extraData, orderInfo, requestId, action } = req.body;
    const config = getMoMoConfig();

    const resultCode = action === "success" ? 0 : 1006;
    const message = action === "success" ? "Successful." : "Transaction denied by user.";
    const responseTime = Date.now().toString();
    const transId = Math.floor(Math.random() * 10000000000).toString();

    const rawSignature = 
        `accessKey=${config.accessKey}&` +
        `amount=${amount}&` +
        `extraData=${extraData || ""}&` +
        `message=${message}&` +
        `orderId=${orderId}&` +
        `orderInfo=${orderInfo}&` +
        `partnerCode=${config.partnerCode}&` +
        `requestId=${requestId}&` +
        `responseTime=${responseTime}&` +
        `resultCode=${resultCode}&` +
        `transId=${transId}`;

    const signature = createMoMoSignature(rawSignature, config.secretKey);

    const payload = {
        partnerCode: config.partnerCode,
        orderId,
        requestId,
        amount,
        orderInfo,
        orderType: "momo_wallet",
        transId,
        resultCode,
        message,
        payType: "qr",
        responseTime,
        extraData: extraData || "",
        signature
    };

    // MoMo calls IPN via POST in the background
    try {
        // We use localhost:5000 explicitly for the test environment
        fetch(`http://localhost:5000/api/payment/momo-ipn`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        }).catch(e => console.error("Mock IPN Error: ", e));
    } catch(err) {
        console.log(err);
    }
   
    // MoMo redirects User to ReturnUrl
    const url = new URL(config.redirectUrl);
    Object.entries(payload).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
    });

    res.redirect(302, url.toString());
};
