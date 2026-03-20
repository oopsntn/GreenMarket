import { db } from "../config/db.ts";
import { users, shops, posts, categories } from "../models/schema/index.ts";
import { eq } from "drizzle-orm";
import { slugify } from "../utils/slugify.ts";

async function testPublicShopDetail() {
    console.log("--- Starting Public Shop Detail Integration Test ---");

    try {
        // 1. Setup: Create Owner, Category, Shop, and Posts
        console.log("1. Setting up test data...");
        const [user] = await db.insert(users).values({
            userMobile: "0999888777",
            userDisplayName: "Test Shop Owner",
        }).returning();

        const [cat] = await db.insert(categories).values({
            categoryTitle: "Cây Cảnh Test",
            categorySlug: slugify("Cây Cảnh Test"),
        }).returning();

        const [shop] = await db.insert(shops).values({
            shopOwnerId: user.userId,
            shopName: "Vườn Bonsai Test",
            shopStatus: "active",
            shopLocation: "Hà Nội",
            shopPhone: "0999888777",
            shopDescription: "Mô tả vườn cây test"
        }).returning();

        // Create 2 approved posts and 1 pending post
        await db.insert(posts).values({
            postAuthorId: user.userId,
            postShopId: shop.shopId,
            categoryId: cat.categoryId,
            postTitle: "Cây Sanh Nam Điền Approved 1",
            postSlug: slugify("Cây Sanh Nam Điền Approved 1") + "-" + Date.now(),
            postStatus: "approved",
            postPrice: "1000000"
        });

        await db.insert(posts).values({
            postAuthorId: user.userId,
            postShopId: shop.shopId,
            categoryId: cat.categoryId,
            postTitle: "Cây Si Cổ Thụ Approved 2",
            postSlug: slugify("Cây Si Cổ Thụ Approved 2") + "-" + (Date.now() + 1),
            postStatus: "approved",
            postPrice: "2000000"
        });

        await db.insert(posts).values({
            postAuthorId: user.userId,
            postShopId: shop.shopId,
            categoryId: cat.categoryId,
            postTitle: "Cây Đa Pending",
            postSlug: slugify("Cây Đa Pending") + "-" + (Date.now() + 2),
            postStatus: "pending",
            postPrice: "500000"
        });

        console.log(`Setup complete. Shop ID: ${shop.shopId}`);

        // 2. Simulate API Call (internal logic check)
        console.log("\n2. Verifying public shop data...");
        const [fetchedShop] = await db.select().from(shops).where(eq(shops.shopId, shop.shopId)).limit(1);
        const shopPosts = await db.select()
            .from(posts)
            .where(eq(posts.postShopId, shop.shopId));
        
        const approvedPosts = shopPosts.filter(p => p.postStatus === 'approved');

        console.log(`Shop Name: ${fetchedShop.shopName}`);
        console.log(`Total Posts in DB for this shop: ${shopPosts.length}`);
        console.log(`Approved Posts: ${approvedPosts.length}`);

        if (fetchedShop.shopName === "Vườn Bonsai Test" && approvedPosts.length === 2) {
            console.log("✅ SUCCESS: Found shop and exactly 2 approved posts.");
        } else {
            throw new Error(`❌ FAILED: Expected 2 approved posts, found ${approvedPosts.length}`);
        }

        // 3. Cleanup
        console.log("\n3. Cleaning up test data...");
        await db.delete(users).where(eq(users.userId, user.userId));
        await db.delete(categories).where(eq(categories.categoryId, cat.categoryId));
        console.log("✅ Cleanup done.");

        console.log("\n--- TEST PASSED SUCCESSFULLY ---");

    } catch (error) {
        console.error("\n❌ TEST FAILED:", error);
    }
}

testPublicShopDetail();
