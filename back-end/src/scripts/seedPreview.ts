import { db } from "../config/db.ts";
import { users, categories, posts, shops, postImages } from "../models/schema/index.ts";
import { slugify } from "../utils/slugify.ts";

async function seedMarketplace() {
    console.log("--- Seeding Marketplace for Frontend Preview ---");

    try {
        // 1. Create a Premium Seller
        const [user] = await db.insert(users).values({
            userMobile: "0123456789",
            userDisplayName: "Nghệ Nhân Bonsai",
        }).returning();

        const [shop] = await db.insert(shops).values({
            shopId: user.userId,
            shopName: "Vườn Tùng Bách Diệp",
            shopLocation: "Nam Định",
            shopDescription: "Chuyên các dòng Tùng La Hán và Thông Đen cao cấp.",
            shopStatus: "active"
        }).returning();

        // 2. Create Categories
        const [cat1] = await db.insert(categories).values({
            categoryTitle: "Tùng La Hán",
            categorySlug: slugify("Tùng La Hán"),
        }).returning();

        const [cat2] = await db.insert(categories).values({
            categoryTitle: "Sanh Nam Điền",
            categorySlug: slugify("Sanh Nam Điền"),
        }).returning();

        // 3. Create Approved Posts
        const title1 = "Siêu phẩm Tùng La Hán Dáng Văn Nhân";
        const [post1] = await db.insert(posts).values({
            postAuthorId: user.userId,
            postShopId: shop.shopId,
            categoryId: cat1.categoryId,
            postTitle: title1,
            postSlug: `${slugify(title1)}`,
            postContent: "Cây tùng la hán dáng văn nhân cực kỳ thanh thoát. Hàng kỹ, đã hoàn thiện chi dăm. Thích hợp trưng bày phòng khách hoặc sân vườn nhỏ.",
            postPrice: "15000000",
            postLocation: "Nam Định",
            postStatus: "approved"
        }).returning();

        const title2 = "Sanh Nam Điền Dáng Làng Cổ Thụ";
        const [post2] = await db.insert(posts).values({
            postAuthorId: user.userId,
            postShopId: shop.shopId,
            categoryId: cat2.categoryId,
            postTitle: title2,
            postSlug: `${slugify(title2)}`,
            postContent: "Sanh Nam Điền cổ thụ, gốc bệ vững chãi như bàn thạch. Tay cành phân bố hài hòa, mang đậm hơi thở thời gian.",
            postPrice: "45000000",
            postLocation: "Nam Định",
            postStatus: "approved"
        }).returning();

        console.log("Seed complete! 2 Approved posts created.");

    } catch (error) {
        console.error("Seed failed:", error);
    }
}

seedMarketplace();
