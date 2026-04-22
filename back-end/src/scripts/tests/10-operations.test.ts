import axios from "axios";
import jwt from "jsonwebtoken";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../../config/db";
import {
  businessRoles,
  eventLogs,
  reports,
  users,
  operationTasks,
  taskReplies,
  escalations,
  notifications,
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
    baseURL: `${BASE_URL}/operations`,
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

const getActiveOperationStaffIds = async () => {
  const rows = await db
    .select({
      userId: users.userId,
    })
    .from(users)
    .leftJoin(businessRoles, eq(users.userBusinessRoleId, businessRoles.businessRoleId))
    .where(
      and(
        eq(businessRoles.businessRoleCode, "OPERATION_STAFF"),
        eq(businessRoles.businessRoleStatus, "active"),
        eq(users.userStatus, "active"),
      ),
    )
    .orderBy(users.userId);

  return rows.map((item) => item.userId);
};

async function createRealTaskFor(staffId: number, customerId: number) {
  const [task] = await db
    .insert(operationTasks)
    .values({
      ticketType: 'SUPPORT',
      ticketAssigneeId: staffId,
      ticketCreatorId: customerId,
      ticketTitle: `Operations Test Task ${Date.now()}`,
      ticketContent: 'Support request context',
      ticketStatus: "open",
      ticketPriority: "medium",
    })
    .returning();
  return task;
}

async function runOperationsTests() {
  console.log("--- Starting Test 10: Operations Staff APIs ---");

  const createdUserIds: number[] = [];
  const createdReportIds: number[] = [];
  let selectedTaskId: number | null = null;

  try {
    const roleRows = await db
      .select({
        roleId: businessRoles.businessRoleId,
        roleCode: businessRoles.businessRoleCode,
      })
      .from(businessRoles)
      .where(inArray(businessRoles.businessRoleCode, ["USER", "OPERATION_STAFF"]));

    const roleByCode = new Map(
      roleRows.map((item) => [item.roleCode?.toUpperCase(), item.roleId]),
    );

    const userRoleId = roleByCode.get("USER");
    const operationRoleId = roleByCode.get("OPERATION_STAFF");
    if (!userRoleId || !operationRoleId) {
      throw new Error("Required business roles USER/OPERATION_STAFF are missing.");
    }

    const [reporter] = await db
      .insert(users)
      .values({
        userMobile: makeMobile(),
        userDisplayName: "Operations Test Reporter",
        userStatus: "active",
        userBusinessRoleId: userRoleId,
      })
      .returning();

    const [operationUser] = await db
      .insert(users)
      .values({
        userMobile: makeMobile(),
        userDisplayName: "Operations Test Staff",
        userStatus: "active",
        userBusinessRoleId: operationRoleId,
      })
      .returning();

    const [plainUser] = await db
      .insert(users)
      .values({
        userMobile: makeMobile(),
        userDisplayName: "Operations Test Plain User",
        userStatus: "active",
        userBusinessRoleId: userRoleId,
      })
      .returning();

    createdUserIds.push(reporter.userId, operationUser.userId, plainUser.userId);

    const task = await createRealTaskFor(operationUser.userId, reporter.userId);
    selectedTaskId = task.ticketId;

    const operationToken = makeUserToken(
      operationUser.userId,
      operationUser.userMobile,
      "OPERATION_STAFF",
    );
    const plainToken = makeUserToken(plainUser.userId, plainUser.userMobile, "USER");
    const operationClient = createClient(operationToken);
    const plainClient = createClient(plainToken);

    console.log("1) RBAC check...");
    const deniedRes = await plainClient.get("/tasks");
    assertStatus(deniedRes, 403, "Non-staff access");

    console.log("2) List tasks...");
    const listRes = await operationClient.get("/tasks", {
      params: { status: "open", page: 1, limit: 50 },
    });
    assertStatus(listRes, 200, "GET /tasks");
    if (!Array.isArray(listRes.data?.data)) {
      throw new Error("GET /tasks returned invalid data payload.");
    }

    const taskIds = listRes.data.data.map((item: any) => item.taskId);
    if (!taskIds.includes(selectedTaskId)) {
      throw new Error("Assigned task is missing from operations task list.");
    }

    console.log("3) Task detail...");
    const detailRes = await operationClient.get(`/tasks/${selectedTaskId}`);
    assertStatus(detailRes, 200, "GET /tasks/:id");
    if (!detailRes.data?.task?.taskId) {
      throw new Error("Task detail is missing task payload.");
    }

    console.log("4) Invalid transition check...");
    const invalidTransitionRes = await operationClient.patch(
      `/tasks/${selectedTaskId}/status`,
      { status: "closed" },
    );
    assertStatus(invalidTransitionRes, 409, "Invalid transition open->closed");

    console.log("5) Move task to in_progress...");
    const inProgressRes = await operationClient.patch(
      `/tasks/${selectedTaskId}/status`,
      {
        status: "in_progress",
        note: "Started processing customer request",
      },
    );
    assertStatus(inProgressRes, 200, "PATCH /tasks/:id/status to in_progress");

    console.log("6) Reply to task...");
    const replyRes = await operationClient.post(`/tasks/${selectedTaskId}/replies`, {
      message: "We have received your request and started handling it.",
      attachments: ["https://cdn.local/ops/reply-attachment-1.png"],
      visibility: "internal",
    });
    assertStatus(replyRes, 201, "POST /tasks/:id/replies");
    if (!replyRes.data?.reply?.replyId) {
      throw new Error("Reply response is missing replyId.");
    }

    console.log("7) Escalate task...");
    const escalateRes = await operationClient.post(`/tasks/${selectedTaskId}/escalate`, {
      reason: "Need manager decision for policy-sensitive case",
      targetRole: "MANAGER",
      priority: "high",
    });
    assertStatus(escalateRes, 201, "POST /tasks/:id/escalate");
    if (!escalateRes.data?.escalation?.escalationId) {
      throw new Error("Escalation response is missing escalationId.");
    }

    console.log("8) Daily workload...");
    const workloadRes = await operationClient.get("/workload/daily");
    assertStatus(workloadRes, 200, "GET /workload/daily");
    if (typeof workloadRes.data?.stats?.open !== "number") {
      throw new Error("Workload stats payload is invalid.");
    }

    console.log("9) Notifications...");
    const notificationsRes = await operationClient.get("/notifications", {
      params: { unreadOnly: true, page: 1, limit: 20 },
    });
    assertStatus(notificationsRes, 200, "GET /notifications");
    if (!Array.isArray(notificationsRes.data?.data)) {
      throw new Error("Notifications payload is invalid.");
    }

    console.log("10) Close task...");
    const closeRes = await operationClient.patch(`/tasks/${selectedTaskId}/status`, {
      status: "closed",
      note: "Support request completed",
    });
    assertStatus(closeRes, 200, "PATCH /tasks/:id/status closed");

    console.log("11) Escalate closed task should fail...");
    const escalateClosedRes = await operationClient.post(`/tasks/${selectedTaskId}/escalate`, {
      reason: "Try escalate after close",
      targetRole: "ADMIN",
    });
    assertStatus(escalateClosedRes, 409, "Escalate closed task");

    console.log("✅ Test 10 passed.");
  } catch (error: any) {
    console.error(
      "❌ Test 10 failed:",
      error?.response?.data || error?.message || error,
    );
    process.exitCode = 1;
  } finally {
    try {
      if (createdUserIds.length > 0) {
        // Cleanup replies, escalations, tasks first due to FKs
        await db.delete(taskReplies).where(inArray(taskReplies.senderId, createdUserIds));
        await db.delete(escalations).where(and(eq(escalations.ticketType, 'ESCALATION'), inArray(escalations.ticketCreatorId, createdUserIds)));
        await db.delete(notifications).where(inArray(notifications.recipientId, createdUserIds));
        await db.delete(operationTasks).where(and(eq(operationTasks.ticketType, 'SUPPORT'), inArray(operationTasks.ticketAssigneeId, createdUserIds)));

        await db
          .delete(eventLogs)
          .where(inArray(eventLogs.eventLogUserId, createdUserIds));
      }

      if (createdReportIds.length > 0) {
        await db
          .delete(reports)
          .where(and(eq(reports.ticketType, 'REPORT'), inArray(reports.ticketId, createdReportIds)));
      }

      if (createdUserIds.length > 0) {
        await db.delete(users).where(inArray(users.userId, createdUserIds));
      }
    } catch (cleanupError) {
      console.error("Cleanup warning:", cleanupError);
      process.exitCode = 1;
    }
  }
}

runOperationsTests();
