import { db } from "../config/db";
import { postPromotions } from "../models/schema/post-promotions";
import { lte, and, eq } from "drizzle-orm";

// Interval in milliseconds (e.g. 15 minutes = 15 * 60 * 1000)
const CHECK_INTERVAL = 15 * 60 * 1000;

const syncPromotionLifecycle = async () => {
    try {
        const now = new Date();

        const activatedPromotions = await db.update(postPromotions)
            .set({ postPromotionStatus: "active" })
            .where(
                and(
                    eq(postPromotions.postPromotionStatus, "scheduled"),
                    lte(postPromotions.postPromotionStartAt, now)
                )
            )
            .returning({ id: postPromotions.postPromotionId });

        if (activatedPromotions.length > 0) {
            console.log(`[Scheduler] Activated ${activatedPromotions.length} scheduled promotions.`);
        }

        const expiredPromotions = await db.update(postPromotions)
            .set({ postPromotionStatus: "expired" })
            .where(
                and(
                    eq(postPromotions.postPromotionStatus, "active"),
                    lte(postPromotions.postPromotionEndAt, now)
                )
            )
            .returning({ id: postPromotions.postPromotionId });
        
        if (expiredPromotions.length > 0) {
            console.log(`[Scheduler] Expired ${expiredPromotions.length} old promotions.`);
        }
    } catch (error) {
        console.error("[Scheduler] Error syncing promotion lifecycle:", error);
    }
};

// Start the interval
const startPromotionScheduler = () => {
    console.log("[Scheduler] Promotion expiration scheduler started.");
    
    // Run immediately once
    syncPromotionLifecycle();

    // Loop
    setInterval(syncPromotionLifecycle, CHECK_INTERVAL);
};

// Auto-start since we import this file globally in server.ts
startPromotionScheduler();
