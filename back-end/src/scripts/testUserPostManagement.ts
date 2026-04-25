import { db } from "../config/db";
import { users, categories, posts } from "../models/schema/index";
import { eq } from "drizzle-orm";
import { slugify } from "../utils/slugify";
import axios from "axios";

const BASE_URL = "http://localhost:5000/api/posts";

async function testUserPostManagement() {
    console.log("--- Starting User Post Management Test ---");

    try {
        // 1. Setup: User and Category
        const mobileNumber = `0${Math.floor(Math.random() * 900000000) + 100000000}`; // Generate a random 10-digit number starting with 0
        const [user] = await db.insert(users).values({
            userMobile: mobileNumber,
            userDisplayName: "Test Soft Delete User",
        }).returning();

        const [cat] = await db.insert(categories).values({
            categoryTitle: "Bonsai Test",
            categorySlug: slugify("Bonsai Test"),
        }).returning();

        console.log("1. Setup done. User ID:", user.userId);

        // 2. Create Post directly via DB for testing
        const [post] = await db.insert(posts).values({
            postAuthorId: user.userId,
            categoryId: cat.categoryId,
            postTitle: "Cây test soft delete",
            postSlug: `${slugify("Cây test soft delete")}-${Date.now()}`,
            postStatus: "approved"
        }).returning();
        
        console.log("2. Post created natively. ID:", post.postId);

        // 3. Edit the post via API
        console.log("\n3. Testing Edit Post API...");
        const editRes = await axios.patch(`${BASE_URL}/${post.postId}`, {
            userId: user.userId,
            postTitle: "Cây test soft delete (Edited)",
            postPrice: "100000"
        });
        console.log("   Edit response status:", editRes.status);
        if (editRes.data.postTitle === "Cây test soft delete (Edited)" && editRes.data.postStatus === "pending") {
            console.log("   ✅ Post edited successfully and status reverted to 'pending'.");
        } else {
            console.log("   ❌ Edit failed or status not updated correctly.", editRes.data);
        }

        // 4. Soft Delete the post via API
        console.log("\n4. Testing Soft Delete API...");
        const delRes = await axios.delete(`${BASE_URL}/${post.postId}`, {
            data: { userId: user.userId } // axios delete sends body via `data`
        });
        console.log("   Delete response status:", delRes.status);
        if (delRes.data.post.postStatus === "hidden" && delRes.data.post.postDeletedAt) {
            console.log("   ✅ Post soft deleted successfully. Status is 'hidden'.");
        } else {
            console.log("   ❌ Soft delete failed.", delRes.data);
        }

        // 5. Verify the post is hidden from the user's active list
        console.log("\n5. Verifying user's post list excludes hidden posts...");
        const listRes = await axios.get(`${BASE_URL}/my-posts?userId=${user.userId}`);
        const activePosts = listRes.data;
        if (activePosts.length === 0) {
            console.log("   ✅ User's active post list is empty (hidden post excluded).");
        } else {
            console.log(`   ❌ Found ${activePosts.length} posts, expected 0.`);
        }

        // 6. Cleanup
        console.log("\n6. Cleanup...");
        await db.delete(users).where(eq(users.userId, user.userId));
        await db.delete(categories).where(eq(categories.categoryId, cat.categoryId));
        console.log("Done.");

    } catch (error: any) {
        console.error("Test failed:", error.response?.data || error.message);
    }
}

testUserPostManagement();
