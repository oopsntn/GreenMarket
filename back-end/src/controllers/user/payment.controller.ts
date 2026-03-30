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
import { createVNPayUrl, verifyVNPayCallback } from "../../utils/vnpay";
import { v4 as uuidv4 } from "uuid";

export const createPayment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const { postId, packageId } = req.body;
        const parsedPostId = parseId(postId);
        const parsedPackageId = parseId(packageId);

        if (!parsedPostId || !parsedPackageId) {
            res.status(400).json({ error: "postId and packageId are required" });
            return;
        }

        // 1. Verify user owns the post
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

        // 2. Verify package exists and is published
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

        const [slot] = await db.select().from(placementSlots).where(eq(placementSlots.placementSlotId, pkg.slotId)).limit(1);
        if (!slot || !slot.placementSlotPublished) {
            res.status(400).json({ error: "The associated placement slot is currently disabled" });
            return;
        }

        // 3. Create a unique transaction reference (e.g. TXN-uuid)
        // VNPay allows max 100 varchar for TxnRef
        const txnRef = `TXN-${uuidv4().substring(0, 8)}-${Date.now()}`;

        // 4. Save payment txn as pending
        await db.insert(paymentTxn).values({
            paymentTxnUserId: userId,
            paymentTxnPostId: parsedPostId,
            paymentTxnPackageId: parsedPackageId,
            paymentTxnAmount: String(pkg.price),
            paymentTxnProvider: "VNPAY",
            paymentTxnProviderTxnId: txnRef,
            paymentTxnStatus: "pending",
        });

        // 5. Generate VNPay URL
        const ipAddr = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "127.0.0.1";
        const orderInfo = `Thanh toan goi promotion ${pkg.packageId} cho bai viet ${parsedPostId}`;
        const paymentUrl = createVNPayUrl(
            Array.isArray(ipAddr) ? ipAddr[0] : ipAddr,
            Number(pkg.price),
            orderInfo,
            txnRef
        );

        res.json({ paymentUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const vnpayReturn = async (req: Request, res: Response): Promise<void> => {
    try {
        const query = req.query as any;

        const isVerified = verifyVNPayCallback(query);
        const responseCode = query["vnp_ResponseCode"];

        if (isVerified) {
            if (responseCode === "00") {
                // Return success HTML or redirect to frontend success page
                res.send(`
                    <html>
                    <head><title>Thanh toán thành công</title></head>
                    <body style="font-family: Arial; text-align: center; padding: 50px;">
                        <h1 style="color: #4CAF50;">Thanh toán thành công</h1>
                        <p>Bài viết của bạn đã kích hoạt gói VIP.</p>
                        <a href="http://localhost:5173/posts/my-posts">Quay lại quản lý bài viết</a>
                    </body>
                    </html>
                `);
            } else {
                res.send(`
                    <html>
                    <head><title>Thanh toán thất bại</title></head>
                    <body style="font-family: Arial; text-align: center; padding: 50px;">
                        <h1 style="color: #F44336;">Thanh toán thất bại</h1>
                        <p>Mã lỗi từ VNPay: ${responseCode}</p>
                        <a href="http://localhost:5173/posts/my-posts">Quay lại quản lý bài viết</a>
                    </body>
                    </html>
                `);
            }
        } else {
            res.status(400).send("Chữ ký không hợp lệ");
        }
    } catch (error) {
        console.error("Return URL Error:", error);
        res.status(500).send("Lỗi xử lý hệ thống");
    }
};

export const vnpayIpn = async (req: Request, res: Response): Promise<void> => {
    try {
        const query = req.query as any;
        const isVerified = verifyVNPayCallback(query);

        if (!isVerified) {
            res.status(200).json({ RspCode: "97", Message: "Invalid signature" });
            return;
        }

        const txnRef = query["vnp_TxnRef"];
        const responseCode = query["vnp_ResponseCode"];

        // Look up the transaction
        const [txn] = await db.select().from(paymentTxn).where(eq(paymentTxn.paymentTxnProviderTxnId, txnRef)).limit(1);

        if (!txn) {
            res.status(200).json({ RspCode: "01", Message: "Order not found" });
            return;
        }

        if (txn.paymentTxnStatus === "success" || txn.paymentTxnStatus === "failed") {
            // Re-processing an already completed transaction is safe but we just acknowledge
            res.status(200).json({ RspCode: "02", Message: "Order already confirmed" });
            return;
        }

        // Compare amount. VNPay amount is * 100
        const vnpAmount = Number(query["vnp_Amount"]);
        const requiredAmount = Number(txn.paymentTxnAmount) * 100;
        
        if (vnpAmount !== requiredAmount) {
             res.status(200).json({ RspCode: "04", Message: "Invalid amount" });
             return;
        }

        if (responseCode === "00") {
            // 1. Mark transaction as success
            await db.update(paymentTxn).set({ paymentTxnStatus: "success" }).where(eq(paymentTxn.paymentTxnId, txn.paymentTxnId));

            // 2. Add promotion package to the post
            const [pkg] = await db.select().from(promotionPackages).where(eq(promotionPackages.promotionPackageId, txn.paymentTxnPackageId)).limit(1);
            if (pkg) {
                const now = new Date();
                const durationDays = pkg.promotionPackageDurationDays || 0;
                const endDate = new Date(now.getTime() + (durationDays * 24 * 60 * 60 * 1000));
                
                // If the post already has active promotions, we might need to extend but for v1 just create a new one.
                if (txn.paymentTxnPostId) {
                    await db.insert(postPromotions).values({
                        postPromotionPostId: txn.paymentTxnPostId,
                        postPromotionBuyerId: txn.paymentTxnUserId,
                        postPromotionPackageId: txn.paymentTxnPackageId,
                        postPromotionSlotId: pkg.promotionPackageSlotId,
                        postPromotionStartAt: now,
                        postPromotionEndAt: endDate,
                        postPromotionStatus: "active"
                    });
                }
            }

            res.status(200).json({ RspCode: "00", Message: "Confirm Success" });
            return;
        } else {
            // Mark transaction as failed
            await db.update(paymentTxn).set({ paymentTxnStatus: "failed" }).where(eq(paymentTxn.paymentTxnId, txn.paymentTxnId));
            res.status(200).json({ RspCode: "00", Message: "Confirm Failed Payment" });
            return;
        }
    } catch (error) {
        console.error("IPN Error:", error);
        res.status(200).json({ RspCode: "99", Message: "Unknown error" });
    }
};
