import { db } from "../config/db";
import { postPromotions } from "../models/schema/post-promotions";
import { lte, and, eq } from "drizzle-orm";

// Interval in milliseconds (e.g. 15 minutes = 15 * 60 * 1000)
const CHECK_INTERVAL = 15 * 60 * 1000;

const checkExpiredPromotions = async () => {
    try {
        const now = new Date();

        const result = await db.update(postPromotions)
            .set({ postPromotionStatus: "expired" })
            .where(
                and(
                    eq(postPromotions.postPromotionStatus, "active"),
                    lte(postPromotions.postPromotionEndAt, now)
                )
            )
            .returning({ id: postPromotions.postPromotionId });
        
        if (result.length > 0) {
            console.log(`[Scheduler] Expired ${result.length} old promotions.`);
        }
    } catch (error) {
        console.error("[Scheduler] Error expiring promotions:", error);
    }
};

// Start the interval
const startPromotionScheduler = () => {
    console.log("[Scheduler] Promotion expiration scheduler started.");
    
    // Run immediately once
    checkExpiredPromotions();

    // Loop
    setInterval(checkExpiredPromotions, CHECK_INTERVAL);
};

// Auto-start since we import this file globally in server.ts
startPromotionScheduler();
