import axios from "axios";
import jwt from "jsonwebtoken";
import { eq, inArray, and, sql } from "drizzle-orm";
import { db } from "../../config/db";
import {
  businessRoles,
  ledgers,
  taskReplies,
  tickets,
  transactions,
  users,
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
    baseURL: `${BASE_URL}/collaborator`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    validateStatus: () => true,
  });

const assertStatus = (actual: number, expected: number, step: string) => {
  if (actual !== expected) {
    throw new Error(`${step} failed: expected HTTP ${expected}, got ${actual}`);
  }
};

const makeMobile = () =>
  `09${Math.floor(Math.random() * 1_000_000_000)
    .toString()
    .padStart(9, "0")}`;

async function runCollaboratorTests() {
  console.log("--- Starting Test 08: Collaborator APIs (Refactored to Tickets) ---");

  const createdUserIds: number[] = [];
  const createdTicketIds: number[] = [];

  try {
    const roleRows = await db
      .select({
        roleId: businessRoles.businessRoleId,
        roleCode: businessRoles.businessRoleCode,
      })
      .from(businessRoles)
      .where(
        inArray(businessRoles.businessRoleCode, ["USER", "COLLABORATOR"]),
      );

    const roleByCode = new Map(
      roleRows.map((item) => [item.roleCode?.toUpperCase(), item.roleId]),
    );

    const userRoleId = roleByCode.get("USER");
    const collaboratorRoleId = roleByCode.get("COLLABORATOR");

    if (!userRoleId || !collaboratorRoleId) {
      throw new Error(
        "Required business roles USER/COLLABORATOR are missing in database.",
      );
    }

    const [customer] = await db
      .insert(users)
      .values({
        userMobile: makeMobile(),
        userDisplayName: "Collaborator Test Customer",
        userStatus: "active",
        userBusinessRoleId: userRoleId,
      })
      .returning();

    const [collaborator] = await db
      .insert(users)
      .values({
        userMobile: makeMobile(),
        userDisplayName: "Collaborator Test Worker A",
        userStatus: "active",
        userBusinessRoleId: collaboratorRoleId,
      })
      .returning();

    const [collaboratorB] = await db
      .insert(users)
      .values({
        userMobile: makeMobile(),
        userDisplayName: "Collaborator Test Worker B",
        userStatus: "active",
        userBusinessRoleId: collaboratorRoleId,
      })
      .returning();

    const [plainUser] = await db
      .insert(users)
      .values({
        userMobile: makeMobile(),
        userDisplayName: "Collaborator Test Plain User",
        userStatus: "active",
        userBusinessRoleId: userRoleId,
      })
      .returning();

    createdUserIds.push(
      customer.userId,
      collaborator.userId,
      collaboratorB.userId,
      plainUser.userId,
    );

    const now = new Date();
    const [openJob] = await db
      .insert(tickets)
      .values({
        ticketType: "JOB",
        ticketCreatorId: customer.userId,
        ticketTitle: "Open job for collaborator list",
        ticketContent: "Need photos for listing",
        ticketStatus: "open",
        ticketMetaData: {
            category: "Photo",
            location: "Hanoi",
            price: 650000,
            deadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            requirements: ["10 photos", "4:3 ratio"],
        } as any,
      })
      .returning();

    const [acceptedJob] = await db
      .insert(tickets)
      .values({
        ticketType: "JOB",
        ticketCreatorId: customer.userId,
        ticketAssigneeId: collaborator.userId,
        ticketTitle: "Accepted job for submit flow",
        ticketContent: "Write SEO content",
        ticketStatus: "accepted",
        ticketMetaData: {
            category: "Content",
            location: "Ha Nam",
            price: 800000,
            deadline: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
            requirements: ["At least 600 words"],
        } as any,
      })
      .returning();

    const [declineJob] = await db
      .insert(tickets)
      .values({
        ticketType: "JOB",
        ticketCreatorId: customer.userId,
        ticketTitle: "Open job for decline flow",
        ticketContent: "Job for decline test",
        ticketStatus: "open",
        ticketMetaData: {
            category: "Photo",
            location: "Bac Ninh",
            price: 550000,
            deadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            requirements: ["Test decline flow"],
        } as any,
      })
      .returning();

    const [raceJob] = await db
      .insert(tickets)
      .values({
        ticketType: "JOB",
        ticketCreatorId: customer.userId,
        ticketTitle: "Open job for race condition",
        ticketContent: "Concurrent accept should allow only one collaborator",
        ticketStatus: "open",
        ticketMetaData: {
            category: "Content",
            location: "Hai Duong",
            price: 700000,
            deadline: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
            requirements: ["Race condition test"],
        } as any,
      })
      .returning();

    createdTicketIds.push(openJob.ticketId, acceptedJob.ticketId, declineJob.ticketId, raceJob.ticketId);

    const collaboratorToken = makeUserToken(
      collaborator.userId,
      collaborator.userMobile,
      "COLLABORATOR",
    );
    const collaboratorBToken = makeUserToken(
      collaboratorB.userId,
      collaboratorB.userMobile,
      "COLLABORATOR",
    );
    const plainUserToken = makeUserToken(
      plainUser.userId,
      plainUser.userMobile,
      "USER",
    );

    const collaboratorClient = createClient(collaboratorToken);
    const collaboratorBClient = createClient(collaboratorBToken);
    const plainClient = createClient(plainUserToken);

    console.log("1) RBAC check...");
    const deniedRes = await plainClient.get("/jobs");
    assertStatus(deniedRes.status, 403, "Non-collaborator access");

    console.log("2) Collaborator profile and availability...");
    const profileRes = await collaboratorClient.get("/profile");
    assertStatus(profileRes.status, 200, "GET /profile");
    if (profileRes.data?.profile?.userId !== collaborator.userId) {
      throw new Error("GET /profile returned wrong collaborator profile.");
    }

    console.log("3) Available jobs listing...");
    const listRes = await collaboratorClient.get("/jobs", {
      params: { keyword: "open", page: 1, limit: 20 },
    });
    assertStatus(listRes.status, 200, "GET /jobs");
    if (!Array.isArray(listRes.data?.data)) {
      throw new Error("GET /jobs returned invalid payload.");
    }

    const listedJobIds = listRes.data.data.map((item: any) => item.jobId);
    if (!listedJobIds.includes(openJob.ticketId)) {
      throw new Error("Open job is missing from available jobs list.");
    }

    console.log("4) Contact customer...");
    const contactRes = await collaboratorClient.post(
      `/jobs/${openJob.ticketId}/contact`,
      {
        message: "Can you share exact preferred photo angles before I start?",
      },
    );
    assertStatus(contactRes.status, 201, "Contact customer");

    console.log("5) Accept open job...");
    const acceptRes = await collaboratorClient.post(
      `/jobs/${openJob.ticketId}/decision`,
      { decision: "accept" },
    );
    assertStatus(acceptRes.status, 200, "Accept job");

    const [openJobAfterAccept] = await db
      .select({
        status: tickets.ticketStatus,
        collaboratorId: tickets.ticketAssigneeId,
      })
      .from(tickets)
      .where(eq(tickets.ticketId, openJob.ticketId))
      .limit(1);

    if (
      openJobAfterAccept?.status !== "accepted" ||
      openJobAfterAccept.collaboratorId !== collaborator.userId
    ) {
      throw new Error("Accept flow did not update ticket status/collaborator.");
    }

    console.log("6) My jobs progress...");
    const myJobsRes = await collaboratorClient.get("/my-jobs", {
      params: { status: "accepted", page: 1, limit: 20 },
    });
    assertStatus(myJobsRes.status, 200, "GET /my-jobs");

    console.log("7) Concurrent accept race...");
    const [raceResA, raceResB] = await Promise.all([
      collaboratorClient.post(`/jobs/${raceJob.ticketId}/decision`, {
        decision: "accept",
      }),
      collaboratorBClient.post(`/jobs/${raceJob.ticketId}/decision`, {
        decision: "accept",
      }),
    ]);

    const raceStatuses = [raceResA.status, raceResB.status].sort((a, b) => a - b);
    if (raceStatuses[0] !== 200 || raceStatuses[1] !== 409) {
      throw new Error(
        `Concurrent accept expected [200,409], got [${raceStatuses[0]},${raceStatuses[1]}].`,
      );
    }

    console.log("8) Decline flow...");
    const declineRes = await collaboratorClient.post(
      `/jobs/${declineJob.ticketId}/decision`,
      { decision: "decline", reason: "Current workload is full" },
    );
    assertStatus(declineRes.status, 200, "Decline job");

    const [declineJobAfter] = await db
      .select({ status: tickets.ticketStatus })
      .from(tickets)
      .where(eq(tickets.ticketId, declineJob.ticketId))
      .limit(1);
    if (declineJobAfter?.status !== "declined") {
      throw new Error("Decline flow did not mark ticket as declined.");
    }

    console.log("9) Submit deliverables...");
    const submitRes = await collaboratorClient.post(
      `/jobs/${acceptedJob.ticketId}/deliverables`,
      {
        fileUrls: [
          "https://cdn.test/job-accepted/file-1.jpg",
          "https://cdn.test/job-accepted/result.zip",
        ],
        note: "Deliverables submitted for review",
      },
    );
    assertStatus(submitRes.status, 201, "Submit deliverables");

    const [acceptedJobAfterSubmit] = await db
      .select({ status: tickets.ticketStatus })
      .from(tickets)
      .where(eq(tickets.ticketId, acceptedJob.ticketId))
      .limit(1);
    if (acceptedJobAfterSubmit?.status !== "completed") {
      throw new Error("Submit flow did not mark ticket as completed.");
    }

    console.log("10) Earnings summary (External verification)...");
    const earningsRes = await collaboratorClient.get("/earnings");
    assertStatus(earningsRes.status, 200, "GET /earnings");
    // Earnings should be 0 from this job, as we removed auto-ledger entry
    if (Number(earningsRes.data?.total ?? 0) !== 0) {
        console.warn("⚠️ Warning: Earnings total is not 0. This might be due to existing data or logic leak.");
    }

    console.log("✅ Test 08 passed.");
  } catch (error: any) {
    console.error(
      "❌ Test 08 failed:",
      error?.response?.data || error?.message || error,
    );
    process.exitCode = 1;
  } finally {
    try {
      if (createdUserIds.length > 0) {
        await db
          .delete(transactions)
          .where(
            and(
              inArray(transactions.transactionUserId, createdUserIds),
              eq(transactions.transactionType, "payout")
            )
          );
        await db
          .delete(ledgers)
          .where(
            inArray(ledgers.ledgerUserId, createdUserIds),
          );
      }

      if (createdTicketIds.length > 0) {
        await db
          .delete(taskReplies)
          .where(inArray(taskReplies.ticketId, createdTicketIds));
        await db.delete(tickets).where(inArray(tickets.ticketId, createdTicketIds));
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

runCollaboratorTests();
