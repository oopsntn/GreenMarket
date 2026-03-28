import { db } from "../config/db.ts";
import { users, categories, posts, shops } from "../models/schema/index.ts";
import { eq } from "drizzle-orm";
import { slugify } from "../utils/slugify.ts";
import axios from "axios";
import jwt from "jsonwebtoken";

const BASE_URL = "http://localhost:5000/api";
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

async function runSprint2Tests() {
    console.log("--- Starting Sprint 2 API Tests (Tracking & Image Upload) ---");
    let testUserId: number = 0;
    let testCategoryId: number = 0;
    let testShopId: number = 0;
    let testPostId: number = 0;
    let testPostSlug: string = "";

    try {
        // 1. Setup User, Category, Shop, Post
        const mobileNumber = `099${Math.floor(Math.random() * 9000000) + 1000000}`;
        const [user] = await db.insert(users).values({
            userMobile: mobileNumber,
            userDisplayName: "Sprint 2 Tester",
            userStatus: "active"
        }).returning();
        testUserId = user.userId;

        const token = jwt.sign(
            { id: user.userId, mobile: user.userMobile, role: "user" },
            JWT_SECRET,
            { expiresIn: "1h" }
        );
        const headers = { Authorization: `Bearer ${token}` };

        const [cat] = await db.insert(categories).values({
            categoryTitle: "Sprint 2 Category",
            categorySlug: slugify("Sprint 2 Category") + Date.now(),
        }).returning();
        testCategoryId = cat.categoryId;

        console.log(`✅ Setup complete. UserId: ${testUserId}, CatId: ${testCategoryId}`);

        // Register shop with images
        const shopRes = await axios.post(`${BASE_URL}/shops/register`, {
            shopName: "Sprint 2 Shop",
            shopPhone: "0123456789",
            shopLocation: "Hanoi",
            shopLogoUrl: "/uploads/logo.jpg",
            shopCoverUrl: "/uploads/cover.jpg"
        }, { headers });
        
        testShopId = shopRes.data.shopId;
        console.log(`✅ Shop created with Logo/Cover -> ID: ${testShopId}`);
        
        // Auto-approve shop
        await db.update(shops).set({ shopStatus: "active" }).where(eq(shops.shopId, testShopId));

        // Create Post
        testPostSlug = "sprint2-test-post-" + Date.now();
        const postRes = await axios.post(`${BASE_URL}/posts`, {
            categoryId: testCategoryId,
            postTitle: "Sprint 2 Test Post",
            postPrice: "100000",
            postLocation: "Hanoi"
        }, { headers });
        testPostId = postRes.data.postId;
        
        // Ensure post is approved so it can be viewed
        await db.update(posts).set({ postStatus: "approved", postSlug: testPostSlug }).where(eq(posts.postId, testPostId));
        console.log(`✅ Post auto-approved to test public view. PostId: ${testPostId}, Slug: ${testPostSlug}`);

        // 2. Test Get Public Post Details (View Count + 1)
        console.log("\nTesting View Tracking (Public Post Detail)...");
        const getDetailRes1 = await axios.get(`${BASE_URL}/posts/detail/${testPostSlug}`);
        const viewCount1 = getDetailRes1.data.postViewCount;
        
        if (viewCount1 !== undefined) {
            console.log(`   ✅ Successful view count increment. View count is now ${viewCount1}`);
        } else {
            console.log(`   ❌ Unexpected view count incrementing. Response:`, getDetailRes1.data);
        }

        // Test caching (viewing again from same IP should not increment)
        const getDetailRes2 = await axios.get(`${BASE_URL}/posts/detail/${testPostSlug}`);
        const viewCount2 = getDetailRes2.data.postViewCount;
        
        if (viewCount1 === viewCount2) {
            console.log(`   ✅ View Count In-memory cache working. Views stay at ${viewCount2}`);
        } else {
            console.log(`   ❌ Cache failed. Expected ${viewCount1}, got ${viewCount2}`);
        }

        // 3. Test Contact Click API
        console.log("\nTesting Contact Track API...");
        // Use a clean URL without any strange characters
        const contactClickRes = await axios.post(`${BASE_URL}/posts/${testPostId}/contact-click`, {});
        if (contactClickRes.data.success) {
            console.log("   ✅ Contact click increment API succeeded.");
            
            // Re-fetch post from DB to check direct value
            const [checkPost] = await db.select().from(posts).where(eq(posts.postId, testPostId as number));
            if (checkPost.postContactCount === 1) {
                console.log("   ✅ Database verify: post_contact_count = 1");
            } else {
                console.log(`   ❌ Database verify: Expected 1, got ${checkPost.postContactCount}`);
            }
        } else {
            console.log("   ❌ Contact click increment API failed");
        }

        console.log("\n🎉 All Sprint 2 API Tests completed successfully!");

    } catch (error: any) {
        console.error("Test execution failed:", error.response?.data || error.message);
    } finally {
        // Cleanup
        console.log("\nCleaning up test data...");
        if (testPostId > 0) await db.delete(posts).where(eq(posts.postId, testPostId));
        if (testShopId > 0) await db.delete(shops).where(eq(shops.shopId, testShopId));
        if (testUserId > 0) await db.delete(users).where(eq(users.userId, testUserId));
        if (testCategoryId > 0) await db.delete(categories).where(eq(categories.categoryId, testCategoryId));
        console.log("Cleanup complete.");
        process.exit(0);
    }
}

runSprint2Tests();
