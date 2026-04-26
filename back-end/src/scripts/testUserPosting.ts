import { db } from "../config/db";
import { users, categories, posts, shops } from "../models/schema/index";
import { eq } from "drizzle-orm";
import { slugify } from "../utils/slugify";

async function testUserPosting() {
    console.log("--- Starting User Posting Integration Test ---");

    try {
        // 1. Setup: User and Category
        const [user] = await db.insert(users).values({
            userMobile: "0888777666",
            userDisplayName: "Người Bán Z",
        }).returning();

        const [cat] = await db.insert(categories).values({
            categoryTitle: "Bonsai Cấp Cao",
            categorySlug: slugify("Bonsai Cấp Cao"),
        }).returning();

        console.log("1. Setup done. User ID:", user.userId);

        // 2. User creates a post (WITHOUT shop first)
        console.log("\n2. User Creating Post (Individual)...");
        const title1 = "Cây Tùng La Hán Cá Nhân";
        const [post1] = await db.insert(posts).values({
            postAuthorId: user.userId,
            categoryId: cat.categoryId,
            postTitle: title1,
            postSlug: `${slugify(title1)}-${Date.now()}`,
            postStatus: "pending"
        }).returning();
        console.log("Post 1 Created. ID:", post1.postId, "Shop ID:", post1.postShopId);

        // 3. User registers and Admin verifies a shop
        console.log("\n3. User Registers Shop and Admin Verifies...");
        const [shop] = await db.insert(shops).values({
            shopId: user.userId,
            shopName: "Vườn Tùng Hữu Nghĩa",
            shopStatus: "active" // Skip interactive step for test
        }).returning();

        // 4. User creates another post (WITH shop now)
        console.log("\n4. User Creating Post (as Shop Owner)...");
        const title2 = "Cây Si Nghệ Thuật - Vườn Tùng";
        const [post2] = await db.insert(posts).values({
            postAuthorId: user.userId,
            postShopId: shop.shopId,
            categoryId: cat.categoryId,
            postTitle: title2,
            postSlug: `${slugify(title2)}-${Date.now()}`,
            postStatus: "pending"
        }).returning();
        console.log("Post 2 Created. ID:", post2.postId, "Shop ID:", post2.postShopId);

        // 5. Cleanup
        console.log("\n5. Cleanup...");
        await db.delete(users).where(eq(users.userId, user.userId));
        await db.delete(categories).where(eq(categories.categoryId, cat.categoryId));
        console.log("Done.");

    } catch (error) {
        console.error("Test failed:", error);
    }
}

testUserPosting();
