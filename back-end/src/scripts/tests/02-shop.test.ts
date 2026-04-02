import axios from "axios";
import { db } from "../../config/db";
import { users, shops } from "../../models/schema/index";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import "dotenv/config";

const BASE_URL = "http://localhost:5000/api";
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

async function runShopTests() {
    console.log("--- Starting Test 02: Shop Operations ---");
    let testUserId: number | undefined;
    let testShopId: number | undefined;

    try {
        // 1. Setup User in DB natively
        const mobileNumber = `099${Math.floor(Math.random() * 9000000) + 1000000}`;
        const [user] = await db.insert(users).values({
            userMobile: mobileNumber,
            userDisplayName: "Shop Tester",
            userStatus: "active"
        }).returning();
        testUserId = user.userId;

        console.log(`✅ Test Setup: User created (ID: ${testUserId})`);

        // Generate JWT
        const token = jwt.sign(
            { id: user.userId, mobile: user.userMobile, role: "user" },
            JWT_SECRET,
            { expiresIn: "1h" }
        );
        const headers = { Authorization: `Bearer ${token}` };

        // Test 1: Register Shop
        console.log("\n[Test] Calling POST /shops/register...");
        const shopRes = await axios.post(`${BASE_URL}/shops/register`, {
            shopName: "Tester Market Shop",
            shopPhone: "0123456789",
            shopLocation: "Hanoi",
            shopLogoUrl: "/uploads/logo.jpg",
            shopCoverUrl: "/uploads/cover.jpg"
        }, { headers });
        
        if (shopRes.data && shopRes.data.shopId && shopRes.data.shopLogoUrl === "/uploads/logo.jpg") {
            testShopId = shopRes.data.shopId;
            console.log(`✅ Passed: Shop registered with Logo/Cover (ID: ${testShopId})`);
        } else {
            console.log("❌ Failed: Shop missing ID or Media in response");
            process.exit(1);
        }

        // Test 2: Update Shop (Patch description)
        console.log(`\n[Test] Calling PATCH /shops/${testShopId}...`);
        const updateShopRes = await axios.patch(`${BASE_URL}/shops/${testShopId}`, {
            shopDescription: "Description updated by 02-shop.test.ts"
        }, { headers });
        
        if (updateShopRes.data && updateShopRes.data.shopDescription === "Description updated by 02-shop.test.ts") {
            console.log("✅ Passed: Shop description updated successfully");
        } else {
            console.log("❌ Failed: Shop update failed or mismatched description");
            process.exit(1);
        }

        // Test 3: Browse Public Shops
        console.log("\n[Test] Calling GET /shops/browse...");
        const browseShopRes = await axios.get(`${BASE_URL}/shops/browse`);
        if (browseShopRes.data && Array.isArray(browseShopRes.data.data)) {
            console.log(`✅ Passed: Public shop browse returned ${browseShopRes.data.data.length} items.`);
        } else {
            console.log("❌ Failed: Browse shop did not return expected array data.");
            process.exit(1);
        }

        console.log("\n🎉 All Test 02: Shop Operations passed.\n");

    } catch (error: any) {
        console.error("Test execution failed:", error.response?.data || error.message);
        process.exit(1);
    } finally {
        // Cleanup Phase
        console.log("Cleaning up Test 02 data...");
        if (testShopId) await db.delete(shops).where(eq(shops.shopId, testShopId));
        if (testUserId) await db.delete(users).where(eq(users.userId, testUserId));
        console.log("Cleanup complete.");
        process.exit(0);
    }
}

runShopTests();
