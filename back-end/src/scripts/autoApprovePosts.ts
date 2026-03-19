import { db } from "../config/db.ts";
import { posts } from "../models/schema/index.ts";
import { eq, and } from "drizzle-orm";

async function autoApprove() {
    console.log("🔍 Finding pending posts...");

    const pendingPosts = await db.select().from(posts).where(eq(posts.postStatus, "pending"));

    if (pendingPosts.length === 0) {
        console.log("✨ No pending posts found.");
        process.exit(0);
    }

    console.log(`🚀 Approving ${pendingPosts.length} posts...`);

    await db.update(posts)
        .set({ 
            postStatus: "approved",
            postModeratedAt: new Date()
        })
        .where(eq(posts.postStatus, "pending"));

    console.log("✅ All pending posts have been approved!");
    process.exit(0);
}

autoApprove().catch(err => {
    console.error("❌ Auto-approval failed:", err);
    process.exit(1);
});
