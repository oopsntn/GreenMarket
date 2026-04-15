import axios from "axios";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });
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

async function testHostContentPublic() {
  console.log("--- Starting Host Content Public & Bookmarking API Test ---");

  const hostToken = makeToken(1, "HOST");
  const buyerToken = makeToken(2, "USER"); // Regular user

  const hostClient = axios.create({
    baseURL: API_BASE,
    headers: { Authorization: `Bearer ${hostToken}` },
    validateStatus: () => true,
  });

  const buyerClient = axios.create({
    baseURL: API_BASE,
    headers: { Authorization: `Bearer ${buyerToken}` },
    validateStatus: () => true,
  });

  const publicClient = axios.create({
    baseURL: API_BASE,
    validateStatus: () => true,
  });

  try {
    // 1. Setup sample content as HOST
    console.log("1. Setting up sample content...");
    const createRes = await hostClient.post("/host/contents", {
      title: "Unique Garden Tips 2026",
      description: "How to grow bonsai plants in spring",
      targetType: "post",
      targetId: null,
      mediaUrls: [],
    });
    assertStatus(createRes.status, 201, "Create seed content");
    const contentId = createRes.data.hostContentId;
    console.log(`   Content ID: ${contentId}`);

    // Update to published
    await hostClient.patch(`/host/contents/${contentId}`, {
      hostContentStatus: "published",
    });
    console.log("   Content set to 'published'");

    // 2. Public Retrieval
    console.log("2. Testing public retrieval...");
    const listRes = await publicClient.get("/host/public/contents?search=Garden&targetType=post");
    if (listRes.status !== 200) {
      console.log("   Full error response:", JSON.stringify(listRes.data, null, 2));
    }
    assertStatus(listRes.status, 200, "Get public contents with search + targetType filter");
    const foundByGarden = listRes.data.data.find((c: any) => c.hostContentId === contentId);
    if (!foundByGarden) throw new Error("Search by keyword 'Garden' failed to find content");
    console.log("   Search + targetType filter verified.");

    const detailRes1 = await publicClient.get(`/host/public/contents/${contentId}`);
    assertStatus(detailRes1.status, 200, "Get content detail (1st time)");
    const viewsAfterFirst = Number(detailRes1.data.hostContentViewCount || 0);

    const detailRes2 = await publicClient.get(`/host/public/contents/${contentId}`);
    assertStatus(detailRes2.status, 200, "Get content detail (2nd time)");
    const viewsAfterSecond = Number(detailRes2.data.hostContentViewCount || 0);

    console.log(`   Content detail: ${detailRes2.data.hostContentTitle}, Views after two reads: ${viewsAfterSecond}`);
    if (viewsAfterSecond !== viewsAfterFirst + 1) {
      throw new Error("View count did not increment exactly by 1 between two detail calls");
    }

    // 3. Bookmarking (Regular User)
    console.log("3. Testing bookmarking as regular user...");
    const checkBefore = await buyerClient.get(`/host/favorites/${contentId}/check`);
    if (checkBefore.data.isSaved) throw new Error("Should not be saved initially");

    const toggleOn = await buyerClient.post(`/host/favorites/${contentId}`);
    assertStatus(toggleOn.status, 200, "Toggle bookmark ON");
    if (!toggleOn.data.isSaved) throw new Error("Should be saved after toggle ON");

    const myList = await buyerClient.get("/host/favorites");
    assertStatus(myList.status, 200, "Get my favorite contents");
    const foundInFavorites = myList.data.data.find((c: any) => c.hostContentId === contentId);
    if (!foundInFavorites) throw new Error("Content not found in user favorites list");
    console.log("   User bookmarking verified.");

    const toggleOff = await buyerClient.post(`/host/favorites/${contentId}`);
    assertStatus(toggleOff.status, 200, "Toggle bookmark OFF");
    if (toggleOff.data.isSaved) throw new Error("Should not be saved after toggle OFF");

    // 4. Cleanup
    console.log("4. Cleaning up...");
    await hostClient.delete(`/host/contents/${contentId}`);
    console.log("   Seed content deleted.");

    console.log("✅ Host Content Public & Bookmarking API test passed.");
  } catch (error: any) {
    if (error.response) {
      console.error(`❌ Test failed at HTTP ${error.response.status}:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("❌ Test failed:", error.message || error);
    }
    process.exitCode = 1;
  }
}

testHostContentPublic();
