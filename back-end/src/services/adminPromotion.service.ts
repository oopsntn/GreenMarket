import { and, desc, eq, gt, isNull, lte, or } from "drizzle-orm";
import { db } from "../config/db.ts";
import {
    paymentTxn,
    placementSlots,
    postPromotions,
    posts,
    promotionPackagePrices,
    promotionPackages,
    shops,
    users,
} from "../models/schema/index.ts";

type RawPromotionRow = {
    promotionId: number;
    postId: number;
    buyerId: number;
    packageId: number;
    slotId: number;
    rawStatus: string | null;
    startAt: Date | null;
    endAt: Date | null;
    createdAt: Date | null;
    postTitle: string;
    postStatus: string;
    postUpdatedAt: Date | null;
    userDisplayName: string | null;
    shopName: string | null;
    packageTitle: string | null;
    packagePrice: string | null;
    packageQuota: number | null;
    packageMaxPosts: number | null;
    slotCode: string | null;
    slotTitle: string | null;
    slotCapacity: number | null;
};

type LatestPaymentRecord = {
    paymentTxnId: number;
    paymentTxnPostId: number | null;
    paymentTxnPackageId: number;
    paymentTxnAmount: string | null;
    paymentTxnProvider: string | null;
    paymentTxnProviderTxnId: string | null;
    paymentTxnStatus: string | null;
    paymentTxnCreatedAt: Date | null;
};

type PromotionLifecycleStatus =
    | "Scheduled"
    | "Active"
    | "Paused"
    | "Expired"
    | "Closed";

export type AdminPromotionResponse = {
    id: number;
    postTitle: string;
    owner: string;
    packageId: number;
    slot: "Home Top" | "Category Top" | "Search Boost";
    packageName: string;
    startDate: string;
    endDate: string;
    status: "Scheduled" | "Active" | "Paused" | "Expired";
    budget: string;
    note: string;
    paymentStatus: "Paid" | "Pending Verification";
    handledBy: "Manager" | "Admin";
    reopenEligible: boolean;
    canPause: boolean;
    canResume: boolean;
    pauseBlockedReason?: string;
    resumeBlockedReason?: string;
    reopenBlockedReason?: string;
};

export type AdminBoostedPostResponse = {
    id: number;
    campaignCode: string;
    postTitle: string;
    ownerName: string;
    slot: "Home Top" | "Category Top" | "Search Boost";
    packageName: string;
    startDate: string;
    endDate: string;
    status: "Scheduled" | "Active" | "Paused" | "Completed" | "Expired" | "Closed";
    deliveryHealth: "Healthy" | "Watch" | "At Risk";
    reviewStatus: "Approved" | "Needs Update" | "Escalated";
    assignedOperator: string;
    totalQuota: number;
    usedQuota: number;
    impressions: number;
    clicks: number;
    lastOptimizedAt: string;
    notes: string;
};

type PromotionActionPayload = {
    packageId: number;
    startDate: string;
    endDate: string;
    paymentStatus: "Paid" | "Pending Verification";
    adminNote?: string;
};

const pad = (value: number) => String(value).padStart(2, "0");

const formatDate = (value: Date | null) => {
    if (!value) {
        return "";
    }

    const parsed = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return "";
    }

    return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
};

const formatDateTime = (value: Date | null) => {
    if (!value) {
        return "";
    }

    const parsed = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return "";
    }

    return `${formatDate(parsed)} ${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
};

const parseDateInput = (value: string) => {
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toNumber = (value: string | number | null | undefined) => {
    const numeric = Number(value ?? 0);
    return Number.isFinite(numeric) ? numeric : 0;
};

const formatCurrencyLabel = (value: string | number | null | undefined) => {
    const numeric = toNumber(value);
    return `${numeric.toLocaleString("en-US")} VND`;
};

const mapSlotLabel = (
    slotCode: string | null,
    slotTitle: string | null,
): "Home Top" | "Category Top" | "Search Boost" => {
    const normalized = `${slotCode ?? ""} ${slotTitle ?? ""}`.toLowerCase();

    if (normalized.includes("search")) {
        return "Search Boost";
    }

    if (normalized.includes("category")) {
        return "Category Top";
    }

    return "Home Top";
};

const getOwnerName = (item: RawPromotionRow) => {
    const shopName = item.shopName?.trim();
    if (shopName) {
        return shopName;
    }

    const displayName = item.userDisplayName?.trim();
    if (displayName) {
        return displayName;
    }

    return `User #${item.buyerId}`;
};

const getPaymentStatus = (
    latestPayment: LatestPaymentRecord | null,
): "Paid" | "Pending Verification" => {
    return latestPayment?.paymentTxnStatus === "success"
        ? "Paid"
        : "Pending Verification";
};

const getLifecycleStatus = (
    item: RawPromotionRow,
): PromotionLifecycleStatus => {
    const rawStatus = (item.rawStatus ?? "").toLowerCase();
    const now = new Date();

    if (rawStatus === "closed") {
        return "Closed";
    }

    if (rawStatus === "paused") {
        return "Paused";
    }

    if (rawStatus === "expired") {
        return "Expired";
    }

    if (rawStatus === "scheduled") {
        return "Scheduled";
    }

    if (item.startAt && item.startAt.getTime() > now.getTime()) {
        return "Scheduled";
    }

    if (item.endAt && item.endAt.getTime() <= now.getTime()) {
        return "Expired";
    }

    return "Active";
};

const buildBlockedReason = (
    status: PromotionLifecycleStatus,
    paymentStatus: "Paid" | "Pending Verification",
    action: "pause" | "resume" | "reopen",
) => {
    if (action === "pause") {
        if (status !== "Active") {
            return "Only active promotions can be paused.";
        }

        if (paymentStatus !== "Paid") {
            return "Promotions with unverified payment cannot be paused yet.";
        }

        return undefined;
    }

    if (action === "resume") {
        if (status !== "Paused") {
            return "Only paused promotions can be resumed.";
        }

        if (paymentStatus !== "Paid") {
            return "Promotions with unverified payment cannot be resumed yet.";
        }

        return undefined;
    }

    if (status !== "Expired") {
        return "Only expired promotions can be reopened.";
    }

    if (paymentStatus !== "Paid") {
        return "Admin can reopen only after payment has been confirmed.";
    }

    return undefined;
};

const buildPromotionNote = (
    item: RawPromotionRow,
    lifecycleStatus: PromotionLifecycleStatus,
    paymentStatus: "Paid" | "Pending Verification",
) => {
    if (lifecycleStatus === "Paused") {
        return "Promotion was paused by admin while delivery is temporarily stopped.";
    }

    if (lifecycleStatus === "Scheduled") {
        return paymentStatus === "Paid"
            ? "Promotion is scheduled for the upcoming placement window."
            : "Promotion is scheduled and waiting for payment verification.";
    }

    if (lifecycleStatus === "Expired") {
        return "Promotion package completed its delivery window and is no longer active.";
    }

    if (lifecycleStatus === "Closed") {
        return "Campaign delivery was closed by admin and removed from the queue.";
    }

    return `Live promotion for ${item.packageTitle ?? "the selected package"} is currently consuming placement inventory.`;
};

const getHandledBy = (
    lifecycleStatus: PromotionLifecycleStatus,
): "Manager" | "Admin" => {
    return lifecycleStatus === "Paused" ||
        lifecycleStatus === "Scheduled" ||
        lifecycleStatus === "Closed"
        ? "Admin"
        : "Manager";
};

const getOperatorName = (slot: "Home Top" | "Category Top" | "Search Boost") => {
    if (slot === "Home Top") {
        return "Ops Team A";
    }

    if (slot === "Category Top") {
        return "Ops Team B";
    }

    return "Ops Team C";
};

const getReviewStatus = (
    postStatus: string,
): "Approved" | "Needs Update" | "Escalated" => {
    const normalized = postStatus.toLowerCase();

    if (normalized === "approved") {
        return "Approved";
    }

    if (normalized === "hidden" || normalized === "rejected") {
        return "Escalated";
    }

    return "Needs Update";
};

const getElapsedRatio = (startAt: Date | null, endAt: Date | null) => {
    if (!startAt || !endAt) {
        return 0;
    }

    const total = endAt.getTime() - startAt.getTime();
    if (total <= 0) {
        return 0;
    }

    const now = Date.now();
    const elapsed = now - startAt.getTime();
    return Math.min(Math.max(elapsed / total, 0), 1);
};

const getUsedQuota = (
    totalQuota: number,
    lifecycleStatus: PromotionLifecycleStatus,
    elapsedRatio: number,
) => {
    if (lifecycleStatus === "Scheduled") {
        return 0;
    }

    if (lifecycleStatus === "Paused") {
        return Math.min(totalQuota, Math.round(totalQuota * Math.max(0.3, elapsedRatio * 0.55)));
    }

    if (lifecycleStatus === "Closed") {
        return Math.min(totalQuota, Math.round(totalQuota * 0.65));
    }

    if (lifecycleStatus === "Expired") {
        return Math.min(totalQuota, Math.round(totalQuota * 0.82));
    }

    return Math.min(totalQuota, Math.max(1, Math.round(totalQuota * Math.max(0.18, elapsedRatio))));
};

const getBoostedStatus = (
    lifecycleStatus: PromotionLifecycleStatus,
    totalQuota: number,
    usedQuota: number,
): "Scheduled" | "Active" | "Paused" | "Completed" | "Expired" | "Closed" => {
    if (lifecycleStatus === "Closed") {
        return "Closed";
    }

    if (lifecycleStatus === "Paused") {
        return "Paused";
    }

    if (lifecycleStatus === "Scheduled") {
        return "Scheduled";
    }

    if (lifecycleStatus === "Expired") {
        return usedQuota >= totalQuota ? "Completed" : "Expired";
    }

    return "Active";
};

const getDeliveryHealth = (
    boostedStatus: "Scheduled" | "Active" | "Paused" | "Completed" | "Expired" | "Closed",
    totalQuota: number,
    usedQuota: number,
    elapsedRatio: number,
): "Healthy" | "Watch" | "At Risk" => {
    if (boostedStatus === "Completed") {
        return "Healthy";
    }

    if (boostedStatus === "Scheduled" || boostedStatus === "Paused") {
        return "Watch";
    }

    if (boostedStatus === "Closed" || boostedStatus === "Expired") {
        return "At Risk";
    }

    const expectedUsage = totalQuota * Math.max(0.2, elapsedRatio);
    if (usedQuota < expectedUsage * 0.7) {
        return "At Risk";
    }

    if (usedQuota < expectedUsage * 0.95) {
        return "Watch";
    }

    return "Healthy";
};

const buildBoostedNotes = (
    boostedStatus: "Scheduled" | "Active" | "Paused" | "Completed" | "Expired" | "Closed",
    reviewStatus: "Approved" | "Needs Update" | "Escalated",
) => {
    if (boostedStatus === "Closed") {
        return "Campaign was closed by admin and removed from the delivery queue.";
    }

    if (boostedStatus === "Completed") {
        return "Campaign completed after fully consuming the configured placement quota.";
    }

    if (boostedStatus === "Expired") {
        return reviewStatus === "Escalated"
            ? "Campaign expired after review escalation or post visibility changes."
            : "Campaign expired before using all of its delivery quota.";
    }

    if (boostedStatus === "Paused") {
        return "Campaign delivery is paused while operations or content review follow-up is in progress.";
    }

    if (boostedStatus === "Scheduled") {
        return "Campaign is queued for the next delivery window and waiting for operations handoff.";
    }

    return "Campaign is actively delivering boosted impressions under operations monitoring.";
};

const selectPromotionRows = async (): Promise<RawPromotionRow[]> => {
    const now = new Date();
    return db
        .select({
            promotionId: postPromotions.postPromotionId,
            postId: postPromotions.postPromotionPostId,
            buyerId: postPromotions.postPromotionBuyerId,
            packageId: postPromotions.postPromotionPackageId,
            slotId: postPromotions.postPromotionSlotId,
            rawStatus: postPromotions.postPromotionStatus,
            startAt: postPromotions.postPromotionStartAt,
            endAt: postPromotions.postPromotionEndAt,
            createdAt: postPromotions.postPromotionCreatedAt,
            postTitle: posts.postTitle,
            postStatus: posts.postStatus,
            postUpdatedAt: posts.postUpdatedAt,
            userDisplayName: users.userDisplayName,
            shopName: shops.shopName,
            packageTitle: promotionPackages.promotionPackageTitle,
            packagePrice: promotionPackagePrices.price,
            packageQuota: promotionPackages.promotionPackageDisplayQuota,
            packageMaxPosts: promotionPackages.promotionPackageMaxPosts,
            slotCode: placementSlots.placementSlotCode,
            slotTitle: placementSlots.placementSlotTitle,
            slotCapacity: placementSlots.placementSlotCapacity,
        })
        .from(postPromotions)
        .innerJoin(posts, eq(postPromotions.postPromotionPostId, posts.postId))
        .leftJoin(users, eq(posts.postAuthorId, users.userId))
        .leftJoin(shops, eq(posts.postShopId, shops.shopId))
        .leftJoin(
            promotionPackages,
            eq(postPromotions.postPromotionPackageId, promotionPackages.promotionPackageId),
        )
        .leftJoin(
            promotionPackagePrices,
            and(
                eq(
                    promotionPackagePrices.packageId,
                    postPromotions.postPromotionPackageId,
                ),
                lte(promotionPackagePrices.effectiveFrom, now),
                or(
                    isNull(promotionPackagePrices.effectiveTo),
                    gt(promotionPackagePrices.effectiveTo, now),
                ),
            ),
        )
        .leftJoin(
            placementSlots,
            eq(postPromotions.postPromotionSlotId, placementSlots.placementSlotId),
        )
        .orderBy(desc(postPromotions.postPromotionCreatedAt));
};

const getLatestPaymentsByPostId = async (
    postIds: number[],
): Promise<Map<number, LatestPaymentRecord>> => {
    const uniqueIds = new Set(postIds);
    const transactions = await db
        .select({
            paymentTxnId: paymentTxn.paymentTxnId,
            paymentTxnPostId: paymentTxn.paymentTxnPostId,
            paymentTxnPackageId: paymentTxn.paymentTxnPackageId,
            paymentTxnAmount: paymentTxn.paymentTxnAmount,
            paymentTxnProvider: paymentTxn.paymentTxnProvider,
            paymentTxnProviderTxnId: paymentTxn.paymentTxnProviderTxnId,
            paymentTxnStatus: paymentTxn.paymentTxnStatus,
            paymentTxnCreatedAt: paymentTxn.paymentTxnCreatedAt,
        })
        .from(paymentTxn)
        .orderBy(desc(paymentTxn.paymentTxnCreatedAt));

    const latestByPostId = new Map<number, LatestPaymentRecord>();

    transactions.forEach((item) => {
        if (!item.paymentTxnPostId || !uniqueIds.has(item.paymentTxnPostId)) {
            return;
        }

        if (!latestByPostId.has(item.paymentTxnPostId)) {
            latestByPostId.set(item.paymentTxnPostId, item);
        }
    });

    return latestByPostId;
};

const getPromotionRecords = async () => {
    const rows = await selectPromotionRows();
    const latestPaymentsByPostId = await getLatestPaymentsByPostId(
        rows.map((item) => item.postId),
    );

    return rows.map((item) => ({
        ...item,
        latestPayment: latestPaymentsByPostId.get(item.postId) ?? null,
    }));
};

const getPromotionRecordById = async (promotionId: number) => {
    const rows = await getPromotionRecords();
    return rows.find((item) => item.promotionId === promotionId) ?? null;
};

const mapRecordToPromotion = (
    item: RawPromotionRow & { latestPayment: LatestPaymentRecord | null },
): AdminPromotionResponse => {
    const slot = mapSlotLabel(item.slotCode, item.slotTitle);
    const paymentStatus = getPaymentStatus(item.latestPayment);
    const lifecycleStatus = getLifecycleStatus(item);
    const pauseBlockedReason = buildBlockedReason(
        lifecycleStatus,
        paymentStatus,
        "pause",
    );
    const resumeBlockedReason = buildBlockedReason(
        lifecycleStatus,
        paymentStatus,
        "resume",
    );
    const reopenBlockedReason = buildBlockedReason(
        lifecycleStatus,
        paymentStatus,
        "reopen",
    );

    return {
        id: item.promotionId,
        postTitle: item.postTitle,
        owner: getOwnerName(item),
        packageId: item.packageId,
        slot,
        packageName: item.packageTitle?.trim() || "Unknown Package",
        startDate: formatDate(item.startAt),
        endDate: formatDate(item.endAt),
        status: lifecycleStatus === "Closed" ? "Expired" : lifecycleStatus,
        budget: formatCurrencyLabel(item.latestPayment?.paymentTxnAmount ?? item.packagePrice),
        note: buildPromotionNote(item, lifecycleStatus, paymentStatus),
        paymentStatus,
        handledBy: getHandledBy(lifecycleStatus),
        reopenEligible: !reopenBlockedReason,
        canPause: !pauseBlockedReason,
        canResume: !resumeBlockedReason,
        pauseBlockedReason,
        resumeBlockedReason,
        reopenBlockedReason,
    };
};

const mapRecordToBoostedPost = (
    item: RawPromotionRow & { latestPayment: LatestPaymentRecord | null },
): AdminBoostedPostResponse => {
    const slot = mapSlotLabel(item.slotCode, item.slotTitle);
    const lifecycleStatus = getLifecycleStatus(item);
    const totalQuota = Math.max(
        1,
        toNumber(item.packageQuota) || toNumber(item.slotCapacity) || 1,
    );
    const elapsedRatio = getElapsedRatio(item.startAt, item.endAt);
    const usedQuota = getUsedQuota(totalQuota, lifecycleStatus, elapsedRatio);
    const boostedStatus = getBoostedStatus(lifecycleStatus, totalQuota, usedQuota);
    const reviewStatus = getReviewStatus(item.postStatus);
    const deliveryHealth = getDeliveryHealth(
        boostedStatus,
        totalQuota,
        usedQuota,
        elapsedRatio,
    );
    const slotCode = (item.slotCode ?? "slot").replace(/[^a-z0-9]/gi, "").toUpperCase();
    const impressions = usedQuota;
    const ctrBase = slot === "Home Top" ? 0.029 : slot === "Category Top" ? 0.024 : 0.02;
    const ctrMultiplier =
        boostedStatus === "Active"
            ? 1
            : boostedStatus === "Paused" || boostedStatus === "Scheduled"
                ? 0.85
                : boostedStatus === "Completed"
                    ? 1.05
                    : 0.72;
    const clicks = Math.round(impressions * ctrBase * ctrMultiplier);

    return {
        id: item.promotionId,
        campaignCode: `BST-${slotCode || "GEN"}-${String(item.promotionId).padStart(4, "0")}`,
        postTitle: item.postTitle,
        ownerName: getOwnerName(item),
        slot,
        packageName: item.packageTitle?.trim() || "Unknown Package",
        startDate: formatDate(item.startAt),
        endDate: formatDate(item.endAt),
        status: boostedStatus,
        deliveryHealth,
        reviewStatus,
        assignedOperator: getOperatorName(slot),
        totalQuota,
        usedQuota,
        impressions,
        clicks,
        lastOptimizedAt: formatDateTime(item.postUpdatedAt ?? item.createdAt),
        notes: buildBoostedNotes(boostedStatus, reviewStatus),
    };
};

const ensurePromotionPackage = async (packageId: number) => {
    const [pkg] = await db
        .select()
        .from(promotionPackages)
        .where(eq(promotionPackages.promotionPackageId, packageId))
        .limit(1);

    return pkg ?? null;
};

const getCurrentPackagePrice = async (packageId: number) => {
    const now = new Date();
    const [price] = await db
        .select({
            priceId: promotionPackagePrices.priceId,
            price: promotionPackagePrices.price,
        })
        .from(promotionPackagePrices)
        .where(
            and(
                eq(promotionPackagePrices.packageId, packageId),
                lte(promotionPackagePrices.effectiveFrom, now),
                or(
                    isNull(promotionPackagePrices.effectiveTo),
                    gt(promotionPackagePrices.effectiveTo, now),
                ),
            ),
        )
        .orderBy(desc(promotionPackagePrices.effectiveFrom), desc(promotionPackagePrices.priceId))
        .limit(1);

    return price ?? null;
};

const getPersistedStatus = (
    startAt: Date,
    baseStatus: "active" | "paused" | "closed",
) => {
    if (baseStatus === "paused" || baseStatus === "closed") {
        return baseStatus;
    }

    return startAt.getTime() > Date.now() ? "scheduled" : "active";
};

const upsertPromotionPaymentSnapshot = async (
    item: RawPromotionRow,
    packageRecord: typeof promotionPackages.$inferSelect,
    paymentStatus: "Paid" | "Pending Verification",
) => {
    const currentPrice = await getCurrentPackagePrice(
        packageRecord.promotionPackageId,
    );
    const [latestPayment] = await db
        .select()
        .from(paymentTxn)
        .where(eq(paymentTxn.paymentTxnPostId, item.postId))
        .orderBy(desc(paymentTxn.paymentTxnCreatedAt))
        .limit(1);

    const nextPaymentStatus = paymentStatus === "Paid" ? "success" : "pending";
    const nextAmount = currentPrice?.price ? String(currentPrice.price) : "0";
    const nextPriceId = currentPrice?.priceId ?? null;

    if (latestPayment) {
        await db
            .update(paymentTxn)
            .set({
                paymentTxnPackageId: packageRecord.promotionPackageId,
                paymentTxnPriceId: nextPriceId,
                paymentTxnAmount: nextAmount,
                paymentTxnStatus: nextPaymentStatus,
                paymentTxnProvider: latestPayment.paymentTxnProvider || "ADMIN_ADJUSTMENT",
            })
            .where(eq(paymentTxn.paymentTxnId, latestPayment.paymentTxnId));

        return;
    }

    await db.insert(paymentTxn).values({
        paymentTxnUserId: item.buyerId,
        paymentTxnPostId: item.postId,
        paymentTxnPackageId: packageRecord.promotionPackageId,
        paymentTxnPriceId: nextPriceId,
        paymentTxnAmount: nextAmount,
        paymentTxnProvider: "ADMIN_ADJUSTMENT",
        paymentTxnProviderTxnId: `ADMIN-${item.postId}-${Date.now()}`,
        paymentTxnStatus: nextPaymentStatus,
    });
};

export const adminPromotionService = {
    async getPromotions(): Promise<AdminPromotionResponse[]> {
        const records = await getPromotionRecords();
        return records.map(mapRecordToPromotion);
    },

    async getPromotionById(promotionId: number): Promise<AdminPromotionResponse | null> {
        const record = await getPromotionRecordById(promotionId);
        return record ? mapRecordToPromotion(record) : null;
    },

    async updatePromotionStatus(
        promotionId: number,
        status: "Active" | "Paused",
    ): Promise<AdminPromotionResponse | null> {
        const [updated] = await db
            .update(postPromotions)
            .set({
                postPromotionStatus: status === "Paused" ? "paused" : "active",
            })
            .where(eq(postPromotions.postPromotionId, promotionId))
            .returning({ id: postPromotions.postPromotionId });

        if (!updated) {
            return null;
        }

        return this.getPromotionById(promotionId);
    },

    async changePromotionPackage(
        promotionId: number,
        payload: PromotionActionPayload,
    ): Promise<AdminPromotionResponse | null> {
        const current = await getPromotionRecordById(promotionId);
        if (!current) {
            return null;
        }

        const packageRecord = await ensurePromotionPackage(payload.packageId);
        if (!packageRecord) {
            throw new Error("Promotion package not found.");
        }

        const startAt = parseDateInput(payload.startDate);
        const endAt = parseDateInput(payload.endDate);

        if (!startAt || !endAt) {
            throw new Error("Start date and end date are required.");
        }

        if (endAt.getTime() < startAt.getTime()) {
            throw new Error("End date must be on or after start date.");
        }

        const nextRawStatus = getPersistedStatus(
            startAt,
            current.rawStatus?.toLowerCase() === "paused" ? "paused" : "active",
        );

        const [updated] = await db
            .update(postPromotions)
            .set({
                postPromotionPackageId: packageRecord.promotionPackageId,
                postPromotionSlotId: packageRecord.promotionPackageSlotId,
                postPromotionStartAt: startAt,
                postPromotionEndAt: endAt,
                postPromotionStatus: nextRawStatus,
            })
            .where(eq(postPromotions.postPromotionId, promotionId))
            .returning({ id: postPromotions.postPromotionId });

        if (!updated) {
            return null;
        }

        await upsertPromotionPaymentSnapshot(
            current,
            packageRecord,
            payload.paymentStatus,
        );

        return this.getPromotionById(promotionId);
    },

    async reopenPromotion(
        promotionId: number,
        payload: PromotionActionPayload,
    ): Promise<AdminPromotionResponse | null> {
        if (payload.paymentStatus !== "Paid") {
            throw new Error("Promotion can be reopened only after payment is confirmed.");
        }

        const current = await getPromotionRecordById(promotionId);
        if (!current) {
            return null;
        }

        const packageRecord = await ensurePromotionPackage(payload.packageId);
        if (!packageRecord) {
            throw new Error("Promotion package not found.");
        }

        const startAt = parseDateInput(payload.startDate);
        const endAt = parseDateInput(payload.endDate);

        if (!startAt || !endAt) {
            throw new Error("Start date and end date are required.");
        }

        if (endAt.getTime() < startAt.getTime()) {
            throw new Error("End date must be on or after start date.");
        }

        const [updated] = await db
            .update(postPromotions)
            .set({
                postPromotionPackageId: packageRecord.promotionPackageId,
                postPromotionSlotId: packageRecord.promotionPackageSlotId,
                postPromotionStartAt: startAt,
                postPromotionEndAt: endAt,
                postPromotionStatus: getPersistedStatus(startAt, "active"),
            })
            .where(eq(postPromotions.postPromotionId, promotionId))
            .returning({ id: postPromotions.postPromotionId });

        if (!updated) {
            return null;
        }

        await upsertPromotionPaymentSnapshot(
            current,
            packageRecord,
            payload.paymentStatus,
        );

        return this.getPromotionById(promotionId);
    },

    async getBoostedPosts(): Promise<AdminBoostedPostResponse[]> {
        const records = await getPromotionRecords();
        return records.map(mapRecordToBoostedPost);
    },

    async getBoostedPostById(
        promotionId: number,
    ): Promise<AdminBoostedPostResponse | null> {
        const record = await getPromotionRecordById(promotionId);
        return record ? mapRecordToBoostedPost(record) : null;
    },

    async updateBoostedPostStatus(
        promotionId: number,
        status: "Active" | "Paused" | "Closed",
    ): Promise<AdminBoostedPostResponse | null> {
        const [updated] = await db
            .update(postPromotions)
            .set({
                postPromotionStatus:
                    status === "Paused"
                        ? "paused"
                        : status === "Closed"
                            ? "closed"
                            : "active",
            })
            .where(eq(postPromotions.postPromotionId, promotionId))
            .returning({ id: postPromotions.postPromotionId });

        if (!updated) {
            return null;
        }

        return this.getBoostedPostById(promotionId);
    },
};
