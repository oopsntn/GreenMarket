import axios from "axios";
import jwt from "jsonwebtoken";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../config/db";
import {
  businessRoles,
  earnings,
  jobDeliverables,
  jobs,
  payoutRequests,
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
  console.log("--- Starting Test 08: Collaborator APIs ---");

  const createdUserIds: number[] = [];
  const createdJobIds: number[] = [];

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
      .insert(jobs)
      .values({
        jobCustomerId: customer.userId,
        jobTitle: "Open job for collaborator list",
        jobCategory: "Photo",
        jobLocation: "Hanoi",
        jobDeadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        jobPrice: "650000",
        jobDescription: "Need photos for listing",
        jobRequirements: ["10 photos", "4:3 ratio"],
        jobStatus: "open",
      })
      .returning();

    const [acceptedJob] = await db
      .insert(jobs)
      .values({
        jobCustomerId: customer.userId,
        jobCollaboratorId: collaborator.userId,
        jobTitle: "Accepted job for submit flow",
        jobCategory: "Content",
        jobLocation: "Ha Nam",
        jobDeadline: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        jobPrice: "800000",
        jobDescription: "Write SEO content",
        jobRequirements: ["At least 600 words"],
        jobStatus: "accepted",
      })
      .returning();

    const [declineJob] = await db
      .insert(jobs)
      .values({
        jobCustomerId: customer.userId,
        jobTitle: "Open job for decline flow",
        jobCategory: "Photo",
        jobLocation: "Bac Ninh",
        jobDeadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        jobPrice: "550000",
        jobDescription: "Job for decline test",
        jobRequirements: ["Test decline flow"],
        jobStatus: "open",
      })
      .returning();

    const [raceJob] = await db
      .insert(jobs)
      .values({
        jobCustomerId: customer.userId,
        jobTitle: "Open job for race condition",
        jobCategory: "Content",
        jobLocation: "Hai Duong",
        jobDeadline: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
        jobPrice: "700000",
        jobDescription: "Concurrent accept should allow only one collaborator",
        jobRequirements: ["Race condition test"],
        jobStatus: "open",
      })
      .returning();

    createdJobIds.push(openJob.jobId, acceptedJob.jobId, declineJob.jobId, raceJob.jobId);

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

    const updateAvailabilityRes = await collaboratorClient.patch("/profile", {
      availabilityStatus: "busy",
      availabilityNote: "Working on urgent onsite tasks",
    });
    assertStatus(updateAvailabilityRes.status, 200, "PATCH /profile");
    if (updateAvailabilityRes.data?.profile?.availabilityStatus !== "busy") {
      throw new Error("PATCH /profile did not update availability status.");
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
    if (!listedJobIds.includes(openJob.jobId)) {
      throw new Error("Open job is missing from available jobs list.");
    }
    if (listedJobIds.includes(acceptedJob.jobId)) {
      throw new Error("Accepted job should not appear in available jobs list.");
    }

    console.log("4) Contact customer...");
    const contactRes = await collaboratorClient.post(
      `/jobs/${openJob.jobId}/contact`,
      {
        message: "Can you share exact preferred photo angles before I start?",
      },
    );
    assertStatus(contactRes.status, 201, "Contact customer");
    if (!contactRes.data?.contactRequest?.contactRequestId) {
      throw new Error("Contact request payload is missing contactRequestId.");
    }

    console.log("5) Accept open job...");
    const acceptRes = await collaboratorClient.post(
      `/jobs/${openJob.jobId}/decision`,
      { decision: "accept" },
    );
    assertStatus(acceptRes.status, 200, "Accept job");

    const [openJobAfterAccept] = await db
      .select({
        status: jobs.jobStatus,
        collaboratorId: jobs.jobCollaboratorId,
      })
      .from(jobs)
      .where(eq(jobs.jobId, openJob.jobId))
      .limit(1);

    if (
      openJobAfterAccept?.status !== "accepted" ||
      openJobAfterAccept.collaboratorId !== collaborator.userId
    ) {
      throw new Error("Accept flow did not update job status/collaborator.");
    }

    console.log("6) My jobs progress...");
    const myJobsRes = await collaboratorClient.get("/my-jobs", {
      params: { status: "accepted", page: 1, limit: 20 },
    });
    assertStatus(myJobsRes.status, 200, "GET /my-jobs");
    const firstMyJob = myJobsRes.data?.data?.[0];
    if (
      firstMyJob &&
      typeof firstMyJob.progressPercent !== "number"
    ) {
      throw new Error("GET /my-jobs is missing progressPercent in payload.");
    }

    console.log("7) Concurrent accept race...");
    const [raceResA, raceResB] = await Promise.all([
      collaboratorClient.post(`/jobs/${raceJob.jobId}/decision`, {
        decision: "accept",
      }),
      collaboratorBClient.post(`/jobs/${raceJob.jobId}/decision`, {
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
      `/jobs/${declineJob.jobId}/decision`,
      { decision: "decline", reason: "Current workload is full" },
    );
    assertStatus(declineRes.status, 200, "Decline job");

    const [declineJobAfter] = await db
      .select({ status: jobs.jobStatus })
      .from(jobs)
      .where(eq(jobs.jobId, declineJob.jobId))
      .limit(1);
    if (declineJobAfter?.status !== "declined") {
      throw new Error("Decline flow did not mark job as declined.");
    }

    console.log("9) Submit deliverables...");
    const submitRes = await collaboratorClient.post(
      `/jobs/${acceptedJob.jobId}/deliverables`,
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
      .select({ status: jobs.jobStatus })
      .from(jobs)
      .where(eq(jobs.jobId, acceptedJob.jobId))
      .limit(1);
    if (acceptedJobAfterSubmit?.status !== "completed") {
      throw new Error("Submit flow did not mark job as completed.");
    }

    console.log("10) Earnings summary...");
    const earningsRes = await collaboratorClient.get("/earnings");
    assertStatus(earningsRes.status, 200, "GET /earnings");
    if (Number(earningsRes.data?.total ?? 0) < 800000) {
      throw new Error("Earnings summary total is lower than expected.");
    }

    console.log("11) Payout validations...");
    const lowPayoutRes = await collaboratorClient.post("/payout-requests", {
      amount: 100000,
      method: "Bank transfer",
    });
    assertStatus(lowPayoutRes.status, 400, "Low payout rejection");

    const payoutRes = await collaboratorClient.post("/payout-requests", {
      amount: 500000,
      method: "Bank transfer",
      note: "Test payout request",
    });
    assertStatus(payoutRes.status, 201, "Valid payout request");

    const overPayoutRes = await collaboratorClient.post("/payout-requests", {
      amount: 400000,
      method: "Bank transfer",
    });
    assertStatus(overPayoutRes.status, 400, "Over-balance payout rejection");

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
          .delete(payoutRequests)
          .where(
            inArray(payoutRequests.payoutRequestUserId, createdUserIds),
          );
        await db
          .delete(earnings)
          .where(
            inArray(earnings.userId, createdUserIds),
          );
      }

      if (createdJobIds.length > 0) {
        await db
          .delete(jobDeliverables)
          .where(inArray(jobDeliverables.deliverableJobId, createdJobIds));
        await db.delete(jobs).where(inArray(jobs.jobId, createdJobIds));
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
