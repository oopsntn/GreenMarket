import { db } from "../config/db";
import { shops, posts } from "../models/schema";
import { eq } from "drizzle-orm";

async function autoApproveShops() {
    console.log("🚀 Starting auto-approval for all pending shops...");
    
    try {
        const result = await db.update(shops)
            .set({ 
                shopStatus: "active",
                shopUpdatedAt: new Date()
            })
            .where(eq(shops.shopStatus, "pending"))
            .returning();
            
        console.log(`✅ Success! Approved ${result.length} shops.`);
        
        for (const shop of result) {
            const { rowCount } = await db.update(posts)
                .set({ postShopId: shop.shopId, postUpdatedAt: new Date() })
                .where(eq(posts.postAuthorId, shop.shopId));
            
            console.log(`   - [ID: ${shop.shopId}] ${shop.shopName} (${rowCount ?? 0} posts reassigned)`);
        }
        
        process.exit(0);
    } catch (error) {
        console.error("❌ Error approving shops:", error);
        process.exit(1);
    }
}

autoApproveShops();
