import { db } from "../config/db.ts";
import { admins, placementSlots, promotionPackages } from "../models/schema/index.ts";
import { eq } from "drizzle-orm";
import axios from "axios";
import jwt from "jsonwebtoken";

const BASE_URL = "http://localhost:5000/api";
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

async function runSprint3Tests() {
    console.log("--- Starting Sprint 3 API Tests (Placement Slots & Promotion Packages) ---\n");

    let testSlotId: number = 0;
    let testPackageId: number = 0;

    try {
        // == Setup: Get admin token ==
        const [admin] = await db.select().from(admins).limit(1);
        if (!admin) {
            console.error("❌ No admin found in DB. Run `npm run seed:admin` first.");
            process.exit(1);
        }

        const adminToken = jwt.sign(
            { id: admin.adminId, role: "admin" },
            JWT_SECRET,
            { expiresIn: "1h" }
        );
        const adminHeaders = { Authorization: `Bearer ${adminToken}` };
        console.log(`✅ Admin token created for adminId: ${admin.adminId}\n`);

        // ========================
        // PLACEMENT SLOTS CRUD
        // ========================
        console.log("=== Testing Placement Slots CRUD ===\n");

        // 1. Create Placement Slot
        console.log("1. Creating Placement Slot...");
        const createSlotRes = await axios.post(`${BASE_URL}/admin/placement-slots`, {
            placementSlotCode: "HOME_BANNER",
            placementSlotTitle: "Trang chủ - Banner nổi bật",
            placementSlotCapacity: 5,
            placementSlotRules: { maxDays: 30, position: "top" },
            placementSlotPublished: true,
        }, { headers: adminHeaders });

        testSlotId = createSlotRes.data.placementSlotId;
        console.log(`   ✅ Created slot -> ID: ${testSlotId}, Code: ${createSlotRes.data.placementSlotCode}`);

        // 2. Get All Slots
        console.log("2. Getting all placement slots...");
        const allSlotsRes = await axios.get(`${BASE_URL}/admin/placement-slots`, { headers: adminHeaders });
        const hasSlot = allSlotsRes.data.some((s: any) => s.placementSlotId === testSlotId);
        console.log(`   ✅ Found ${allSlotsRes.data.length} slot(s). Test slot present: ${hasSlot}`);

        // 3. Get Slot By ID
        console.log("3. Getting slot by ID...");
        const slotByIdRes = await axios.get(`${BASE_URL}/admin/placement-slots/${testSlotId}`, { headers: adminHeaders });
        console.log(`   ✅ Got slot: "${slotByIdRes.data.placementSlotTitle}"`);

        // 4. Update Slot
        console.log("4. Updating slot...");
        const updateSlotRes = await axios.put(`${BASE_URL}/admin/placement-slots/${testSlotId}`, {
            placementSlotCapacity: 10,
            placementSlotTitle: "Trang chủ - Banner VIP (updated)",
        }, { headers: adminHeaders });
        console.log(`   ✅ Updated slot capacity: ${updateSlotRes.data.placementSlotCapacity}, title: "${updateSlotRes.data.placementSlotTitle}"`);

        // ========================
        // PROMOTION PACKAGES CRUD
        // ========================
        console.log("\n=== Testing Promotion Packages CRUD ===\n");

        // 5. Create Promotion Package
        console.log("5. Creating Promotion Package...");
        const createPkgRes = await axios.post(`${BASE_URL}/admin/promotion-packages`, {
            promotionPackageSlotId: testSlotId,
            promotionPackageTitle: "Gói VIP 7 ngày",
            promotionPackageDurationDays: 7,
            promotionPackagePrice: "50000.00",
            promotionPackagePublished: true,
        }, { headers: adminHeaders });

        testPackageId = createPkgRes.data.promotionPackageId;
        console.log(`   ✅ Created package -> ID: ${testPackageId}, Title: "${createPkgRes.data.promotionPackageTitle}"`);

        // 6. Get All Packages (with slot join)
        console.log("6. Getting all promotion packages...");
        const allPkgRes = await axios.get(`${BASE_URL}/admin/promotion-packages`, { headers: adminHeaders });
        const hasPkg = allPkgRes.data.some((p: any) => p.promotionPackageId === testPackageId);
        const pkgWithSlot = allPkgRes.data.find((p: any) => p.promotionPackageId === testPackageId);
        console.log(`   ✅ Found ${allPkgRes.data.length} package(s). Test pkg present: ${hasPkg}`);
        console.log(`   ✅ Slot join info -> slotCode: "${pkgWithSlot?.slotCode}", slotTitle: "${pkgWithSlot?.slotTitle}"`);

        // 7. Get Package By ID
        console.log("7. Getting package by ID...");
        const pkgByIdRes = await axios.get(`${BASE_URL}/admin/promotion-packages/${testPackageId}`, { headers: adminHeaders });
        console.log(`   ✅ Got package: "${pkgByIdRes.data.promotionPackageTitle}", price: ${pkgByIdRes.data.promotionPackagePrice}`);

        // 8. Update Package
        console.log("8. Updating package...");
        const updatePkgRes = await axios.put(`${BASE_URL}/admin/promotion-packages/${testPackageId}`, {
            promotionPackagePrice: "99000.00",
            promotionPackageTitle: "Gói VIP 7 ngày (Ưu đãi)",
        }, { headers: adminHeaders });
        console.log(`   ✅ Updated package price: ${updatePkgRes.data.promotionPackagePrice}, title: "${updatePkgRes.data.promotionPackageTitle}"`);

        // 9. Validation: Create Package with invalid slot ID
        console.log("9. Testing validation: invalid slotId...");
        try {
            await axios.post(`${BASE_URL}/admin/promotion-packages`, {
                promotionPackageSlotId: 99999,
                promotionPackageTitle: "Bad Package",
                promotionPackageDurationDays: 1,
                promotionPackagePrice: "10000.00",
            }, { headers: adminHeaders });
            console.log("   ❌ Should have failed with invalid slotId");
        } catch (err: any) {
            if (err.response?.status === 400) {
                console.log(`   ✅ Correctly rejected: "${err.response.data.error}"`);
            } else {
                console.log(`   ❌ Unexpected error: ${err.response?.status} ${err.response?.data?.error}`);
            }
        }

        // ========================
        // USER PUBLIC API
        // ========================
        console.log("\n=== Testing User Public Promotion API ===\n");

        // 10. Get Published Packages (no auth)
        console.log("10. Getting published packages (public, no auth)...");
        const publicPkgRes = await axios.get(`${BASE_URL}/promotions/packages`);
        const hasPublicPkg = publicPkgRes.data.some((p: any) => p.promotionPackageId === testPackageId);
        console.log(`   ✅ Found ${publicPkgRes.data.length} published package(s). Test pkg visible: ${hasPublicPkg}`);

        // 11. Get Published Package By ID
        console.log("11. Getting published package by ID (public)...");
        const publicPkgByIdRes = await axios.get(`${BASE_URL}/promotions/packages/${testPackageId}`);
        console.log(`   ✅ Got public package: "${publicPkgByIdRes.data.promotionPackageTitle}", slot: "${publicPkgByIdRes.data.slotTitle}"`);

        // 12. Auth check: admin endpoints without token should fail
        console.log("12. Testing auth protection...");
        try {
            await axios.get(`${BASE_URL}/admin/placement-slots`);
            console.log("   ❌ Should have required auth");
        } catch (err: any) {
            if (err.response?.status === 401) {
                console.log("   ✅ Admin endpoints correctly require authentication");
            }
        }

        // ========================
        // CLEANUP & DELETE TESTS
        // ========================
        console.log("\n=== Testing Delete (with constraint check) ===\n");

        // 13. Try to delete slot that has packages → should fail
        console.log("13. Trying to delete slot with linked packages...");
        try {
            await axios.delete(`${BASE_URL}/admin/placement-slots/${testSlotId}`, { headers: adminHeaders });
            console.log("   ❌ Should have failed (slot has packages)");
        } catch (err: any) {
            if (err.response?.status === 400) {
                console.log(`   ✅ Correctly prevented: "${err.response.data.error}"`);
            } else {
                console.log(`   ❌ Unexpected: ${err.response?.status} ${err.response?.data?.error}`);
            }
        }

        // 14. Delete package first, then slot
        console.log("14. Deleting package...");
        const delPkgRes = await axios.delete(`${BASE_URL}/admin/promotion-packages/${testPackageId}`, { headers: adminHeaders });
        console.log(`   ✅ ${delPkgRes.data.message}`);
        testPackageId = 0;

        console.log("15. Deleting slot (now empty)...");
        const delSlotRes = await axios.delete(`${BASE_URL}/admin/placement-slots/${testSlotId}`, { headers: adminHeaders });
        console.log(`   ✅ ${delSlotRes.data.message}`);
        testSlotId = 0;

        console.log("\n🎉 All Sprint 3 Phase 1 Tests passed!\n");

    } catch (error: any) {
        console.error("\n❌ Test failed:", error.response?.data || error.message);
    } finally {
        // Cleanup any leftover test data
        console.log("Cleaning up...");
        if (testPackageId > 0) {
            await db.delete(promotionPackages).where(eq(promotionPackages.promotionPackageId, testPackageId));
        }
        if (testSlotId > 0) {
            await db.delete(placementSlots).where(eq(placementSlots.placementSlotId, testSlotId));
        }
        console.log("Done.");
        process.exit(0);
    }
}

runSprint3Tests();
