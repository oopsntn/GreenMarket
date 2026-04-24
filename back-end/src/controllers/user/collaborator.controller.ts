import { Response } from "express";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
  sql,
  type SQL,
} from "drizzle-orm";
import { db } from "../../config/db.ts";
import { AuthRequest } from "../../dtos/auth.ts";
import {
  ledgers,
  taskReplies,
  tickets,
  transactions,
  shopCollaborators,
  shops,
  users,
  hostContents,
} from "../../models/schema/index.ts";
import { parseId } from "../../utils/parseId.ts";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MIN_PAYOUT_AMOUNT = 500_000;
const DEFAULT_AVAILABILITY_STATUS = "available";
const VALID_AVAILABILITY_STATUSES = ["available", "busy", "offline"] as const;
const VALID_JOB_STATUSES = ["open", "accepted", "declined", "completed", "cancelled"] as const;
const JOB_STATE_CHANGED_ERROR = "JOB_STATE_CHANGED";
const MAX_CONTACT_MESSAGE_LENGTH = 1000;
const DECLINE_REPLY_PREFIX = "[JOB_DECLINE]";

const JOB_PROGRESS_BY_STATUS: Record<(typeof VALID_JOB_STATUSES)[number], number> = {
  open: 0,
  accepted: 50,
  declined: 0,
  completed: 100,
  cancelled: 0,
};

const toPositiveInt = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
};

const parsePagination = (queryPage: unknown, queryLimit: unknown) => {
  const page = toPositiveInt(queryPage, DEFAULT_PAGE);
  const limit = Math.min(toPositiveInt(queryLimit, DEFAULT_LIMIT), MAX_LIMIT);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

const parseDateQuery = (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed;
};

const toNumber = (value: string | number | null | undefined) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getStringParam = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
};

const normalizeAvailabilityStatus = (value: unknown) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (
    !VALID_AVAILABILITY_STATUSES.includes(
      normalized as (typeof VALID_AVAILABILITY_STATUSES)[number],
    )
  ) {
    return null;
  }

  return normalized as (typeof VALID_AVAILABILITY_STATUSES)[number];
};

const getProgressPercent = (status: string | null | undefined) => {
  const normalized = (status ?? "").toLowerCase();
  if (normalized in JOB_PROGRESS_BY_STATUS) {
    return JOB_PROGRESS_BY_STATUS[normalized as keyof typeof JOB_PROGRESS_BY_STATUS];
  }

  return 0;
};

const getDeclinedCollaboratorIds = (meta: unknown) => {
  const raw =
    meta &&
    typeof meta === "object" &&
    Array.isArray((meta as Record<string, unknown>).declinedCollaboratorIds)
      ? ((meta as Record<string, unknown>).declinedCollaboratorIds as unknown[])
      : [];

  return raw
    .map((item: unknown) => Number(item))
    .filter((item: number) => Number.isInteger(item) && item > 0);
};

const calculateAvailableBalance = async (collaboratorId: number) => {
  const [earningSummary] = await db
    .select({
      total: sql<string>`COALESCE(SUM(CASE WHEN ${ledgers.ledgerDirection} = 'CREDIT' THEN ${ledgers.ledgerAmount} ELSE 0 END), 0)`,
    })
    .from(ledgers)
    .where(eq(ledgers.ledgerUserId, collaboratorId));

  const [payoutSummary] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${transactions.transactionAmount}), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.transactionUserId, collaboratorId),
        eq(transactions.transactionType, "payout"),
        inArray(transactions.transactionStatus, ["pending", "success"]),
      ),
    );

  return Math.max(
    Number((toNumber(earningSummary?.total) - toNumber(payoutSummary?.total)).toFixed(2)),
    0,
  );
};

export const getCollaboratorProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const [profile] = await db
      .select({
        userId: users.userId,
        mobile: users.userMobile,
        displayName: users.userDisplayName,
        avatarUrl: users.userAvatarUrl,
        email: users.userEmail,
        location: users.userLocation,
        bio: users.userBio,
        status: users.userStatus,
        availabilityStatus: users.userAvailabilityStatus,
        availabilityNote: users.userAvailabilityNote,
      })
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1);

    if (!profile) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const [jobSummary] = await db
      .select({
        totalJobs: sql<number>`COUNT(*)`,
        activeJobs: sql<number>`COALESCE(SUM(CASE WHEN ${tickets.ticketStatus} = 'accepted' THEN 1 ELSE 0 END), 0)`,
        completedJobs: sql<number>`COALESCE(SUM(CASE WHEN ${tickets.ticketStatus} = 'completed' THEN 1 ELSE 0 END), 0)`,
      })
      .from(tickets)
      .where(and(eq(tickets.ticketAssigneeId, userId), eq(tickets.ticketType, "JOB")));

    res.json({
      profile: {
        ...profile,
        availabilityStatus:
          profile.availabilityStatus ?? DEFAULT_AVAILABILITY_STATUS,
      },
      stats: {
        totalJobs: Number(jobSummary?.totalJobs ?? 0),
        activeJobs: Number(jobSummary?.activeJobs ?? 0),
        completedJobs: Number(jobSummary?.completedJobs ?? 0),
        totalEarnings: 0,
        availableBalance: 0,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateCollaboratorAvailability = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const availabilityStatus = normalizeAvailabilityStatus(
      req.body?.availabilityStatus,
    );
    if (availabilityStatus === null) {
      res.status(400).json({
        error: `availabilityStatus must be one of: ${VALID_AVAILABILITY_STATUSES.join(", ")}`,
      });
      return;
    }

    const availabilityNoteInput = req.body?.availabilityNote;
    if (
      availabilityNoteInput !== undefined &&
      availabilityNoteInput !== null &&
      typeof availabilityNoteInput !== "string"
    ) {
      res
        .status(400)
        .json({ error: "availabilityNote must be a string when provided" });
      return;
    }

    const availabilityNote =
      typeof availabilityNoteInput === "string"
        ? availabilityNoteInput.trim()
        : undefined;

    if (availabilityNote && availabilityNote.length > 500) {
      res
        .status(400)
        .json({ error: "availabilityNote must not exceed 500 characters" });
      return;
    }

    if (availabilityStatus === undefined && availabilityNote === undefined) {
      res.status(400).json({
        error: "At least one field is required: availabilityStatus, availabilityNote",
      });
      return;
    }

    const updatePayload: {
      userAvailabilityStatus?: (typeof VALID_AVAILABILITY_STATUSES)[number];
      userAvailabilityNote?: string | null;
      userUpdatedAt: Date;
    } = {
      userUpdatedAt: new Date(),
    };

    if (availabilityStatus !== undefined) {
      updatePayload.userAvailabilityStatus = availabilityStatus;
    }

    if (availabilityNote !== undefined) {
      updatePayload.userAvailabilityNote = availabilityNote || null;
    }

    const [updatedProfile] = await db
      .update(users)
      .set(updatePayload)
      .where(eq(users.userId, userId))
      .returning({
        userId: users.userId,
        availabilityStatus: users.userAvailabilityStatus,
        availabilityNote: users.userAvailabilityNote,
        updatedAt: users.userUpdatedAt,
      });

    if (!updatedProfile) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      message: "Availability updated successfully",
      profile: {
        ...updatedProfile,
        availabilityStatus:
          updatedProfile.availabilityStatus ?? DEFAULT_AVAILABILITY_STATUS,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAvailableJobs = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Chưa xác thực người dùng." });
      return;
    }

    const keyword =
      typeof req.query.keyword === "string" ? req.query.keyword.trim() : "";
    const category =
      typeof req.query.category === "string" ? req.query.category.trim() : "";
    const location =
      typeof req.query.location === "string" ? req.query.location.trim() : "";
    const { page, limit, offset } = parsePagination(req.query.page, req.query.limit);

    const conditions: SQL[] = [
      eq(tickets.ticketType, "JOB"),
      eq(tickets.ticketStatus, "open"),
      isNull(tickets.ticketAssigneeId),
      sql`NOT COALESCE(${tickets.ticketMetaData}->'declinedCollaboratorIds', '[]'::jsonb) @> ${JSON.stringify([userId])}::jsonb`,
    ];

    if (keyword) {
      conditions.push(
        sql`(${tickets.ticketTitle} ILIKE ${`%${keyword}%`} OR ${tickets.ticketContent} ILIKE ${`%${keyword}%`})`,
      );
    }

    if (category) {
      conditions.push(sql`${tickets.ticketMetaData}->>'category' ILIKE ${`%${category}%`}`);
    }

    if (location) {
      conditions.push(sql`${tickets.ticketMetaData}->>'location' ILIKE ${`%${location}%`}`);
    }

    const rows = await db
      .select({
        jobId: tickets.ticketId,
        title: tickets.ticketTitle,
        category: sql<string>`${tickets.ticketMetaData}->>'category'`,
        location: sql<string>`${tickets.ticketMetaData}->>'location'`,
        deadline: sql<string>`${tickets.ticketMetaData}->>'deadline'`,
        price: sql<string>`${tickets.ticketMetaData}->>'price'`,
        status: tickets.ticketStatus,
        createdAt: tickets.ticketCreatedAt,
        customerId: users.userId,
        customerName: users.userDisplayName,
        customerLocation: users.userLocation,
      })
      .from(tickets)
      .leftJoin(users, eq(tickets.ticketCreatorId, users.userId))
      .where(and(...conditions))
      .orderBy(sql`${tickets.ticketMetaData}->>'deadline' ASC`, desc(tickets.ticketCreatedAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tickets)
      .where(and(...conditions));

    const totalItems = Number(countResult?.count ?? 0);
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      data: rows.map((item) => ({
        jobId: item.jobId,
        title: item.title,
        category: item.category,
        location: item.location,
        deadline: item.deadline,
        price: item.price,
        status: item.status,
        createdAt: item.createdAt,
        customer: {
          userId: item.customerId,
          displayName: item.customerName,
          location: item.customerLocation,
        },
      })),
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getJobDetail = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const jobId = parseId(getStringParam(req.params.id));
    const userId = req.user?.id;

    if (!jobId || !userId) {
      res.status(400).json({ error: "Invalid job id" });
      return;
    }

    const [jobDetail] = await db
      .select({
        jobId: tickets.ticketId,
        customerId: tickets.ticketCreatorId,
        collaboratorId: tickets.ticketAssigneeId,
        title: tickets.ticketTitle,
        category: sql<string>`${tickets.ticketMetaData}->>'category'`,
        location: sql<string>`${tickets.ticketMetaData}->>'location'`,
        deadline: sql<string>`${tickets.ticketMetaData}->>'deadline'`,
        price: sql<string>`${tickets.ticketMetaData}->>'price'`,
        description: tickets.ticketContent,
        requirements: sql<any>`${tickets.ticketMetaData}->'requirements'`,
        meta: tickets.ticketMetaData,
        status: tickets.ticketStatus,
        declineReason: sql<string>`${tickets.ticketMetaData}->>'declineReason'`,
        createdAt: tickets.ticketCreatedAt,
        updatedAt: tickets.ticketUpdatedAt,
        customerName: users.userDisplayName,
        customerLocation: users.userLocation,
      })
      .from(tickets)
      .leftJoin(users, eq(tickets.ticketCreatorId, users.userId))
      .where(and(eq(tickets.ticketId, jobId), eq(tickets.ticketType, "JOB")))
      .limit(1);

    if (!jobDetail) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    const declinedCollaboratorIds = getDeclinedCollaboratorIds(jobDetail.meta);
    const hasDeclinedThisJob = declinedCollaboratorIds.includes(userId);
    const canView =
      (jobDetail.status === "open" && !hasDeclinedThisJob) ||
      jobDetail.collaboratorId === userId ||
      jobDetail.customerId === userId;

    if (!canView) {
      res.status(403).json({ error: "Access denied to this job detail" });
      return;
    }

    res.json({
      jobId: jobDetail.jobId,
      title: jobDetail.title,
      category: jobDetail.category,
      location: jobDetail.location,
      deadline: jobDetail.deadline,
      price: jobDetail.price,
      description: jobDetail.description,
      requirements: jobDetail.requirements ?? [],
      status: jobDetail.status,
      declineReason: jobDetail.declineReason,
      createdAt: jobDetail.createdAt,
      updatedAt: jobDetail.updatedAt,
      isAssignedToMe: jobDetail.collaboratorId === userId,
      customer: {
        userId: jobDetail.customerId,
        displayName: jobDetail.customerName,
        location: jobDetail.customerLocation,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const decideJob = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const jobId = parseId(getStringParam(req.params.id));
    const userId = req.user?.id;
    const decision =
      typeof req.body?.decision === "string"
        ? req.body.decision.trim().toLowerCase()
        : "";
    const reason =
      typeof req.body?.reason === "string" ? req.body.reason.trim() : null;

    if (!jobId || !userId) {
      res.status(400).json({ error: "Invalid job id" });
      return;
    }

    if (!["accept", "decline"].includes(decision)) {
      res.status(400).json({ error: "decision must be accept or decline" });
      return;
    }

    const now = new Date();

    if (decision === "accept") {
      const [updatedJob] = await db
        .update(tickets)
        .set({
          ticketStatus: "accepted",
          ticketAssigneeId: userId,
          ticketUpdatedAt: now,
        })
        .where(
          and(
            eq(tickets.ticketId, jobId),
            eq(tickets.ticketType, "JOB"),
            eq(tickets.ticketStatus, "open"),
            isNull(tickets.ticketAssigneeId),
          ),
        )
        .returning();

      if (!updatedJob) {
        const [existing] = await db
          .select({
            jobId: tickets.ticketId,
            status: tickets.ticketStatus,
            collaboratorId: tickets.ticketAssigneeId,
          })
          .from(tickets)
          .where(eq(tickets.ticketId, jobId))
          .limit(1);

        if (!existing) {
          res.status(404).json({ error: "Job not found" });
          return;
        }

        res
          .status(409)
          .json({ error: "Job is no longer open for acceptance", job: existing });
        return;
      }

      res.json({
        message: "Job accepted successfully",
        job: updatedJob,
      });
      return;
    }
    if (decision === "decline") {
      const [existing] = await db
        .select({
          jobId: tickets.ticketId,
          status: tickets.ticketStatus,
          collaboratorId: tickets.ticketAssigneeId,
          meta: tickets.ticketMetaData,
        })
        .from(tickets)
        .where(and(eq(tickets.ticketId, jobId), eq(tickets.ticketType, "JOB")))
        .limit(1);

      if (!existing) {
        res.status(404).json({ error: "Job not found" });
        return;
      }

      if (existing.status !== "open" || existing.collaboratorId !== null) {
        res.status(409).json({ error: "Job is no longer open for decision", job: existing });
        return;
      }

      const declinedCollaboratorIds = getDeclinedCollaboratorIds(existing.meta);
      if (declinedCollaboratorIds.includes(userId)) {
        res.status(409).json({
          error: "Bạn đã từ chối công việc này trước đó.",
        });
        return;
      }

      const newMeta = {
        ...(existing.meta as any),
        declinedCollaboratorIds: [...declinedCollaboratorIds, userId],
      };

      const [updatedJob] = await db
        .update(tickets)
        .set({
          ticketMetaData: newMeta,
          ticketUpdatedAt: now,
        })
        .where(eq(tickets.ticketId, jobId))
        .returning();

      await db.insert(taskReplies).values({
        ticketId: jobId,
        senderId: userId,
        message: `${DECLINE_REPLY_PREFIX} ${reason || "Cộng tác viên từ chối nhận công việc này."}`,
        visibility: "internal",
        createdAt: now,
      });

      res.json({
        message: "Đã ghi nhận từ chối. Công việc vẫn mở để khách hàng tìm cộng tác viên khác.",
        job: updatedJob,
      });
      return;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const contactJobCustomer = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const jobId = parseId(getStringParam(req.params.id));
    const message =
      typeof req.body?.message === "string" ? req.body.message.trim() : "";

    if (!userId || !jobId) {
      res.status(400).json({ error: "Invalid job id" });
      return;
    }

    if (!message) {
      res.status(400).json({ error: "message is required" });
      return;
    }

    if (message.length > MAX_CONTACT_MESSAGE_LENGTH) {
      res.status(400).json({
        error: `message must not exceed ${MAX_CONTACT_MESSAGE_LENGTH} characters`,
      });
      return;
    }

    const [jobDetail] = await db
      .select({
        jobId: tickets.ticketId,
        customerId: tickets.ticketCreatorId,
        collaboratorId: tickets.ticketAssigneeId,
        status: tickets.ticketStatus,
        customerName: users.userDisplayName,
        customerMobile: users.userMobile,
        customerEmail: users.userEmail,
      })
      .from(tickets)
      .leftJoin(users, eq(tickets.ticketCreatorId, users.userId))
      .where(and(eq(tickets.ticketId, jobId), eq(tickets.ticketType, "JOB")))
      .limit(1);

    if (!jobDetail) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    const canContact =
      jobDetail.status === "open" || jobDetail.collaboratorId === userId;

    if (!canContact) {
      res.status(403).json({ error: "Access denied to contact this customer" });
      return;
    }

    if (!jobDetail.customerId) {
      res.status(409).json({ error: "Job does not have a valid customer" });
      return;
    }

    const [contactRequest] = await db
      .insert(taskReplies)
      .values({
        ticketId: jobId,
        senderId: userId,
        message: message,
        visibility: "internal",
        createdAt: new Date(),
      })
      .returning();

    res.status(201).json({
      message: "Contact request sent successfully (via ticket replies)",
      contactRequest: {
        contactRequestId: contactRequest.replyId,
        ...contactRequest
      },
      customer: {
        userId: jobDetail.customerId,
        displayName: jobDetail.customerName,
        mobile: jobDetail.customerMobile,
        email: jobDetail.customerEmail,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMyJobs = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const statusFilter =
      typeof req.query.status === "string" ? req.query.status.trim() : "";
    if (
      statusFilter &&
      !VALID_JOB_STATUSES.includes(
        statusFilter.toLowerCase() as (typeof VALID_JOB_STATUSES)[number],
      )
    ) {
      res.status(400).json({
        error: `status must be one of: ${VALID_JOB_STATUSES.join(", ")}`,
      });
      return;
    }

    const { page, limit, offset } = parsePagination(req.query.page, req.query.limit);
    const status = statusFilter.toLowerCase();
    const conditions: SQL[] = [eq(tickets.ticketAssigneeId, userId), eq(tickets.ticketType, "JOB")];
    if (status) {
      conditions.push(eq(tickets.ticketStatus, status));
    }

    const rows = await db
      .select({
        jobId: tickets.ticketId,
        title: tickets.ticketTitle,
        category: sql<string>`${tickets.ticketMetaData}->>'category'`,
        location: sql<string>`${tickets.ticketMetaData}->>'location'`,
        deadline: sql<string>`${tickets.ticketMetaData}->>'deadline'`,
        price: sql<string>`${tickets.ticketMetaData}->>'price'`,
        status: tickets.ticketStatus,
        createdAt: tickets.ticketCreatedAt,
        customerName: users.userDisplayName,
      })
      .from(tickets)
      .leftJoin(users, eq(tickets.ticketCreatorId, users.userId))
      .where(and(...conditions))
      .orderBy(desc(tickets.ticketCreatedAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tickets)
      .where(and(...conditions));

    const totalItems = Number(countResult?.count ?? 0);
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      data: rows.map((item) => ({
        ...item,
        progressPercent: getProgressPercent(item.status),
      })),
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const submitJobDeliverables = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const jobId = parseId(getStringParam(req.params.id));

    if (!userId || !jobId) {
      res.status(400).json({ error: "Invalid job id" });
      return;
    }

    const fileUrls = Array.isArray(req.body?.fileUrls)
      ? req.body.fileUrls.filter(
        (item: unknown): item is string =>
          typeof item === "string" && item.trim().length > 0,
      )
      : [];
    const note = typeof req.body?.note === "string" ? req.body.note.trim() : null;

    if (fileUrls.length === 0) {
      res.status(400).json({ error: "fileUrls must contain at least one URL" });
      return;
    }

    const [jobDetail] = await db
      .select({
        jobId: tickets.ticketId,
        status: tickets.ticketStatus,
        price: sql<string>`${tickets.ticketMetaData}->>'price'`,
        customerId: tickets.ticketCreatorId,
      })
      .from(tickets)
      .where(and(eq(tickets.ticketId, jobId), eq(tickets.ticketAssigneeId, userId), eq(tickets.ticketType, "JOB")))
      .limit(1);

    if (!jobDetail) {
      res.status(404).json({ error: "Active job not found for this collaborator" });
      return;
    }

    if (jobDetail.status !== "accepted") {
      res.status(400).json({ error: "Only accepted jobs can have deliverables submitted" });
      return;
    }

    // 1. Update ticket status to completed
    await db
      .update(tickets)
      .set({
        ticketStatus: "completed",
        ticketUpdatedAt: new Date(),
        ticketResolvedAt: new Date(),
      })
      .where(eq(tickets.ticketId, jobId));

    // 2. Insert into taskReplies as the deliverable
    const [submission] = await db
      .insert(taskReplies)
      .values({
        ticketId: jobId,
        senderId: userId,
        message: note || "Work submitted.",
        attachments: fileUrls,
        visibility: "internal",
        createdAt: new Date(),
      })
      .returning();

    // 3. Removed auto-ledger insertion per requirement: 
    // "Collaborator đăng tin bán cây hộ chủ vườn, tiền nong thì tự thoả thuận với nhau ở bên ngoài"

    res.status(201).json({
      message: "Deliverables submitted and job marked as completed successfully",
      submission: {
        deliverableId: submission.replyId,
        ...submission
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getCollaboratorEarnings = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  void req;
  res.status(410).json({
    error:
      "GreenMarket không còn theo dõi thu nhập cộng tác viên trong hệ thống. Khách hàng và cộng tác viên tự liên hệ, thỏa thuận và thanh toán trực tiếp.",
  });
};

export const getPayoutRequestHistory = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  void req;
  res.status(410).json({
    error:
      "GreenMarket không còn hỗ trợ lịch sử yêu cầu chi trả cho cộng tác viên. Việc thanh toán được thực hiện trực tiếp ngoài hệ thống.",
  });
};

export const createPayoutRequest = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  void req;
  res.status(410).json({
    error:
      "GreenMarket không còn hỗ trợ tạo yêu cầu chi trả cho cộng tác viên. Khách hàng và cộng tác viên tự liên hệ để thanh toán trực tiếp ngoài hệ thống.",
  });
};


/**
 * Get a public directory of collaborators for Garden Owners to browse.
 * Masks contact info unless there is an active relationship.
 */
export const getPublicCollaborators = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { page, limit, offset } = parsePagination(req.query.page, req.query.limit);

    // 1. Get the requester's shop
    const [ownerShop] = await db
      .select({ shopId: shops.shopId })
      .from(shops)
      .where(eq(shops.shopId, userId))
      .limit(1);

    const shopId = ownerShop?.shopId || 0;

    // 2. Build conditions for public listing
    // Note: business_role_id 3 is COLLABORATOR
    const conditions: SQL[] = [eq(users.userBusinessRoleId, 3), eq(users.userStatus, "active")];

    const rows = await db
      .select({
        userId: users.userId,
        displayName: users.userDisplayName,
        avatarUrl: users.userAvatarUrl,
        bio: users.userBio,
        location: users.userLocation,
        availabilityStatus: users.userAvailabilityStatus,
        availabilityNote: users.userAvailabilityNote,
        // Masking logic: returns mobile/email only if status is 'active' with the requester's shop
        mobile: sql<string | null>`CASE WHEN ${shopCollaborators.shopCollaboratorsStatus} = 'active' THEN ${users.userMobile} ELSE NULL END`,
        email: sql<string | null>`CASE WHEN ${shopCollaborators.shopCollaboratorsStatus} = 'active' THEN ${users.userEmail} ELSE NULL END`,
        relationshipStatus: shopCollaborators.shopCollaboratorsStatus,
      })
      .from(users)
      .leftJoin(
        shopCollaborators,
        and(
          eq(users.userId, shopCollaborators.collaboratorId),
          eq(shopCollaborators.shopCollaboratorsShopId, shopId)
        )
      )
      .where(and(...conditions))
      .orderBy(desc(users.userCreatedAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(...conditions));

    const totalItems = Number(countResult?.count ?? 0);
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      data: rows,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get full public profile of a collaborator including portfolio and stats.
 */
export const getPublicCollaboratorDetail = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const requesterId = req.user?.id;
    const targetUserId = parseId(req.params.id as string);

    if (!requesterId || !targetUserId) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }

    // 1. Get basic profile
    const [profile] = await db
      .select({
        userId: users.userId,
        displayName: users.userDisplayName,
        avatarUrl: users.userAvatarUrl,
        bio: users.userBio,
        location: users.userLocation,
        availabilityStatus: users.userAvailabilityStatus,
        availabilityNote: users.userAvailabilityNote,
      })
      .from(users)
      .where(and(eq(users.userId, targetUserId), eq(users.userBusinessRoleId, 3)))
      .limit(1);

    if (!profile) {
      res.status(404).json({ error: "Collaborator not found" });
      return;
    }

    // 2. Get relationship with current requester's shop
    const [ownerShop] = await db
      .select({ shopId: shops.shopId })
      .from(shops)
      .where(eq(shops.shopId, requesterId))
      .limit(1);

    const shopId = ownerShop?.shopId || 0;
    console.log(`[getPublicCollaboratorDetail] Requester: ${requesterId}, Shop found: ${shopId}`);

    const [relationship] = await db
      .select({ status: shopCollaborators.shopCollaboratorsStatus })
      .from(shopCollaborators)
      .where(
        and(
          eq(shopCollaborators.collaboratorId, targetUserId),
          eq(shopCollaborators.shopCollaboratorsShopId, shopId)
        )
      )
      .limit(1);

    // 3. Get Statistics (wrapped in try-catch to be extra safe)
    let totalGardens = 0;
    let totalPosts = 0;
    try {
      const [gardenResult] = await db
        .select({ count: sql`count(distinct ${shopCollaborators.shopCollaboratorsShopId})` })
        .from(shopCollaborators)
        .where(and(eq(shopCollaborators.collaboratorId, targetUserId), eq(shopCollaborators.shopCollaboratorsStatus, "active")));
      totalGardens = Number(gardenResult?.count || 0);

      const [postResult] = await db
        .select({ count: sql`count(*)` })
        .from(hostContents)
        .where(and(eq(hostContents.hostContentAuthorId, targetUserId), eq(hostContents.hostContentStatus, "published")));
      totalPosts = Number(postResult?.count || 0);
    } catch (err) {
      console.error("Error fetching collaborator stats:", err);
    }

    // 4. Collect Portfolio Photos
    const portfolioPhotos: string[] = [];
    try {
      const deliverables = await db
        .select({
          urls: taskReplies.attachments,
        })
        .from(taskReplies)
        .innerJoin(tickets, eq(taskReplies.ticketId, tickets.ticketId))
        .where(
          and(
            eq(taskReplies.senderId, targetUserId),
            eq(tickets.ticketType, "JOB"),
            sql`${taskReplies.attachments} IS NOT NULL`,
            sql`${taskReplies.attachments}::text <> '[]'`
          )
        )
        .orderBy(desc(taskReplies.createdAt))
        .limit(10);

      const hostPhotos = await db
        .select({ urls: hostContents.hostContentMediaUrls })
        .from(hostContents)
        .where(and(eq(hostContents.hostContentAuthorId, targetUserId), eq(hostContents.hostContentStatus, "published")))
        .orderBy(desc(hostContents.hostContentCreatedAt))
        .limit(5);

      deliverables.forEach(d => {
        if (Array.isArray(d.urls)) {
          d.urls.forEach(url => {
            if (typeof url === 'string' && !portfolioPhotos.includes(url)) portfolioPhotos.push(url);
          });
        }
      });
      hostPhotos.forEach(p => {
        if (Array.isArray(p.urls)) {
          p.urls.forEach(url => {
            if (typeof url === 'string' && !portfolioPhotos.includes(url)) portfolioPhotos.push(url);
          });
        }
      });
    } catch (err) {
      console.error("Error fetching collaborator portfolio:", err);
    }

    // 5. Build final object (with masking if not active)
    const [maskCheck] = await db
      .select({
        mobile: users.userMobile,
        email: users.userEmail
      })
      .from(users)
      .where(eq(users.userId, targetUserId))
      .limit(1);

    const isContactVisible = relationship?.status === 'active';

    res.json({
      ...profile,
      mobile: isContactVisible ? maskCheck?.mobile : null,
      email: isContactVisible ? maskCheck?.email : null,
      relationshipStatus: relationship?.status || null,
      stats: {
        totalGardens,
        totalPosts,
      },
      portfolioPhotos: portfolioPhotos.slice(0, 15),
    });
  } catch (error) {
    console.error("Detailed error in getPublicCollaboratorDetail:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get pending collaborator invitations for the current CTV user.
 */
export const getMyInvitations = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const invitations = await db
      .select({
        invitationId: shopCollaborators.shopCollaboratorsId,
        status: shopCollaborators.shopCollaboratorsStatus,
        createdAt: shopCollaborators.shopCollaboratorsCreatedAt,
        shopId: shops.shopId,
        shopName: shops.shopName,
        shopLogoUrl: shops.shopLogoUrl,
        shopOwnerName: users.userDisplayName,
      })
      .from(shopCollaborators)
      .innerJoin(shops, eq(shopCollaborators.shopCollaboratorsShopId, shops.shopId))
      .innerJoin(users, eq(shops.shopId, users.userId))
      .where(
        and(
          eq(shopCollaborators.collaboratorId, userId),
          eq(shopCollaborators.shopCollaboratorsStatus, "pending")
        )
      )
      .orderBy(desc(shopCollaborators.shopCollaboratorsCreatedAt));

    res.json(invitations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Respond (accept/reject) to a shop invitation.
 */
export const respondToInvitation = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const invitationId = parseId(req.params.id as string);

    if (!req.body) {
      res.status(400).json({ error: "Request body is missing. Ensure you are sending JSON with Content-Type: application/json" });
      return;
    }

    const { action } = req.body; // 'accept' or 'reject'

    if (!userId || !invitationId) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }

    if (!["accept", "reject"].includes(action)) {
      res.status(400).json({ error: "Action must be 'accept' or 'reject'" });
      return;
    }

    const newStatus = action === "accept" ? "active" : "rejected";

    const [updated] = await db
      .update(shopCollaborators)
      .set({
        shopCollaboratorsStatus: newStatus,
        // In a real system we'd track updated at
      })
      .where(
        and(
          eq(shopCollaborators.shopCollaboratorsId, invitationId),
          eq(shopCollaborators.collaboratorId, userId),
          eq(shopCollaborators.shopCollaboratorsStatus, "pending")
        )
      )
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Invitation not found or no longer pending" });
      return;
    }

    res.json({ message: `Invitation ${action}ed successfully`, status: newStatus });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
