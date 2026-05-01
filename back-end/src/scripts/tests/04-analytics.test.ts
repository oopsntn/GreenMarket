import axios from "axios";
import { db } from "../../config/db";
import { users, categories, posts } from "../../models/schema/index";
import { eq } from "drizzle-orm";
import { slugify } from "../../utils/slugify";
import "dotenv/config";

const BASE_URL = "http://localhost:5000/api";

async function runAnalyticsTests() {
    console.log("--- Starting Test 04: Analytics & Tracking ---");
    let testUserId: number = 0;
    let testCategoryId: number = 0;
    let testPostId: number = 0;
    let testPostSlug: string = "";

    try {
        // 1. Setup minimal data
        const mobileNumber = `099${Math.floor(Math.random() * 9000000) + 1000000}`;
        const [user] = await db.insert(users).values({
            userMobile: mobileNumber,
            userDisplayName: "Analytics Tester",
            userStatus: "active"
        }).returning();
        testUserId = user.userId;

        const [cat] = await db.insert(categories).values({
            categoryTitle: "Analytics Cat",
            categorySlug: slugify("Analytics Cat") + Date.now(),
        }).returning();
        testCategoryId = cat.categoryId;

        testPostSlug = "analytics-test-post-" + Date.now();
        const [post] = await db.insert(posts).values({
            postAuthorId: testUserId,
            categoryId: testCategoryId,
            postTitle: "Analytics Test Post",

            postLocation: "Hanoi",
            postStatus: "approved",
            postSlug: testPostSlug
        }).returning();
        testPostId = post.postId;

        console.log(`✅ Setup complete. PostId: ${testPostId}, Slug: ${testPostSlug}`);

        // 2. Test View Tracking
        console.log("\n[Test] Checking View count increment...");
        const res1 = await axios.get(`${BASE_URL}/posts/detail/${testPostSlug}`);
        const view1 = res1.data.postViewCount;
        
        if (view1 !== undefined) {
             console.log(`✅ Passed: Initial view count is ${view1}`);
        } else {
             console.log("❌ Failed: Could not get view count from response");
             process.exit(1);
        }

        // Test 2b: Caching (should NOT increment on second call from same Axios session/implied IP)
        console.log("[Test] Checking View count cache (spam prevention)...");
        const res2 = await axios.get(`${BASE_URL}/posts/detail/${testPostSlug}`);
        const view2 = res2.data.postViewCount;
        
        if (view1 === view2) {
             console.log("✅ Passed: View count did not increment (Cache working)");
        } else {
             console.log(`❌ Failed: View count incremented from ${view1} to ${view2}. Cache might be broken.`);
             process.exit(1);
        }

        // 3. Test Contact Click
        console.log("\n[Test] Checking Contact Click tracking...");
        const contactRes = await axios.post(`${BASE_URL}/posts/${testPostId}/contact-click`, {});
        
        if (contactRes.data.success) {
            console.log("✅ Passed: Contact click API success response.");
            
            // Verify in DB
            const [updatedPost] = await db.select().from(posts).where(eq(posts.postId, testPostId));
            if (updatedPost.postContactCount === 1) {
                console.log("✅ Passed: Database verified postContactCount = 1");
            } else {
                console.log(`❌ Failed: Database value is ${updatedPost.postContactCount}, expected 1`);
                process.exit(1);
            }
        } else {
            console.log("❌ Failed: Contact click API failed.");
            process.exit(1);
        }

        console.log("\n🎉 All Test 04: Analytics & Tracking passed.\n");

    } catch (error: any) {
        console.error("Test execution failed:", error.response?.data || error.message);
        process.exit(1);
    } finally {
        console.log("Cleaning up Test 04 data...");
        if (testPostId) await db.delete(posts).where(eq(posts.postId, testPostId));
        if (testUserId) await db.delete(users).where(eq(users.userId, testUserId));
        if (testCategoryId) await db.delete(categories).where(eq(categories.categoryId, testCategoryId));
        console.log("Cleanup complete.");
        process.exit(0);
    }
}

runAnalyticsTests();
