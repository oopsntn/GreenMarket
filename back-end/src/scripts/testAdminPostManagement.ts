import { db } from "../config/db.ts";
import { admins, categories, posts, eventLogs } from "../models/schema/index.ts";
import { eq, desc } from "drizzle-orm";
import { slugify } from "../utils/slugify.ts";
import axios from "axios";

const BASE_URL = "http://localhost:5000/api/admin/posts";

async function testAdminPostManagement() {
    console.log("--- Starting Admin Post Management Test ---");

    try {
        // 1. Setup: Admin, Category, and Post
        const [admin] = await db.insert(admins).values({
            adminEmail: `admin${Date.now()}@test.com`,
            adminPasswordHash: "hashed",
        }).returning();

        const [cat] = await db.insert(categories).values({
            categoryTitle: "Bonsai Admin Test",
            categorySlug: slugify(`Bonsai Admin Test ${Date.now()}`),
        }).returning();

        const [post] = await db.insert(posts).values({
            postAuthorId: 1, // Dummy user ID assuming one exists, won't trigger FK error if checking disabled or default user exists, but let's be safe. Wait, this DB has seed data.
            categoryId: cat.categoryId,
            postTitle: "Cây test admin soft delete",
            postSlug: `${slugify("Cây test admin soft delete")}-${Date.now()}`,
            postStatus: "approved"
        }).returning();

        console.log("1. Setup done. Admin ID:", admin.adminId, "Post ID:", post.postId);

        // 2. Test Soft Delete API
        console.log("\n2. Testing Admin Soft Delete API...");
        const delRes = await axios.delete(`${BASE_URL}/${post.postId}`, {
            data: { adminId: admin.adminId, reason: "Test admin soft delete reason" }
        });
        console.log("   Delete response status:", delRes.status);
        if (delRes.data.deletedPost.postStatus === "hidden" && delRes.data.deletedPost.postDeletedAt) {
            console.log("   ✅ Post soft deleted successfully. Status is 'hidden'.");
        } else {
            console.log("   ❌ Soft delete failed.", delRes.data);
        }

        // 3. Verify Log creation
        console.log("\n3. Verifying event log...");
        const [logEntry] = await db.select().from(eventLogs)
            .where(eq(eventLogs.eventLogTargetId, post.postId))
            .orderBy(desc(eventLogs.eventLogEventTime))
            .limit(1);

        if (logEntry && logEntry.eventLogTargetType === "post" && logEntry.eventLogUserId === admin.adminId) {
            console.log("   ✅ Event log successfully recorded.");
        } else {
            console.log("   ❌ Event log not recorded correctly.", logEntry);
        }

        // 4. Cleanup
        console.log("\n4. Cleanup...");
        await db.delete(eventLogs).where(eq(eventLogs.eventLogTargetId, post.postId));
        await db.delete(posts).where(eq(posts.postId, post.postId));
        await db.delete(categories).where(eq(categories.categoryId, cat.categoryId));
        await db.delete(admins).where(eq(admins.adminId, admin.adminId));
        console.log("Done.");

    } catch (error: any) {
        console.error("Test failed:", error.response?.data || error.message);
    }
}

testAdminPostManagement();
