import { db } from "../config/db.ts";
import { users, posts, categories, reports } from "../models/schema/index.ts";
import { eq } from "drizzle-orm";
import { slugify } from "../utils/slugify.ts";

async function testReports() {
    console.log("--- Starting Reports Integration Test ---");

    try {
        // 1. Setup: Create User, Category, and Post
        const [seller] = await db.insert(users).values({
            userMobile: "0111222333",
            userDisplayName: "Người Bán Test",
        }).returning();

        const [cat] = await db.insert(categories).values({
            categoryTitle: "Cây Cảnh Test",
            categorySlug: "cay-canh-test",
        }).returning();

        const postTitle = "Bài Đăng Vi Phạm Test";
        const [post] = await db.insert(posts).values({
            postAuthorId: seller.userId,
            categoryId: cat.categoryId,
            postTitle,
            postSlug: slugify(postTitle),
            postStatus: "approved",
        }).returning();

        console.log("Setup complete. Created Post ID:", post.postId);

        // 2. Create a Report
        console.log("\n2. Creating Violation Report...");
        const [newReport] = await db.insert(reports).values({
            postId: post.postId,
            reportReason: "Lừa đảo, hình ảnh không đúng thực tế.",
        }).returning();
        console.log("Created Report ID:", newReport.reportId, "Status:", newReport.reportStatus);

        // 3. Admin Resolves Report
        console.log("\n3. Admin Resolving Report...");
        const [resolvedReport] = await db.update(reports)
            .set({ 
                reportStatus: "resolved", 
                adminNote: "Đã xác minh lừa đảo, tiến hành ẩn bài viết.",
                reportUpdatedAt: new Date() 
            })
            .where(eq(reports.reportId, newReport.reportId))
            .returning();
        console.log("Report Status Updated to:", resolvedReport.reportStatus);
        console.log("Admin Note:", resolvedReport.adminNote);

        // 4. Cleanup
        console.log("\n4. Cleanup...");
        await db.delete(users).where(eq(users.userId, seller.userId));
        await db.delete(categories).where(eq(categories.categoryId, cat.categoryId));
        console.log("Done.");

    } catch (error) {
        console.error("Test failed:", error);
    }
}

testReports();
