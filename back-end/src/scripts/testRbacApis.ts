import axios from "axios";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { inArray, eq } from "drizzle-orm";
import { db } from "../config/db";
import { admins, adminRoles, roles } from "../models/schema/index";

const API_BASE = "http://localhost:5000/api/admin";
const AUTH_BASE = "http://localhost:5000/api/auth";
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

type TestAdmin = {
    adminId: number;
    adminEmail: string;
};

const makeAdminToken = (adminId: number, adminEmail: string, roleCodes: string[]) =>
    jwt.sign(
        {
            id: adminId,
            email: adminEmail,
            role: "admin",
            roleCodes,
        },
        JWT_SECRET,
        { expiresIn: "1h" }
    );

const makeUserToken = () =>
    jwt.sign(
        {
            id: 999999,
            mobile: "0999888777",
            role: "user",
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

const assertStatus = (actual: number, expected: number, step: string) => {
    if (actual !== expected) {
        throw new Error(`${step} failed: expected HTTP ${expected}, got ${actual}`);
    }
};

async function createTempAdmin(suffix: string): Promise<TestAdmin> {
    const [admin] = await db.insert(admins).values({
        adminEmail: `rbac.${suffix}.${Date.now()}@test.local`,
        adminPasswordHash: "hashed-password-not-used-in-this-script",
        adminFullName: `RBAC ${suffix}`,
        adminStatus: "active",
    }).returning();

    return {
        adminId: admin.adminId,
        adminEmail: admin.adminEmail,
    };
}

async function testRbacApis() {
    console.log("--- Starting RBAC API Integration Test ---");

    const createdAdminIds: number[] = [];
    let createdRoleId: number | null = null;
    let createdRoleCode: string | null = null;
    let loginRoleId: number | null = null;
    let loginRoleCode: string | null = null;

    try {
        // Setup test admins
        const superAdmin = await createTempAdmin("super");
        const moderatorAdmin = await createTempAdmin("moderator");
        const supportAdmin = await createTempAdmin("support");
        createdAdminIds.push(superAdmin.adminId, moderatorAdmin.adminId, supportAdmin.adminId);

        // Setup login-specific admin and role to verify adminLogin includes roleCodes.
        const loginPassword = "Admin@123";
        const loginPasswordHash = await bcrypt.hash(loginPassword, 4);
        const [loginAdmin] = await db.insert(admins).values({
            adminEmail: `rbac.login.${Date.now()}@test.local`,
            adminPasswordHash: loginPasswordHash,
            adminFullName: "RBAC Login",
            adminStatus: "active",
        }).returning();
        createdAdminIds.push(loginAdmin.adminId);

        loginRoleCode = `ROLE_LOGIN_TEST_${Date.now()}`;
        const [newLoginRole] = await db.insert(roles).values({
            roleCode: loginRoleCode,
            roleTitle: "Login Test Role",
            roleCreatedAt: new Date(),
        }).returning();
        loginRoleId = newLoginRole.roleId;

        await db.insert(adminRoles).values({
            adminRoleAdminId: loginAdmin.adminId,
            adminRoleRoleId: newLoginRole.roleId,
        });

        const superToken = makeAdminToken(superAdmin.adminId, superAdmin.adminEmail, ["ROLE_ADMIN"]);
        const moderatorToken = makeAdminToken(moderatorAdmin.adminId, moderatorAdmin.adminEmail, ["ROLE_MODERATOR"]);
        const supportToken = makeAdminToken(supportAdmin.adminId, supportAdmin.adminEmail, ["ROLE_SUPPORT"]);
        const userToken = makeUserToken();

        const noTokenClient = createClient();
        const superClient = createClient(superToken);
        const moderatorClient = createClient(moderatorToken);
        const supportClient = createClient(supportToken);
        const userClient = createClient(userToken);

        // 0) Admin login response should include roleCodes
        console.log("0. Admin login response check...");
        const loginRes = await axios.post(
            `${AUTH_BASE}/admin/login`,
            { email: loginAdmin.adminEmail, password: loginPassword },
            { validateStatus: () => true }
        );
        assertStatus(loginRes.status, 200, "Admin login");
        const decoded = jwt.decode(loginRes.data.token) as { roleCodes?: string[] } | null;
        if (!decoded?.roleCodes?.includes(loginRoleCode)) {
            throw new Error("Admin login token does not include expected roleCodes");
        }

        // 1) Guard checks
        console.log("1. Guard checks...");
        const noTokenRes = await noTokenClient.get("/roles");
        assertStatus(noTokenRes.status, 401, "No-token admin route guard");

        const userRes = await userClient.get("/roles");
        assertStatus(userRes.status, 403, "User-token admin route guard");

        // 2) Role-based access checks
        console.log("2. Role-based access checks...");
        const supportOnRolesRes = await supportClient.get("/roles");
        assertStatus(supportOnRolesRes.status, 403, "Support role denied roles management");

        const moderatorOnPostsRes = await moderatorClient.get("/posts");
        assertStatus(moderatorOnPostsRes.status, 200, "Moderator role allowed post moderation");

        const moderatorOnUsersRes = await moderatorClient.get("/users");
        assertStatus(moderatorOnUsersRes.status, 403, "Moderator role denied users management");

        const supportOnUsersRes = await supportClient.get("/users");
        assertStatus(supportOnUsersRes.status, 200, "Support role allowed users management");

        const supportOnPostsRes = await supportClient.get("/posts");
        assertStatus(supportOnPostsRes.status, 403, "Support role denied post moderation");

        // 3) Roles CRUD and assignment APIs
        console.log("3. Roles CRUD + assignment checks...");
        createdRoleCode = `ROLE_TEST_AUTOMATION_${Date.now()}`;

        const createRoleRes = await superClient.post("/roles", {
            roleCode: createdRoleCode,
            roleTitle: "Automation Test Role",
        });
        assertStatus(createRoleRes.status, 201, "Create role");
        createdRoleId = createRoleRes.data.roleId;

        const updateRoleRes = await superClient.patch(`/roles/${createdRoleId}`, {
            roleTitle: "Automation Test Role Updated",
        });
        assertStatus(updateRoleRes.status, 200, "Update role");

        const assignRes = await superClient.put(`/roles/admins/${supportAdmin.adminId}/roles`, {
            roleIds: [createdRoleId],
        });
        assertStatus(assignRes.status, 200, "Replace admin role assignments");

        const getAssignmentsRes = await superClient.get(`/roles/admins/${supportAdmin.adminId}/roles`);
        assertStatus(getAssignmentsRes.status, 200, "Get admin role assignments");
        const assignedRoleCodes: string[] = (getAssignmentsRes.data.roles || []).map((r: any) => r.roleCode);
        if (!assignedRoleCodes.includes(createdRoleCode)) {
            throw new Error("Get admin role assignments failed: expected assigned role not found");
        }

        const deleteRoleRes = await superClient.delete(`/roles/${createdRoleId}`);
        assertStatus(deleteRoleRes.status, 200, "Delete role");
        createdRoleId = null;

        console.log("✅ RBAC API test passed.");
    } catch (error: any) {
        console.error("❌ RBAC API test failed:", error?.response?.data || error?.message || error);
        process.exitCode = 1;
    } finally {
        try {
            if (createdAdminIds.length > 0) {
                await db.delete(adminRoles).where(inArray(adminRoles.adminRoleAdminId, createdAdminIds));
            }

            if (createdRoleId !== null) {
                await db.delete(roles).where(eq(roles.roleId, createdRoleId));
            } else if (createdRoleCode) {
                await db.delete(roles).where(eq(roles.roleCode, createdRoleCode));
            }

            if (loginRoleId !== null) {
                await db.delete(roles).where(eq(roles.roleId, loginRoleId));
            } else if (loginRoleCode) {
                await db.delete(roles).where(eq(roles.roleCode, loginRoleCode));
            }

            if (createdAdminIds.length > 0) {
                await db.delete(admins).where(inArray(admins.adminId, createdAdminIds));
            }
        } catch (cleanupError) {
            console.error("Cleanup warning:", cleanupError);
            process.exitCode = 1;
        }
    }
}

testRbacApis();
