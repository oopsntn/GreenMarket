import axios from "axios";
import { db } from "../../config/db";
import { users, categories, posts } from "../../models/schema/index";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { slugify } from "../../utils/slugify";
import "dotenv/config";

const BASE_URL = "http://localhost:5000/api";
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

async function runUserPostTests() {
    console.log("--- Starting Test 03: User Post Management ---");
    let testUserId: number | undefined;
    let testCategoryId: number | undefined;
    let testPostId: number | undefined;

    try {
        // Setup User & Category
        const mobileNumber = `099${Math.floor(Math.random() * 9000000) + 1000000}`;
        const [user] = await db.insert(users).values({
            userMobile: mobileNumber,
            userDisplayName: "Post Tester",
            userStatus: "active"
        }).returning();
        testUserId = user.userId;

        const [cat] = await db.insert(categories).values({
            categoryTitle: "Test Categorie Post",
            categorySlug: slugify("Test Categorie Post") + Date.now(),
        }).returning();
        testCategoryId = cat.categoryId;

        console.log(`✅ Test Setup: User created (ID: ${testUserId}), Category created (ID: ${testCategoryId})`);

        // Generate JWT
        const token = jwt.sign(
            { id: user.userId, mobile: user.userMobile, role: "user" },
            JWT_SECRET,
            { expiresIn: "1h" }
        );
        const headers = { Authorization: `Bearer ${token}` };

        // Test 1: Create Post
        console.log("\n[Test] Calling POST /posts...");
        const postRes = await axios.post(`${BASE_URL}/posts`, {
            categoryId: testCategoryId,
            postTitle: "Sprint 1 Split Test Post",

            postLocation: "Bac Ninh"
        }, { headers });
        
        if (postRes.data && postRes.data.postId) {
            testPostId = postRes.data.postId;
            console.log(`✅ Passed: Post created successfully (ID: ${testPostId})`);
        } else {
            console.log("❌ Failed: Post creation failed or returned unexpected schema.");
            process.exit(1);
        }

        // Test 2: Get My Posts
        console.log("\n[Test] Calling GET /posts/my-posts...");
        const myPostsRes = await axios.get(`${BASE_URL}/posts/my-posts`, { headers });
        if (Array.isArray(myPostsRes.data) && myPostsRes.data.length >= 1) {
            console.log("✅ Passed: My posts retrieved successfully and is an array mapped to the user.");
        } else {
            console.log("❌ Failed: My posts retrieval failed or didn't return an array.");
            process.exit(1);
        }

        // Test 3: Delete Post (Soft delete)
        console.log(`\n[Test] Calling DELETE /posts/${testPostId}...`);
        const delRes = await axios.delete(`${BASE_URL}/posts/${testPostId}`, { headers });
        if (delRes.data.post && delRes.data.post.postStatus === "hidden") {
            console.log("✅ Passed: Post soft deleted and status set to 'hidden'.");
        } else {
            console.log("❌ Failed: Post soft deletion failed.");
            process.exit(1);
        }

        console.log("\n🎉 All Test 03: User Post Management passed.\n");

    } catch (error: any) {
        console.error("Test execution failed:", error.response?.data || error.message);
        process.exit(1);
    } finally {
        // Cleanup Phase
        console.log("Cleaning up Test 03 data...");
        if (testPostId) await db.delete(posts).where(eq(posts.postId, testPostId));
        if (testUserId) await db.delete(users).where(eq(users.userId, testUserId));
        if (testCategoryId) await db.delete(categories).where(eq(categories.categoryId, testCategoryId));
        console.log("Cleanup complete.");
        process.exit(0);
    }
}

runUserPostTests();
