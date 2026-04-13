import axios from "axios";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });
// If running from project root
if (!process.env.JWT_SECRET) {
  dotenv.config({ path: path.join(process.cwd(), "back-end/.env") });
}

const API_BASE = "http://localhost:5000/api";
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

const makeToken = (userId: number, roleCode: string) =>
  jwt.sign(
    {
      id: userId,
      role: "user",
      businessRole: roleCode,
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

const assertStatus = (actual: number, expected: number, step: string) => {
  if (actual !== expected) {
    throw new Error(`${step} failed: expected HTTP ${expected}, got ${actual}`);
  }
};

async function testHostRole() {
  console.log("--- Starting HOST Role API Integration Test ---");

  // User 1 is a HOST in seed data
  const hostToken = makeToken(1, "HOST");
  const collaboratorToken = makeToken(4, "COLLABORATOR"); // User 4 is a COLLABORATOR

  const hostClient = axios.create({
    baseURL: API_BASE,
    headers: { Authorization: `Bearer ${hostToken}` },
    validateStatus: () => true,
  });

  hostClient.interceptors.request.use((config) => {
    console.log(`   Hitting: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  });

  const unauthorizedClient = axios.create({
    baseURL: API_BASE,
    headers: { Authorization: `Bearer ${collaboratorToken}` },
    validateStatus: () => true,
  });

  try {
    // 1. RBAC Check
    console.log("1. RBAC Access Test...");
    const rbacRes = await unauthorizedClient.get("/host/dashboard");
    assertStatus(rbacRes.status, 403, "Non-HOST access denial");

    const hostAccessRes = await hostClient.get("/host/dashboard");
    assertStatus(hostAccessRes.status, 200, "HOST access allowed");
    console.log("   Dashboard Stats:", JSON.stringify(hostAccessRes.data.stats));

    // 2. Earnings & Payouts
    console.log("2. Earnings & Payouts Test...");
    const earningsRes = await hostClient.get("/host/earnings");
    assertStatus(earningsRes.status, 200, "Get earnings list");

    const payoutsRes = await hostClient.get("/host/payout-requests");
    assertStatus(payoutsRes.status, 200, "Get payout requests list");

    console.log("   Attempting payout below minimum (100,000 VND)...");
    const lowPayoutRes = await hostClient.post("/host/payout-requests", {
      amount: 100000,
      method: "Momo",
      note: "Test low payout"
    });
    assertStatus(lowPayoutRes.status, 400, "Minimum payout reinforcement");

    // 3. Content CRUD
    console.log("3. Content CRUD Test...");
    const createContentRes = await hostClient.post("/host/contents", {
      title: "Test Promotional Content",
      description: "This is a test content from automation script",
      targetType: "shop",
      targetId: 1,
      mediaUrls: ["https://example.com/image.jpg"]
    });
    assertStatus(createContentRes.status, 201, "Create content");
    const contentId = createContentRes.data.hostContentId;
    console.log(`   Content created with ID: ${contentId}, Tracking URL: ${createContentRes.data.hostContentTrackingUrl}`);

    const listContentRes = await hostClient.get("/host/contents");
    assertStatus(listContentRes.status, 200, "List contents");

    const updateContentRes = await hostClient.patch(`/host/contents/${contentId}`, {
      title: "Updated Test Promotional Content"
    });
    assertStatus(updateContentRes.status, 200, "Update content");

    // 4. Tracking Logic
    console.log("4. Tracking Logic Test...");
    // Public endpoint, use raw axios to check redirect
    const trackingRes = await axios.get(`${API_BASE}/host/tracking/${contentId}`, {
      maxRedirects: 0,
      validateStatus: (status) => status === 302,
    });
    assertStatus(trackingRes.status, 302, "Tracking redirect check");
    console.log(`   Redirected to: ${trackingRes.headers.location}`);

    // Verify click count increment
    const afterTrackingRes = await hostClient.get("/host/contents");
    const myContent = afterTrackingRes.data.find((c: any) => c.hostContentId === contentId);
    if (myContent.hostContentClickCount < 1) {
      throw new Error("Click count did not increment after tracking visit");
    }
    console.log("   Click count verified.");

    // 5. Cleanup
    console.log("5. Cleanup...");
    const deleteRes = await hostClient.delete(`/host/contents/${contentId}`);
    assertStatus(deleteRes.status, 200, "Delete content");

    console.log("✅ HOST Role API test passed.");
  } catch (error: any) {
    console.error("❌ HOST Role API test failed:", error?.response?.data || error?.message || error);
    process.exitCode = 1;
  }
}

testHostRole();
