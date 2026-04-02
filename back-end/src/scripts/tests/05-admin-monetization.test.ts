import { db } from "../../config/db";
import { admins, placementSlots, promotionPackages } from "../../models/schema/index";
import { eq } from "drizzle-orm";
import axios from "axios";
import jwt from "jsonwebtoken";
import "dotenv/config";

const BASE_URL = "http://localhost:5000/api";
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

async function runAdminMonetizationTests() {
    console.log("--- Starting Test 05: Admin Monetization (Ad Slots & Packages) ---");
    let testSlotId: number = 0;
    let testPackageId: number = 0;

    try {
        // Setup: Admin token
        const [admin] = await db.select().from(admins).limit(1);
        if (!admin) {
            console.error("❌ No admin found in DB.");
            process.exit(1);
        }
        const adminToken = jwt.sign({ id: admin.adminId, role: "admin" }, JWT_SECRET, { expiresIn: "1h" });
        const adminHeaders = { Authorization: `Bearer ${adminToken}` };

        // 1. Create Placement Slot
        console.log("\n[Test] Calling POST /admin/placement-slots...");
        const slotRes = await axios.post(`${BASE_URL}/admin/placement-slots`, {
            placementSlotCode: `TEST_SLOT_${Date.now()}`,
            placementSlotTitle: "Test Ad Zone",
            placementSlotCapacity: 3,
            placementSlotPublished: true
        }, { headers: adminHeaders });
        testSlotId = slotRes.data.placementSlotId;
        console.log(`✅ Passed: Slot created (ID: ${testSlotId})`);

        // 2. Create Promotion Package
        console.log("\n[Test] Calling POST /admin/promotion-packages...");
        const pkgRes = await axios.post(`${BASE_URL}/admin/promotion-packages`, {
            promotionPackageSlotId: testSlotId,
            promotionPackageTitle: "Test Package 7d",
            promotionPackageDurationDays: 7,
            promotionPackagePrice: "50000.00",
            promotionPackagePublished: true
        }, { headers: adminHeaders });
        testPackageId = pkgRes.data.promotionPackageId;
        console.log(`✅ Passed: Package created (ID: ${testPackageId})`);

        // 3. Update Package
        console.log(`\n[Test] Calling PUT /admin/promotion-packages/${testPackageId}...`);
        const updatePkgRes = await axios.put(`${BASE_URL}/admin/promotion-packages/${testPackageId}`, {
            promotionPackagePrice: "60000.00"
        }, { headers: adminHeaders });
        if (updatePkgRes.data.promotionPackagePrice === "60000.00") {
            console.log("✅ Passed: Package price updated.");
        } else {
            console.log("❌ Failed: Package price update mismatched.");
            process.exit(1);
        }

        // 4. Constraint Check: Delete Slot with active packages should fail
        console.log("\n[Test] Calling DELETE /admin/placement-slots with linked packages...");
        try {
            await axios.delete(`${BASE_URL}/admin/placement-slots/${testSlotId}`, { headers: adminHeaders });
            console.log("❌ Failed: Slot deletion should have failed due to active packages.");
            process.exit(1);
        } catch (err: any) {
            if (err.response?.status === 400) {
                console.log(`✅ Passed: Slot deletion correctly blocked (${err.response.data.error})`);
            } else {
                console.log("❌ Failed: Unexpected response status:", err.response?.status);
                process.exit(1);
            }
        }

        console.log("\n🎉 All Test 05: Admin Monetization passed.\n");

    } catch (error: any) {
        console.error("Test execution failed:", error.response?.data || error.message);
        process.exit(1);
    } finally {
        console.log("Cleaning up Test 05...");
        if (testPackageId) await db.delete(promotionPackages).where(eq(promotionPackages.promotionPackageId, testPackageId));
        if (testSlotId) await db.delete(placementSlots).where(eq(placementSlots.placementSlotId, testSlotId));
        console.log("Cleanup complete.");
        process.exit(0);
    }
}

runAdminMonetizationTests();
