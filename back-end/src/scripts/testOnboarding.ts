import { db } from "../config/db.ts";
import { users, shops } from "../models/schema/index.ts";
import { eq } from "drizzle-orm";

async function testOnboarding() {
    console.log("--- Starting Seller Onboarding Integration Test ---");

    try {
        // 1. Setup: Create a Test User
        const [user] = await db.insert(users).values({
            userMobile: "0999888777",
            userDisplayName: "Người Dùng Thử Nghiệm",
        }).returning();
        console.log("1. Created Test User ID:", user.userId);

        // 2. User registers a shop
        console.log("\n2. User Registering Shop...");
        const [newShop] = await db.insert(shops).values({
            shopOwnerId: user.userId,
            shopName: "Vườn Bonsai Hữu Tình",
            shopLocation: "Hà Nội",
            shopDescription: "Chuyên cây cảnh nghệ thuật.",
            // status defaults to 'pending' from schema
        }).returning();
        console.log("Shop Created with ID:", newShop.shopId, "Status:", newShop.shopStatus);

        // 3. Admin verifies the shop
        console.log("\n3. Admin Verifying Shop...");
        const [verifiedShop] = await db.update(shops)
            .set({ 
                shopStatus: "active",
                shopUpdatedAt: new Date()
            })
            .where(eq(shops.shopId, newShop.shopId))
            .returning();
        console.log("Shop Status Updated to:", verifiedShop.shopStatus);

        // 4. Cleanup
        console.log("\n4. Cleanup...");
        await db.delete(users).where(eq(users.userId, user.userId));
        console.log("Done.");

    } catch (error) {
        console.error("Test failed:", error);
    }
}

testOnboarding();
