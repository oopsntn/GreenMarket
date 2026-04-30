import axios from "axios";
import { db } from "../../config/db";
import { users, categories, posts, userFavorites } from "../../models/schema/index";
import { eq, and } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { slugify } from "../../utils/slugify";
import "dotenv/config";

const BASE_URL = "http://localhost:5000/api";
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

async function runSavedPostsTests() {
    console.log("--- Starting Test 07: Saved Posts / Bookmarks ---");
    let testUserId: number | undefined;
    let testCategoryId: number | undefined;
    let testPostId: number | undefined;

    try {
        // Setup User & Category
        const mobileNumber = `098${Math.floor(Math.random() * 9000000) + 1000000}`;
        const [user] = await db.insert(users).values({
            userMobile: mobileNumber,
            userDisplayName: "Bookmark Tester",
            userStatus: "active"
        }).returning();
        testUserId = user.userId;

        const [cat] = await db.insert(categories).values({
            categoryTitle: "Test Categorie Bookmark",
            categorySlug: slugify("Test Categorie Bookmark") + Date.now(),
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

        // Setup Post
        const [post] = await db.insert(posts).values({
            postAuthorId: testUserId,
            categoryId: testCategoryId,
            postTitle: "Awesome Test Post For Bookmarks",

            postLocation: "Hanoi",
            postSlug: slugify("Awesome Test Post For Bookmarks") + Date.now(),
            postStatus: "approved"
        }).returning();
        testPostId = post.postId;
        console.log(`✅ Test Setup: Post created (ID: ${testPostId})`);

        // Test 1: Check initial save state (should be false)
        console.log(`\n[Test] Calling GET /posts/${testPostId}/favorite...`);
        const initialStatusRes = await axios.get(`${BASE_URL}/posts/${testPostId}/favorite`, { headers });
        if (initialStatusRes.data.isSaved === false) {
            console.log("✅ Passed: Initial check confirms post is not saved.");
        } else {
            console.log("❌ Failed: Post should not be saved yet.");
            process.exit(1);
        }

        // Test 2: Toggle save (bookmark it)
        console.log(`\n[Test] Calling POST /posts/${testPostId}/favorite...`);
        const toggleSavedRes = await axios.post(`${BASE_URL}/posts/${testPostId}/favorite`, {}, { headers });
        if (toggleSavedRes.data.isSaved === true && toggleSavedRes.data.message.includes("added to favorites")) {
            console.log("✅ Passed: Post was bookmarked successfully.");
        } else {
            console.log("❌ Failed: Toggling save to true failed.", toggleSavedRes.data);
            process.exit(1);
        }

        // Test 3: Get profile favorites list
        console.log(`\n[Test] Calling GET /profile/favorites...`);
        const listFavsRes = await axios.get(`${BASE_URL}/profile/favorites`, { headers });
        
        const favsArray = listFavsRes.data.posts || listFavsRes.data;
        if (Array.isArray(favsArray) && favsArray.length > 0 && favsArray.some((p: any) => p.postId === testPostId)) {
            console.log("✅ Passed: Profile favorites list correctly includes the newly saved post.");
        } else {
            console.log("❌ Failed: Profile favorites list did not contain the saved post.", listFavsRes.data);
            process.exit(1);
        }

        // Test 4: Toggle save (unbookmark it)
        console.log(`\n[Test] Calling POST /posts/${testPostId}/favorite (second time)...`);
        const toggleUnsavedRes = await axios.post(`${BASE_URL}/posts/${testPostId}/favorite`, {}, { headers });
        if (toggleUnsavedRes.data.isSaved === false && toggleUnsavedRes.data.message.includes("removed from favorites")) {
            console.log("✅ Passed: Post was unbookmarked successfully.");
        } else {
            console.log("❌ Failed: Toggling save to false failed.", toggleUnsavedRes.data);
            process.exit(1);
        }

        console.log("\n🎉 All Test 07: Saved Posts / Bookmarks passed.\n");

    } catch (error: any) {
        console.error("Test execution failed:", error.response?.data || error.message);
        process.exit(1);
    } finally {
        // Cleanup Phase
        console.log("Cleaning up Test 07 data...");
        if (testUserId && testPostId) {
             await db.delete(userFavorites).where(
                 and(
                    eq(userFavorites.userId, testUserId),
                    eq(userFavorites.targetId, testPostId),
                    eq(userFavorites.targetType, "post")
                 )
             );
        }
        if (testPostId) await db.delete(posts).where(eq(posts.postId, testPostId));
        if (testUserId) await db.delete(users).where(eq(users.userId, testUserId));
        if (testCategoryId) await db.delete(categories).where(eq(categories.categoryId, testCategoryId));
        console.log("Cleanup complete.");
        process.exit(0);
    }
}

runSavedPostsTests();
