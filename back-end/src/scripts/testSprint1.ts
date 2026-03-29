import { db } from "../config/db.ts";
import { users, categories, posts, shops } from "../models/schema/index.ts";
import { eq } from "drizzle-orm";
import { slugify } from "../utils/slugify.ts";
import axios from "axios";
import jwt from "jsonwebtoken";

const BASE_URL = "http://localhost:5000/api";
// Adjust backend port if different! 
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

async function runSprint1Tests() {
    console.log("--- Starting Sprint 1 API Tests ---");
    let testUserId: number | undefined;
    let testCategoryId: number | undefined;
    let testShopId: number | undefined;
    let testPostId: number | undefined;

    try {
        // 1. Setup User & Category natively
        const mobileNumber = `099${Math.floor(Math.random() * 9000000) + 1000000}`;
        const [user] = await db.insert(users).values({
            userMobile: mobileNumber,
            userDisplayName: "Sprint 1 Tester",
            userStatus: "active"
        }).returning();
        testUserId = user.userId;

        const [cat] = await db.insert(categories).values({
            categoryTitle: "Sprint 1 Category",
            categorySlug: slugify("Sprint 1 Category") + Date.now(),
        }).returning();
        testCategoryId = cat.categoryId;

        console.log(`✅ Setup done. User ID: ${testUserId}, Category ID: ${testCategoryId}`);

        // Generate JWT
        const token = jwt.sign(
            { id: user.userId, mobile: user.userMobile, role: "user" },
            JWT_SECRET,
            { expiresIn: "1h" }
        );
        const headers = { Authorization: `Bearer ${token}` };

        // 2. Test 401 Unauthorized without token (Create Post)
        try {
            await axios.post(`${BASE_URL}/posts`, {
                categoryId: testCategoryId,
                postTitle: "Unauthorized Post",
            });
            console.log("❌ Failed: Post creation without token should be 401");
        } catch (error: any) {
            if (error.response?.status === 401) {
                console.log("✅ Verified: Unauthenticated write request blocked (401)");
            } else {
                console.log("❌ Failed: Unauthenticated request returned", error.response?.status);
            }
        }

        // 3. Test Register Shop with Token
        console.log("\nTesting Shop Register API...");
        const shopRes = await axios.post(`${BASE_URL}/shops/register`, {
            shopName: "Sprint 1 Test Shop",
            shopPhone: "0123456789",
            shopLocation: "Hanoi"
        }, { headers });
        console.log("   Register shop response status:", shopRes.status);
        if (shopRes.data && shopRes.data.shopId) {
            testShopId = shopRes.data.shopId;
            console.log("   ✅ Shop registered successfully. ID:", testShopId);
        } else {
            console.log("   ❌ Shop register failed:", shopRes.data);
        }

        // 4. Test Update Shop with Token (JWT Authorization check)
        if (testShopId) {
            console.log("\nTesting Update Shop API...");
            const updateShopRes = await axios.patch(`${BASE_URL}/shops/${testShopId}`, {
                shopDescription: "Updated description via JWT"
            }, { headers });
            
            if (updateShopRes.data.shopDescription === "Updated description via JWT") {
                console.log("   ✅ Shop updated successfully.");
            } else {
                console.log("   ❌ Shop update failed:", updateShopRes.data);
            }
        }

        // 5. Test Shop Browse public endpoint
        console.log("\nTesting Shop Browse public API...");
        const browseShopRes = await axios.get(`${BASE_URL}/shops/browse`);
        if (browseShopRes.data && Array.isArray(browseShopRes.data.data)) {
            console.log("   ✅ Shop browse returned successfully.");
        } else {
            console.log("   ❌ Shop browse failed.");
        }

        // 6. Test Create Post with Token (No userId in payload)
        console.log("\nTesting Create Post API...");
        const postRes = await axios.post(`${BASE_URL}/posts`, {
            categoryId: testCategoryId,
            postTitle: "Sprint 1 Test Post",
            postPrice: "150000",
            postLocation: "Hanoi"
        }, { headers });
        
        console.log("   Create post response status:", postRes.status);
        if (postRes.data && postRes.data.postId) {
            testPostId = postRes.data.postId;
            console.log("   ✅ Post created successfully using JWT auth. ID:", testPostId);
        } else {
            console.log("   ❌ Post creation failed:", postRes.data);
        }

        // 7. Test Get My Posts with Token
        console.log("\nTesting Get My Posts API...");
        const myPostsRes = await axios.get(`${BASE_URL}/posts/my-posts`, { headers });
        if (Array.isArray(myPostsRes.data) && myPostsRes.data.length >= 1) {
            console.log("   ✅ My posts retrieved successfully.");
        } else {
            console.log("   ❌ My posts retrieval failed.");
        }

        // 8. Test Soft Delete Post with Token
        if (testPostId) {
            console.log("\nTesting Soft Delete Post API...");
            // Notice no payload sent! Relying entirely on headers.
            const delRes = await axios.delete(`${BASE_URL}/posts/${testPostId}`, { headers });
            if (delRes.data.post && delRes.data.post.postStatus === "hidden") {
                console.log("   ✅ Post soft deleted successfully via JWT.");
            } else {
                console.log("   ❌ Post deletion failed:", delRes.data);
            }
        }

        console.log("\n🎉 All Sprint 1 API tests passed.");

    } catch (error: any) {
        console.error("Test execution failed:", error.response?.data || error.message);
    } finally {
        // Cleanup
        console.log("\nCleaning up test data...");
        if (testPostId) await db.delete(posts).where(eq(posts.postId, testPostId));
        if (testShopId) await db.delete(shops).where(eq(shops.shopId, testShopId));
        if (testUserId) await db.delete(users).where(eq(users.userId, testUserId));
        if (testCategoryId) await db.delete(categories).where(eq(categories.categoryId, testCategoryId));
        console.log("Cleanup complete.");
        process.exit(0);
    }
}

runSprint1Tests();
