import axios from "axios";
import { db } from "../../config/db";
import { users, categories, posts, promotionPackages, promotionPackagePrices, placementSlots, transactions, postPromotions, shops } from "../../models/schema/index";
import { eq, desc, sql } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { slugify } from "../../utils/slugify";
import crypto from "crypto";
import "dotenv/config";

const BASE_URL = "http://localhost:5000/api";
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";
const MOMO_SECRET_KEY = process.env.MOMO_SECRET_KEY || "at67qH6vSR9S5su4f06s0696Ien237Y3";
const MOMO_ACCESS_KEY = process.env.MOMO_ACCESS_KEY || "klm056dS9pP66c8B";
const MOMO_PARTNER_CODE = process.env.MOMO_PARTNER_CODE || "MOMOBKUN20180529";

async function runUserMonetizationTests() {
    console.log("--- Starting Test 06: User Monetization (MoMo Payment & Promotion) ---");
    let testUserId: number = 0;
    let testCategoryId: number = 0;
    let testPostId: number = 0;
    let testShopId: number = 0;
    let testSlotId: number = 0;
    let testPackageId: number = 0;
    let testOrderId: string = "";

    try {
        // 1. Setup Data
        const mobileNumber = `099${Math.floor(Math.random() * 9000000) + 1000000}`;
        const [user] = await db.insert(users).values({
            userMobile: mobileNumber,
            userDisplayName: "Premium Tester",
            userStatus: "active"
        }).returning();
        testUserId = user.userId;

        const [cat] = await db.insert(categories).values({
            categoryTitle: "Monetization Cat",
            categorySlug: slugify("Monetization Cat") + Date.now(),
        }).returning();
        testCategoryId = cat.categoryId;

        const [shop] = await db.insert(shops).values({
            shopId: testUserId,
            shopName: "Premium Test Shop",
            shopStatus: "active",
        }).returning();
        testShopId = shop.shopId;

        const [post] = await db.insert(posts).values({
            postAuthorId: testUserId,
            postShopId: testShopId,
            categoryId: testCategoryId,
            postTitle: "Premium Test Post",
            postPrice: "100000",
            postLocation: "Hanoi",
            postStatus: "approved",
            postSlug: "premium-post-" + Date.now()
        }).returning();
        testPostId = post.postId;

        const [slot] = await db.insert(placementSlots).values({
            placementSlotCode: `USER_PAY_SSLOT_${Date.now()}`,
            placementSlotTitle: "User Test Slot",
            placementSlotPublished: true
        }).returning();
        testSlotId = slot.placementSlotId;

        const [pkg] = await db.insert(promotionPackages).values({
            promotionPackageSlotId: testSlotId,
            promotionPackageTitle: "User Test Pkg",
            promotionPackageDurationDays: 30,
            promotionPackagePublished: true
        }).returning();
        testPackageId = pkg.promotionPackageId;

        await db.insert(promotionPackagePrices).values({
            packageId: testPackageId,
            price: "50000.00",
            effectiveFrom: new Date(),
            note: "Test seed price",
        });

        console.log(`✅ Setup complete. PostId: ${testPostId}, PkgId: ${testPackageId}`);

        // Generate JWT
        const token = jwt.sign({ id: user.userId, mobile: user.userMobile, role: "user" }, JWT_SECRET, { expiresIn: "1h" });
        const headers = { Authorization: `Bearer ${token}` };

        // 2. Test Create Payment (Buy Package)
        console.log("\n[Test] Calling POST /api/payment/buy-package...");
        const buyRes = await axios.post(`${BASE_URL}/payment/buy-package`, {
            postId: testPostId,
            packageId: testPackageId
        }, { headers });
        
        if (buyRes.data && buyRes.data.paymentUrl) {
            console.log("✅ Passed: Buy package returned MoMo URL.");
            
            // In a real flow, we'd redirect. Here we extract orderId from DB or mock it.
            const [txn] = await db.select().from(transactions).where(eq(sql<number>`(${transactions.transactionMeta}->>'postId')::int`, testPostId)).limit(1);
            testOrderId = txn.transactionProviderTxnId || "";
            console.log(`✅ Order ID: ${testOrderId}`);
        } else {
             console.log("❌ Failed: Payment URL not found in response.");
             process.exit(1);
        }

        // 3. Simulate Successful IPN call
        console.log("\n[Test] Mocking Successful MoMo IPN Callback...");
        const amount = 50000; 
        const momoParams: any = {
            partnerCode: MOMO_PARTNER_CODE,
            orderId: testOrderId,
            requestId: testOrderId,
            amount: amount,
            orderInfo: "Mock IPN Test",
            orderType: "momo_wallet",
            transId: Date.now(),
            resultCode: 0,
            message: "Success",
            payType: "qr",
            responseTime: Date.now(),
            extraData: "",
            signature: ""
        };

        // Sign the mock IPN payload (Momo Callback Signature)
        const rawSignature = 
            `accessKey=${MOMO_ACCESS_KEY}&` +
            `amount=${momoParams.amount}&` +
            `extraData=${momoParams.extraData}&` +
            `message=${momoParams.message}&` +
            `orderId=${momoParams.orderId}&` +
            `orderInfo=${momoParams.orderInfo}&` +
            `partnerCode=${momoParams.partnerCode}&` +
            `requestId=${momoParams.requestId}&` +
            `responseTime=${momoParams.responseTime}&` +
            `resultCode=${momoParams.resultCode}&` +
            `transId=${momoParams.transId}`;

        const signature = crypto.createHmac("sha256", MOMO_SECRET_KEY).update(rawSignature).digest("hex");
        momoParams.signature = signature;

        // Call the Webhook IPN endpoint (POST for MoMo IPN)
        const ipnRes = await axios.post(`${BASE_URL}/payment/momo-ipn`, momoParams);
        if (ipnRes.status === 204 || ipnRes.status === 200) {
             console.log("✅ Passed: IPN webhook processed successfully.");
        } else {
             console.log("❌ Failed: IPN processing failed:", ipnRes.status, ipnRes.data);
             process.exit(1);
        }

        // 4. Verify Activation
        console.log("\n[Test] Verifying Promotion Activation in DB...");
        const [promo] = await db.select().from(postPromotions).where(eq(postPromotions.postPromotionPostId, testPostId));
        if (promo && promo.postPromotionStatus === "active") {
            console.log("✅ Passed: PostPromotion is now ACTIVE.");
        } else {
            console.log("❌ Failed: Promotion record missing or not active.");
            process.exit(1);
        }

        // 5. Verify Feed Sorting
        console.log("\n[Test] Verifying Feed sorting (Promoted posts first)...");
        const feedRes = await axios.get(`${BASE_URL}/posts/browse`);
        const postsArray = feedRes.data.data;
        if (postsArray && postsArray.length > 0) {
            // Since there might be other promoted posts, we look for our testPostId in the first few slots
            const topPostIds = postsArray.slice(0, 5).map((p: any) => p.postId);
            if (topPostIds.includes(testPostId)) {
                 console.log(`✅ Passed: Promoted post (ID: ${testPostId}) is found in Top 5.`);
            } else {
                 console.log(`❌ Failed: Sorting mismatch. Our post not in top 5. Top postIds: ${topPostIds}`);
                 process.exit(1);
            }
        }

        console.log("\n🎉 All Test 06: User Monetization (MoMo) passed.\n");

    } catch (error: any) {
        console.error("Test execution failed:", error.response?.data || error.message);
        process.exit(1);
    } finally {
        console.log("Cleaning up Test 06 data...");
        if (testPostId) await db.delete(posts).where(eq(posts.postId, testPostId));
        if (testShopId) await db.delete(shops).where(eq(shops.shopId, testShopId));
        if (testUserId) await db.delete(users).where(eq(users.userId, testUserId));
        if (testCategoryId) await db.delete(categories).where(eq(categories.categoryId, testCategoryId));
        if (testPackageId) await db.delete(promotionPackages).where(eq(promotionPackages.promotionPackageId, testPackageId));
        if (testSlotId) await db.delete(placementSlots).where(eq(placementSlots.placementSlotId, testSlotId));
        console.log("Cleanup complete.");
        process.exit(0);
    }
}

runUserMonetizationTests();
