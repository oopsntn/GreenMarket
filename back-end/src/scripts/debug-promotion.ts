import "dotenv/config";
import { db } from "../config/db";
import { sql } from "drizzle-orm";

async function checkPromotionTable() {
    try {
        console.log("--- Promotion Packages Table Audit ---");
        
        // 1. List all tables
        const tables: any = await db.execute(sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`);
        // if it's node-postgres, it might be in .rows
        const tableList = Array.isArray(tables) ? tables : (tables.rows || []);
        console.log("Existing Tables:", tableList.map((t: any) => t.tablename).join(", "));

        // 2. Check if promotion_packages exists in the list
        const exists = tableList.some((t: any) => t.tablename === 'promotion_packages');
        console.log("Found 'promotion_packages' in table list:", exists);

        if (exists) {
            // 3. Try to insert
            console.log("Attempting test insert...");
            const slotRes: any = await db.execute(sql`
                INSERT INTO placement_slots (placement_slot_code, placement_slot_title, placement_slot_published)
                VALUES ('TEMP_' || floor(random() * 1000000), 'Temp Slot', true)
                RETURNING *;
            `);
            const slotRows = Array.isArray(slotRes) ? slotRes : (slotRes.rows || []);
            const slotId = slotRows[0].placement_slot_id;
            console.log("Slot ID:", slotId);

            await db.execute(sql`
                INSERT INTO promotion_packages (
                    promotion_package_slot_id, 
                    promotion_package_title, 
                    promotion_package_duration_days, 
                    promotion_package_price, 
                    promotion_package_published
                ) VALUES (${slotId}, 'Test', 30, 50.00, true);
            `);
            console.log("✅ Insert test passed.");
        }

    } catch (err: any) {
        console.error("❌ AUDIT FAILED:");
        console.error("Message:", err.message);
        if (err.detail) console.error("Detail:", err.detail);
        if (err.where) console.error("Where (Check Trigger):", err.where);
    } finally {
        process.exit(0);
    }
}

checkPromotionTable();
