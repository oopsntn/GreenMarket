import {
  and,
  desc,
  eq,
  isNull,
  ilike,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { db } from "../config/db";
import {
  taskReplies,
  tickets,
  shopCollaborators,
  shops,
  users,
  hostContents,
} from "../models/schema/index.ts";

export const COLLABORATOR_ROLE_ID = 3;
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;
export const DEFAULT_AVAILABILITY_STATUS = "available";
export const VALID_AVAILABILITY_STATUSES = ["available", "busy", "offline"] as const;
export const VALID_JOB_STATUSES = ["open", "accepted", "declined", "completed", "cancelled"] as const;
export const MAX_CONTACT_MESSAGE_LENGTH = 1000;
export const DECLINE_REPLY_PREFIX = "[JOB_DECLINE]";

export const JOB_PROGRESS_BY_STATUS: Record<(typeof VALID_JOB_STATUSES)[number], number> = {
  open: 0,
  accepted: 50,
  declined: 0,
  completed: 100,
  cancelled: 0,
};

export interface TicketMetaData {
  category?: string;
  location?: string;
  deadline?: string;
  price?: string | number;
  requirements?: string[];
  declineReason?: string;
  declinedCollaboratorIds?: number[];
  [key: string]: unknown;
}

export interface PaginationParams {
  page?: unknown;
  limit?: unknown;
}

export interface CollaboratorSearchParams extends PaginationParams {
  keyword?: string;
  location?: string;
  status?: string;
}

export interface AvailableJobsParams extends PaginationParams {
  keyword?: string;
  category?: string;
  location?: string;
}

const toPositiveInt = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.floor(parsed);
};

export const parsePagination = (queryPage: unknown, queryLimit: unknown) => {
  const page = toPositiveInt(queryPage, DEFAULT_PAGE);
  const limit = Math.min(toPositiveInt(queryLimit, DEFAULT_LIMIT), MAX_LIMIT);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

export const normalizeAvailabilityStatus = (value: unknown) => {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (!VALID_AVAILABILITY_STATUSES.includes(normalized as (typeof VALID_AVAILABILITY_STATUSES)[number])) {
    return null;
  }
  return normalized as (typeof VALID_AVAILABILITY_STATUSES)[number];
};

const getProgressPercent = (status: string | null | undefined): number => {
  const normalized = (status ?? "").toLowerCase();
  if (normalized in JOB_PROGRESS_BY_STATUS) {
    return JOB_PROGRESS_BY_STATUS[normalized as keyof typeof JOB_PROGRESS_BY_STATUS];
  }
  return 0;
};

const getDeclinedCollaboratorIds = (meta: unknown): number[] => {
  const raw = meta && typeof meta === "object" && Array.isArray((meta as Record<string, unknown>).declinedCollaboratorIds)
    ? ((meta as Record<string, unknown>).declinedCollaboratorIds as unknown[])
    : [];
  return raw.map((item: unknown) => Number(item)).filter((item: number) => Number.isInteger(item) && item > 0);
};

export class CollaboratorService {
  static async getProfile(userId: number) {
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

    if (!profile) return null;

    const [jobSummary] = await db
      .select({
        totalJobs: sql<number>`COUNT(*)`,
        activeJobs: sql<number>`COALESCE(SUM(CASE WHEN ${tickets.ticketStatus} = 'accepted' THEN 1 ELSE 0 END), 0)`,
        completedJobs: sql<number>`COALESCE(SUM(CASE WHEN ${tickets.ticketStatus} = 'completed' THEN 1 ELSE 0 END), 0)`,
      })
      .from(tickets)
      .where(and(eq(tickets.ticketAssigneeId, userId), eq(tickets.ticketType, "JOB")));

    return {
      profile: {
        ...profile,
        availabilityStatus: profile.availabilityStatus ?? DEFAULT_AVAILABILITY_STATUS,
      },
      stats: {
        totalJobs: Number(jobSummary?.totalJobs ?? 0),
        activeJobs: Number(jobSummary?.activeJobs ?? 0),
        completedJobs: Number(jobSummary?.completedJobs ?? 0),
        totalEarnings: 0,
        availableBalance: 0,
      },
    };
  }

  static async updateAvailability(
    userId: number,
    availabilityStatus?: (typeof VALID_AVAILABILITY_STATUSES)[number],
    availabilityNote?: string | null
  ) {
    const updatePayload: {
      userAvailabilityStatus?: (typeof VALID_AVAILABILITY_STATUSES)[number];
      userAvailabilityNote?: string | null;
      userUpdatedAt: Date;
    } = {
      userUpdatedAt: new Date(),
    };

    if (availabilityStatus !== undefined) updatePayload.userAvailabilityStatus = availabilityStatus;
    if (availabilityNote !== undefined) updatePayload.userAvailabilityNote = availabilityNote || null;

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

    if (!updatedProfile) return null;

    return {
      ...updatedProfile,
      availabilityStatus: updatedProfile.availabilityStatus ?? DEFAULT_AVAILABILITY_STATUS,
    };
  }

  static async getAvailableJobs(userId: number, params: AvailableJobsParams) {
    const { keyword = "", category = "", location = "", page: rawPage, limit: rawLimit } = params;
    const { page, limit, offset } = parsePagination(rawPage, rawLimit);

    const conditions: SQL[] = [
      eq(tickets.ticketType, "JOB"),
      eq(tickets.ticketStatus, "open"),
      isNull(tickets.ticketAssigneeId),
      sql`NOT COALESCE(${tickets.ticketMetaData}->'declinedCollaboratorIds', '[]'::jsonb) @> ${JSON.stringify([userId])}::jsonb`,
    ];

    if (keyword) {
      conditions.push(sql`(${tickets.ticketTitle} ILIKE ${`%${keyword}%`} OR ${tickets.ticketContent} ILIKE ${`%${keyword}%`})`);
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

    return {
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
      meta: { page, limit, totalItems, totalPages },
    };
  }

  static async getJobDetail(userId: number, jobId: number) {
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
        requirements: sql<string[]>`${tickets.ticketMetaData}->'requirements'`,
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

    if (!jobDetail) return null;

    const declinedCollaboratorIds = getDeclinedCollaboratorIds(jobDetail.meta);
    const hasDeclinedThisJob = declinedCollaboratorIds.includes(userId);
    const canView = (jobDetail.status === "open" && !hasDeclinedThisJob) || jobDetail.collaboratorId === userId || jobDetail.customerId === userId;

    if (!canView) throw new Error("ACCESS_DENIED");

    return {
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
    };
  }

  static async acceptJob(userId: number, jobId: number) {
    const [updatedJob] = await db
      .update(tickets)
      .set({
        ticketStatus: "accepted",
        ticketAssigneeId: userId,
        ticketUpdatedAt: new Date(),
      })
      .where(
        and(
          eq(tickets.ticketId, jobId),
          eq(tickets.ticketType, "JOB"),
          eq(tickets.ticketStatus, "open"),
          isNull(tickets.ticketAssigneeId)
        )
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

      if (!existing) throw new Error("NOT_FOUND");
      throw Object.assign(new Error("CONFLICT"), { job: existing });
    }

    return updatedJob;
  }

  static async declineJob(userId: number, jobId: number, reason: string | null) {
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

    if (!existing) throw new Error("NOT_FOUND");
    if (existing.status !== "open" || existing.collaboratorId !== null) {
      throw Object.assign(new Error("CONFLICT"), { job: existing });
    }

    const declinedCollaboratorIds = getDeclinedCollaboratorIds(existing.meta);
    if (declinedCollaboratorIds.includes(userId)) {
      throw new Error("ALREADY_DECLINED");
    }

    const newMeta: TicketMetaData = {
      ...(existing.meta as TicketMetaData || {}),
      declinedCollaboratorIds: [...declinedCollaboratorIds, userId],
    };

    const now = new Date();
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

    return updatedJob;
  }

  static async contactCustomer(userId: number, jobId: number, message: string) {
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

    if (!jobDetail) throw new Error("NOT_FOUND");

    const canContact = jobDetail.status === "open" || jobDetail.collaboratorId === userId;
    if (!canContact) throw new Error("ACCESS_DENIED");
    if (!jobDetail.customerId) throw new Error("NO_CUSTOMER");

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

    return {
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
    };
  }

  static async getMyJobs(userId: number, statusFilter: string, params: PaginationParams) {
    const { page, limit, offset } = parsePagination(params.page, params.limit);
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

    return {
      data: rows.map((item) => ({
        ...item,
        progressPercent: getProgressPercent(item.status),
      })),
      meta: { page, limit, totalItems, totalPages },
    };
  }

  static async submitDeliverables(userId: number, jobId: number, fileUrls: string[], note: string | null) {
    const [jobDetail] = await db
      .select({
        jobId: tickets.ticketId,
        status: tickets.ticketStatus,
      })
      .from(tickets)
      .where(and(eq(tickets.ticketId, jobId), eq(tickets.ticketAssigneeId, userId), eq(tickets.ticketType, "JOB")))
      .limit(1);

    if (!jobDetail) throw new Error("NOT_FOUND");
    if (jobDetail.status !== "accepted") throw new Error("INVALID_STATUS");

    await db
      .update(tickets)
      .set({
        ticketStatus: "completed",
        ticketUpdatedAt: new Date(),
        ticketResolvedAt: new Date(),
      })
      .where(eq(tickets.ticketId, jobId));

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

    return submission;
  }

  static async getPublicCollaborators(requesterId: number, params: CollaboratorSearchParams) {
    const { page, limit, offset } = parsePagination(params.page, params.limit);
    const { keyword, location, status } = params;

    const [ownerShop] = await db
      .select({ shopId: shops.shopId })
      .from(shops)
      .where(eq(shops.shopId, requesterId))
      .limit(1);

    const shopId = ownerShop?.shopId || 0;
    const serverUrl = `${process.env.PROTOCOL || 'http'}://${process.env.IP || 'localhost'}:${process.env.PORT || 5000}`;
    const conditions: SQL[] = [eq(users.userBusinessRoleId, COLLABORATOR_ROLE_ID), eq(users.userStatus, "active")];

    if (keyword) {
      conditions.push(
        or(
          ilike(users.userDisplayName, `%${keyword}%`),
          ilike(users.userBio, `%${keyword}%`)
        ) as SQL
      );
    }

    if (location) {
      conditions.push(ilike(users.userLocation, `%${location}%`) as SQL);
    }

    if (status) {
      conditions.push(eq(users.userAvailabilityStatus, status) as SQL);
    }

    const rows = await db
      .select({
        userId: users.userId,
        displayName: users.userDisplayName,
        avatarUrl: users.userAvatarUrl,
        bio: users.userBio,
        location: users.userLocation,
        availabilityStatus: users.userAvailabilityStatus,
        availabilityNote: users.userAvailabilityNote,
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

    const formattedRows = rows.map(row => ({
      ...row,
      avatarUrl: row.avatarUrl?.startsWith('/uploads') ? `${serverUrl}${row.avatarUrl}` : row.avatarUrl
    }));

    return {
      data: formattedRows,
      meta: { page, limit, totalItems, totalPages },
    };
  }

  static async getPublicCollaboratorDetail(requesterId: number, targetUserId: number) {
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
      .where(and(eq(users.userId, targetUserId), eq(users.userBusinessRoleId, COLLABORATOR_ROLE_ID)))
      .limit(1);

    if (!profile) return null;

    const [ownerShop] = await db
      .select({ shopId: shops.shopId })
      .from(shops)
      .where(eq(shops.shopId, requesterId))
      .limit(1);

    const shopId = ownerShop?.shopId || 0;

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

    const portfolioPhotos: string[] = [];
    const serverUrl = `${process.env.PROTOCOL || 'http'}://${process.env.IP || 'localhost'}:${process.env.PORT || 5000}`;
    const isImage = (url: string) => /\.(jpg|jpeg|png|webp|gif|avif|heic)$/i.test(url);
    const formatUrl = (url: string) => url.startsWith('/uploads') ? `${serverUrl}${url}` : url;

    try {
      const deliverables = await db
        .select({ urls: taskReplies.attachments })
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
            if (typeof url === 'string' && isImage(url) && !portfolioPhotos.includes(formatUrl(url))) {
              portfolioPhotos.push(formatUrl(url));
            }
          });
        }
      });
      hostPhotos.forEach(p => {
        if (Array.isArray(p.urls)) {
          p.urls.forEach(url => {
            if (typeof url === 'string' && isImage(url) && !portfolioPhotos.includes(formatUrl(url))) {
              portfolioPhotos.push(formatUrl(url));
            }
          });
        }
      });
    } catch (err) {
      console.error("Error fetching collaborator portfolio:", err);
    }

    const [maskCheck] = await db
      .select({ mobile: users.userMobile, email: users.userEmail })
      .from(users)
      .where(eq(users.userId, targetUserId))
      .limit(1);

    const isContactVisible = relationship?.status === 'active';

    return {
      ...profile,
      mobile: isContactVisible ? maskCheck?.mobile : null,
      email: isContactVisible ? maskCheck?.email : null,
      avatarUrl: profile.avatarUrl?.startsWith('/uploads') ? `${serverUrl}${profile.avatarUrl}` : profile.avatarUrl,
      stats: {
        totalGardens: totalGardens,
        totalPosts: totalPosts,
      },
      relationshipStatus: relationship?.status || null,
      portfolioPhotos: portfolioPhotos.slice(0, 15),
    };
  }

  static async getMyInvitations(userId: number) {
    return db
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
  }

  static async respondToInvitation(userId: number, invitationId: number, action: "accept" | "reject") {
    const newStatus = action === "accept" ? "active" : "rejected";

    const [updated] = await db
      .update(shopCollaborators)
      .set({ shopCollaboratorsStatus: newStatus })
      .where(
        and(
          eq(shopCollaborators.shopCollaboratorsId, invitationId),
          eq(shopCollaborators.collaboratorId, userId),
          eq(shopCollaborators.shopCollaboratorsStatus, "pending")
        )
      )
      .returning();

    if (!updated) throw new Error("NOT_FOUND");
    return newStatus;
  }

  static async getMyActiveShops(userId: number) {
    return db
      .select({
        shopId: shops.shopId,
        shopName: shops.shopName,
        shopLogoUrl: shops.shopLogoUrl,
        shopLocation: shops.shopLocation,
        ownerDisplayName: users.userDisplayName,
        joinedAt: shopCollaborators.shopCollaboratorsCreatedAt,
      })
      .from(shopCollaborators)
      .innerJoin(shops, eq(shopCollaborators.shopCollaboratorsShopId, shops.shopId))
      .leftJoin(users, eq(shops.shopId, users.userId))
      .where(
        and(
          eq(shopCollaborators.collaboratorId, userId),
          eq(shopCollaborators.shopCollaboratorsStatus, "active"),
        ),
      )
      .orderBy(desc(shopCollaborators.shopCollaboratorsCreatedAt));
  }
}
