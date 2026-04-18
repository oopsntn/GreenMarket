import axios from "axios";
import jwt from "jsonwebtoken";

const API_BASE = "http://localhost:5000/api/collaborator";
const JWT_SECRET = "6f4b1c9e2a7d5f3c8b0e91a4d7c2f6b9e1a3c5d8f0b2e4a7c9d1e6f3a8b5c2d7";

const makeUserToken = (id: number, mobile: string, businessRoleCode: string | null = null) =>
  jwt.sign(
    {
      id,
      mobile,
      role: "user",
      businessRoleCode,
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

const createClient = (token?: string) =>
  axios.create({
    baseURL: API_BASE,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    validateStatus: () => true,
  });

const assertStatus = (actual: number, expected: number, step: string, body?: any) => {
  if (actual !== expected) {
    console.error(`❌ ${step} FAILED: expected ${expected}, got ${actual}`);
    if (body) console.error("   Response:", body);
    throw new Error(`${step} failed`);
  }
  console.log(`✅ ${step} passed (HTTP ${actual})`);
};

async function testCollaboratorAccess() {
  console.log("--- Starting Collaborator Access Verification (Docker) ---");

  try {
    // 1. Garden Owner (Nam - 0978195419, ID 1) -> Success expected
    console.log("\nKịch bản 1: Chủ vườn (Có shop active)...");
    const ownerToken = makeUserToken(1, "0978195419", "USER");
    const ownerClient = createClient(ownerToken);
    const ownerRes = await ownerClient.get("/public-list");
    assertStatus(ownerRes.status, 200, "Chủ vườn truy cập danh sách CTV", ownerRes.data);

    // 2. Regular User (0987654321, ID 8) -> 403 expected
    console.log("\nKịch bản 2: Người dùng thường (Không có shop)...");
    const userToken = makeUserToken(8, "0987654321", "USER");
    const userClient = createClient(userToken);
    const userRes = await userClient.get("/public-list");
    assertStatus(userRes.status, 403, "Người dùng thường bị chặn", userRes.data);
    if (userRes.data.error !== "Access denied. Active shop profile required.") {
      throw new Error(`Sai thông điệp lỗi: ${userRes.data.error}`);
    }

    // 3. HOST User (Host Pro - 0998887776, ID 136) -> 403 expected
    console.log("\nKịch bản 3: HOST (Biên tập viên - Không có shop)...");
    const hostToken = makeUserToken(136, "0998887776", "HOST");
    const hostClient = createClient(hostToken);
    const hostRes = await hostClient.get("/public-list");
    assertStatus(hostRes.status, 403, "HOST bị chặn truy cập danh sách CTV", hostRes.data);

    console.log("\n--- TẤT CẢ KIỂM THỬ ĐÃ VƯỢT QUA ---");
    console.log("Hệ thống đã phân quyền chuẩn xác: Chỉ những ai thực sự có shop active mới được khám phá CTV.");

  } catch (error: any) {
    console.error("\n❌ KIỂM THỬ THẤT BẠI");
    process.exit(1);
  }
}

testCollaboratorAccess();
