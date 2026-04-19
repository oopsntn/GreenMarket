import axios from "axios";
import jwt from "jsonwebtoken";
import { eq, inArray, or } from "drizzle-orm";
import { db } from "../../config/db";
import {
  businessRoles,
  eventLogs,
  posts,
  reports,
  shops,
  users,
  notifications,
  escalations,
} from "../../models/schema/index";

const BASE_URL = "http://localhost:5000/api";
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

const makeUserToken = (
  userId: number,
  mobile: string,
  businessRoleCode: string,
) =>
  jwt.sign(
    {
      id: userId,
      mobile,
      role: "user",
      businessRoleCode,
    },
    JWT_SECRET,
    { expiresIn: "1h" },
  );

const createClient = (token: string) =>
  axios.create({
    baseURL: `${BASE_URL}/manager`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    validateStatus: () => true,
  });

const assertStatus = (response: any, expected: number, step: string) => {
  if (response.status !== expected) {
    console.error(`ERROR at ${step}:`, response.data);
    throw new Error(`${step} failed: expected HTTP ${expected}, got ${response.status}`);
  }
};

const makeMobile = () =>
  `09${Math.floor(Math.random() * 1_000_000_000)
    .toString()
    .padStart(9, "0")}`;

const makeSlug = () => `manager-test-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

async function runManagerTests() {
  console.log("--- Starting Test 09: Manager APIs ---");

  const createdUserIds: number[] = [];
  const createdShopIds: number[] = [];
  const createdPostIds: number[] = [];
  const createdReportIds: number[] = [];

  try {
    const roleRows = await db
      .select({
        roleId: businessRoles.businessRoleId,
        roleCode: businessRoles.businessRoleCode,
      })
      .from(businessRoles)
      .where(inArray(businessRoles.businessRoleCode, ["USER", "MANAGER"]));

    const roleByCode = new Map(
      roleRows.map((item) => [item.roleCode?.toUpperCase(), item.roleId]),
    );

    const userRoleId = roleByCode.get("USER");
    const managerRoleId = roleByCode.get("MANAGER");
    if (!userRoleId || !managerRoleId) {
      throw new Error("Required business roles USER/MANAGER are missing in database.");
    }

    const [reporter] = await db
      .insert(users)
      .values({
        userMobile: makeMobile(),
        userDisplayName: "Manager Test Reporter",
        userStatus: "active",
        userBusinessRoleId: userRoleId,
      })
      .returning();

    const [shopOwner] = await db
      .insert(users)
      .values({
        userMobile: makeMobile(),
        userDisplayName: "Manager Test Shop Owner",
        userStatus: "active",
        userBusinessRoleId: userRoleId,
      })
      .returning();

    const [manager] = await db
      .insert(users)
      .values({
        userMobile: makeMobile(),
        userDisplayName: "Manager Test Account",
        userStatus: "active",
        userBusinessRoleId: managerRoleId,
      })
      .returning();

    const [plainUser] = await db
      .insert(users)
      .values({
        userMobile: makeMobile(),
        userDisplayName: "Manager Test Plain User",
        userStatus: "active",
        userBusinessRoleId: userRoleId,
      })
      .returning();

    createdUserIds.push(
      reporter.userId,
      shopOwner.userId,
      manager.userId,
      plainUser.userId,
    );

    const [shop] = await db
      .insert(shops)
      .values({
        shopId: shopOwner.userId,
        shopName: "Manager Test Shop",
        shopStatus: "pending",
      })
      .returning();

    createdShopIds.push(shop.shopId);

    const [pendingPost] = await db
      .insert(posts)
      .values({
        postAuthorId: shopOwner.userId,
        postShopId: shop.shopId,
        postTitle: "Manager test pending post",
        postSlug: makeSlug(),
        postStatus: "pending",
      })
      .returning();

    const [feedbackPost] = await db
      .insert(posts)
      .values({
        postAuthorId: shopOwner.userId,
        postShopId: shop.shopId,
        postTitle: "Manager test feedback post",
        postSlug: makeSlug(),
        postStatus: "pending",
      })
      .returning();

    createdPostIds.push(pendingPost.postId, feedbackPost.postId);

    const [pendingReport] = await db
      .insert(reports)
      .values({
        reporterId: reporter.userId,
        postId: pendingPost.postId,
        reportShopId: shop.shopId,
        reportReasonCode: "fraud",
        reportReason: "Suspected scam listing",
        reportStatus: "pending",
      })
      .returning();

    createdReportIds.push(pendingReport.reportId);

    const managerToken = makeUserToken(manager.userId, manager.userMobile, "MANAGER");
    const plainToken = makeUserToken(plainUser.userId, plainUser.userMobile, "USER");
    const managerClient = createClient(managerToken);
    const plainClient = createClient(plainToken);

    console.log("1) RBAC check...");
    const deniedRes = await plainClient.get("/history");
    assertStatus(deniedRes, 403, "Non-manager access");

    console.log("2) Moderation queue...");
    const queueRes = await managerClient.get("/moderation/queue", {
      params: { status: "pending" },
    });
    assertStatus(queueRes, 200, "GET /moderation/queue");
    if (!Array.isArray(queueRes.data?.data)) {
      throw new Error("Queue response has invalid data payload.");
    }

    const queueTypes = new Set(
      queueRes.data.data.map((item: { type?: string }) => item.type),
    );
    if (!queueTypes.has("post") || !queueTypes.has("report") || !queueTypes.has("shop")) {
      throw new Error("Queue does not include expected post/report/shop pending items.");
    }

    console.log("3) Update post status...");
    const updatePostRes = await managerClient.patch(
      `/posts/${pendingPost.postId}/status`,
      {
        status: "approved",
        reason: "Content verified",
        note: "Manager moderation test",
      },
    );
    assertStatus(updatePostRes, 200, "PATCH /posts/:id/status");
    const [postAfterUpdate] = await db
      .select({ status: posts.postStatus })
      .from(posts)
      .where(eq(posts.postId, pendingPost.postId))
      .limit(1);
    if (postAfterUpdate?.status !== "approved") {
      throw new Error("Post status was not updated to approved.");
    }

    const duplicatePostRes = await managerClient.patch(
      `/posts/${pendingPost.postId}/status`,
      { status: "approved" },
    );
    assertStatus(duplicatePostRes, 409, "Duplicate post status update");

    console.log("4) Update shop status...");
    const blockWithoutReasonRes = await managerClient.patch(`/shops/${shop.shopId}/status`, {
      status: "blocked",
    });
    assertStatus(blockWithoutReasonRes, 400, "Block shop without reason");

    const blockShopRes = await managerClient.patch(`/shops/${shop.shopId}/status`, {
      status: "blocked",
      reason: "Repeated policy violations",
    });
    assertStatus(blockShopRes, 200, "PATCH /shops/:id/status to blocked");

    const unblockShopRes = await managerClient.patch(`/shops/${shop.shopId}/status`, {
      status: "active",
      note: "Issue resolved",
    });
    assertStatus(unblockShopRes, 200, "PATCH /shops/:id/status to active");

    console.log("5) Reports list and resolve...");
    const listReportsRes = await managerClient.get("/reports", {
      params: { status: "pending", severity: "high" },
    });
    assertStatus(listReportsRes, 200, "GET /reports");
    if (!Array.isArray(listReportsRes.data?.data) || listReportsRes.data.data.length < 1) {
      throw new Error("Expected pending high severity report in list.");
    }

    const resolveReportRes = await managerClient.patch(
      `/reports/${pendingReport.reportId}/resolve`,
      {
        status: "resolved",
        resolution: "Violation confirmed and post actioned",
        note: "Manager resolution note",
      },
    );
    assertStatus(resolveReportRes, 200, "PATCH /reports/:id/resolve");

    const duplicateResolveRes = await managerClient.patch(
      `/reports/${pendingReport.reportId}/resolve`,
      {
        status: "dismissed",
        resolution: "Second resolution attempt",
      },
    );
    assertStatus(duplicateResolveRes, 409, "Resolve closed report");

    console.log("6) Moderation feedback...");
    const feedbackRes = await managerClient.post("/moderation-feedback", {
      targetType: "post",
      targetId: feedbackPost.postId,
      recipientUserId: shopOwner.userId,
      message: "Please update listing details to comply with policy.",
      templateId: "MOD-POST-WARN-01",
    });
    assertStatus(feedbackRes, 201, "POST /moderation-feedback");
    if (!feedbackRes.data?.feedback?.id) {
      throw new Error("Feedback response missing id (notificationId).");
    }

    console.log("7) Escalation...");
    const escalationRes = await managerClient.post("/escalations", {
      targetType: "report",
      targetId: pendingReport.reportId,
      severity: "high",
      reason: "Potential coordinated fraud pattern",
      evidenceUrls: ["https://evidence.local/manager-test-case-1"],
    });
    assertStatus(escalationRes, 201, "POST /escalations");
    if (!escalationRes.data?.escalationTicket?.ticketCode) {
      throw new Error("Escalation response missing ticketCode.");
    }

    console.log("8) History and statistics...");
    const historyRes = await managerClient.get("/history", {
      params: { actionType: "post_status" },
    });
    assertStatus(historyRes, 200, "GET /history");
    if (!Array.isArray(historyRes.data?.data)) {
      throw new Error("History response has invalid payload.");
    }

    const statisticsRes = await managerClient.get("/statistics");
    assertStatus(statisticsRes, 200, "GET /statistics");
    if (Number(statisticsRes.data?.kpi?.totalActions ?? 0) < 1) {
      throw new Error("Statistics should include at least one manager action.");
    }

    console.log("✅ Test 09 passed.");
  } catch (error: any) {
    console.error(
      "❌ Test 09 failed:",
      error?.response?.data || error?.message || error,
    );
    process.exitCode = 1;
  } finally {
    try {
      if (createdUserIds.length > 0) {
        await db
          .delete(eventLogs)
          .where(inArray(eventLogs.eventLogUserId, createdUserIds));
      }

      if (createdUserIds.length > 0) {
        await db
          .delete(notifications)
          .where(
            or(
              inArray(notifications.senderId, createdUserIds),
              inArray(notifications.recipientId, createdUserIds)
            )
          );
        await db
          .delete(escalations)
          .where(inArray(escalations.createdBy, createdUserIds));
      }

      if (createdReportIds.length > 0) {
        await db
          .delete(reports)
          .where(inArray(reports.reportId, createdReportIds));
      }

      if (createdPostIds.length > 0) {
        await db
          .delete(posts)
          .where(inArray(posts.postId, createdPostIds));
      }

      if (createdShopIds.length > 0) {
        await db
          .delete(shops)
          .where(inArray(shops.shopId, createdShopIds));
      }

      if (createdUserIds.length > 0) {
        await db
          .delete(users)
          .where(inArray(users.userId, createdUserIds));
      }
    } catch (cleanupError) {
      console.error("Cleanup warning:", cleanupError);
      process.exitCode = 1;
    }
  }
}

runManagerTests();
