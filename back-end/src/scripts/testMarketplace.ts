import { db } from "../config/db";
import { users, shops, posts, mediaAssets, postAttributeValues, categories, attributes } from "../models/schema/index";
import { eq } from "drizzle-orm";
import { slugify } from "../utils/slugify";

async function testMarketplace() {
    console.log("--- Starting Marketplace Integration Test ---");

    try {
        // 1. Create a Seller (User)
        console.log("\n1. Creating Seller...");
        const [seller] = await db.insert(users).values({
            userMobile: "0987654321",
            userDisplayName: "Nhà Vườn Tùng Lộc",
        }).returning();
        console.log("Created Seller ID:", seller.userId);

        // 2. Create a Shop
        console.log("\n2. Creating Shop...");
        const [nursery] = await db.insert(shops).values({
            shopId: seller.userId,
            shopName: "Bonsai Tùng Lộc Hải Dương",
            shopLocation: "Hải Dương, Việt Nam",
            shopPhone: "0987654321",
        }).returning();
        console.log("Created Shop ID:", nursery.shopId);

        // 3. Create a Category & Attribute
        const [cat] = await db.insert(categories).values({
            categoryTitle: "Bonsai Thông Tùng",
            categorySlug: "bonsai-thong-tung",
        }).returning();
        const [attr] = await db.insert(attributes).values({
            attributeCode: "AGE",
            attributeTitle: "Tuổi cây",
            attributeDataType: "text",
        }).returning();

        // 4. Seller creates a Post
        console.log("\n4. Creating Post (Listing)...");
        const postData = {
            postAuthorId: seller.userId,
            postShopId: nursery.shopId,
            categoryId: cat.categoryId,
            postTitle: "Tùng La Hán Dáng Văn Nhân 50 Năm",
            postPrice: "150000000", // 150tr
            postStatus: "pending", // Default
        };
        const finalSlug = slugify(postData.postTitle);
        const [post] = await db.insert(posts).values({
            ...postData,
            postSlug: finalSlug,
        }).returning();
        console.log("Created Post ID:", post.postId, "Status:", post.postStatus);

        // Add dummy image
        await db.insert(mediaAssets).values({
            targetType: "post",
            targetId: post.postId,
            mediaType: "image",
            url: "https://example.com/tung.jpg",
        });

        // Add attribute value
        await db.insert(postAttributeValues).values({
            postId: post.postId,
            attributeId: attr.attributeId,
            attributeValue: "50 năm",
        });

        // 5. Admin Moderation (Approve)
        console.log("\n5. Admin Approving Post...");
        const [approvedPost] = await db.update(posts)
            .set({ 
                postStatus: "approved", 
                postModeratedAt: new Date() 
            })
            .where(eq(posts.postId, post.postId))
            .returning();
        console.log("Post Status Updated to:", approvedPost.postStatus);

        // 6. Cleanup
        console.log("\n6. Cleanup...");
        await db.delete(users).where(eq(users.userId, seller.userId));
        await db.delete(categories).where(eq(categories.categoryId, cat.categoryId));
        await db.delete(attributes).where(eq(attributes.attributeId, attr.attributeId));
        console.log("Done.");

    } catch (error) {
        console.error("Test failed:", error);
    }
}

testMarketplace();
