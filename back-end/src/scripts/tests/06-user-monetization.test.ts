import axios from "axios";
import { db } from "../../config/db";
import { users, categories, posts, promotionPackages, placementSlots, paymentTxn, postPromotions } from "../../models/schema/index";
import { eq, desc } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { slugify } from "../../utils/slugify";
import crypto from "crypto";
import "dotenv/config";

const BASE_URL = "http://localhost:5000/api";
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";
const VNPAY_HASH_SECRET = process.env.VNPAY_HASH_SECRET || "DUMMY_SECRET_FOR_SANDBOX_1234";

async function runUserMonetizationTests() {
    console.log("--- Starting Test 06: User Monetization (Payment & Promotion) ---");
    let testUserId: number = 0;
    let testCategoryId: number = 0;
    let testPostId: number = 0;
    let testSlotId: number = 0;
    let testPackageId: number = 0;
    let testTxnRef: string = "";

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

        const [post] = await db.insert(posts).values({
            postAuthorId: testUserId,
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
            promotionPackagePrice: "50000.00",
            promotionPackagePublished: true
        }).returning();
        testPackageId = pkg.promotionPackageId;

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
            console.log("✅ Passed: Buy package returned VNPay URL.");
            
            // Extract txnRef from URL for mock IPN (it's vnp_TxnRef)
            const url = new URL(buyRes.data.paymentUrl);
            testTxnRef = url.searchParams.get("vnp_TxnRef") || "";
            console.log(`✅ Transaction Reference: ${testTxnRef}`);
        } else {
             console.log("❌ Failed: Payment URL not found in response.");
             process.exit(1);
        }

        // 3. Simulate Successful IPN call
        console.log("\n[Test] Mocking Successful VNPay IPN Callback...");
        const amount = 50000 * 100; // 50,000 VND * 100
        const vnpParams: any = {
            vnp_Amount: String(amount),
            vnp_ResponseCode: "00",
            vnp_TxnRef: testTxnRef,
            vnp_OrderInfo: "Mock IPN Test",
            vnp_ResponseId: "RESP-" + Date.now()
        };

        // Sign the mock IPN payload
        const searchParams = new URLSearchParams();
        Object.keys(vnpParams).sort().forEach(key => searchParams.append(key, vnpParams[key]));
        const hmac = crypto.createHmac("sha512", VNPAY_HASH_SECRET);
        const signature = hmac.update(Buffer.from(searchParams.toString(), "utf-8")).digest("hex");
        vnpParams.vnp_SecureHash = signature;

        // Call the Webhook IPN endpoint
        const ipnRes = await axios.get(`${BASE_URL}/payment/vnpay-ipn`, { params: vnpParams });
        if (ipnRes.data && ipnRes.data.RspCode === "00") {
             console.log("✅ Passed: IPN webhook processed successfully.");
        } else {
             console.log("❌ Failed: IPN processing failed:", ipnRes.data);
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
            const topPost = postsArray[0];
            if (topPost.postId === testPostId && topPost.isPromoted === true) {
                 console.log(`✅ Passed: Promoted post (ID: ${topPost.postId}) is at TOP 1.`);
            } else {
                 console.log(`❌ Failed: Sorting mismatch. Top postId: ${topPost.postId}, isPromoted: ${topPost.isPromoted}`);
                 process.exit(1);
            }
        }

        console.log("\n🎉 All Test 06: User Monetization passed.\n");

    } catch (error: any) {
        console.error("Test execution failed:", error.response?.data || error.message);
        process.exit(1);
    } finally {
        console.log("Cleaning up Test 06 data...");
        if (testPostId) await db.delete(posts).where(eq(posts.postId, testPostId));
        if (testUserId) await db.delete(users).where(eq(users.userId, testUserId));
        if (testCategoryId) await db.delete(categories).where(eq(categories.categoryId, testCategoryId));
        if (testPackageId) await db.delete(promotionPackages).where(eq(promotionPackages.promotionPackageId, testPackageId));
        if (testSlotId) await db.delete(placementSlots).where(eq(placementSlots.placementSlotId, testSlotId));
        console.log("Cleanup complete.");
        process.exit(0);
    }
}

runUserMonetizationTests();
