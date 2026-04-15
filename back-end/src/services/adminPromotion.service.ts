import { and, desc, eq, gt, inArray, isNull, lte, or } from "drizzle-orm";
import { db } from "../config/db.ts";
import {
    eventLogs,
    paymentTxn,
    placementSlots,
    postPromotions,
    posts,
    promotionPackagePrices,
    promotionPackages,
    shops,
    users,
} from "../models/schema/index.ts";
import {
    mapPlacementSlotLabel,
    mapPlacementSlotScope,
    type AdminPlacementSlotScope,
} from "./adminPlacementSlotCatalog.service.ts";

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
    paymentTxnPackageId: number | null;
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

const BONSAI_CATEGORY_IDS = [1, 11, 12, 13, 14, 15];

export type AdminPromotionResponse = {
    id: number;
    postId: number;
    postTitle: string;
    owner: string;
    packageId: number;
    slot: string;
    packageName: string;
    startDate: string;
    endDate: string;
    status: "Scheduled" | "Active" | "Paused" | "Completed" | "Expired";
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
    warnings: string[];
};

export type AdminBoostedPostResponse = {
    id: number;
    campaignCode: string;
    postTitle: string;
    ownerName: string;
    slot: string;
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

const getStartOfToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
};

const calculateExpectedEndAt = (startAt: Date, durationDays: number) => {
    const next = new Date(startAt);
    next.setDate(next.getDate() + Math.max(durationDays - 1, 0));
    return next;
};

const validatePromotionActionDates = (
    startAt: Date | null,
    endAt: Date | null,
    durationDays: number | null | undefined,
) => {
    if (!startAt || !endAt) {
        throw new Error("Vui lòng chọn ngày bắt đầu và ngày kết thúc.");
    }

    if (startAt.getTime() < getStartOfToday().getTime()) {
        throw new Error("Ngày bắt đầu phải từ ngày hiện tại trở đi.");
    }

    if (endAt.getTime() < startAt.getTime()) {
        throw new Error("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.");
    }

    const packageDuration = Math.max(Number(durationDays ?? 0), 1);
    const expectedEndAt = calculateExpectedEndAt(startAt, packageDuration);

    if (endAt.getTime() !== expectedEndAt.getTime()) {
        throw new Error(`Khoảng thời gian chạy phải đúng ${packageDuration} ngày theo gói đã chọn.`);
    }
};

const toNumber = (value: string | number | null | undefined) => {
    const numeric = Number(value ?? 0);
    return Number.isFinite(numeric) ? numeric : 0;
};

const formatCurrencyLabel = (value: string | number | null | undefined) => {
    const numeric = toNumber(value);
    return `${numeric.toLocaleString("en-US")} VND`;
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

const isPostEligibleForPromotion = (postStatus: string) =>
    postStatus.trim().toLowerCase() === "approved";

const rangesOverlap = (
    startA: Date | null,
    endA: Date | null,
    startB: Date | null,
    endB: Date | null,
 ) => {
    if (!startA || !endA || !startB || !endB) {
        return false;
    }

    return startA.getTime() <= endB.getTime() && startB.getTime() <= endA.getTime();
};

const shouldReserveSlot = (status: PromotionLifecycleStatus) =>
    status === "Scheduled" || status === "Active" || status === "Paused";

const buildBlockedReason = (
    status: PromotionLifecycleStatus,
    paymentStatus: "Paid" | "Pending Verification",
    action: "pause" | "resume" | "reopen",
) => {
    if (action === "pause") {
        if (status !== "Active") {
            return "Chỉ có thể tạm dừng chiến dịch đang chạy.";
        }

        if (paymentStatus !== "Paid") {
            return "Chỉ có thể tạm dừng khi thanh toán đã được xác nhận.";
        }

        return undefined;
    }

    if (action === "resume") {
        if (status !== "Paused") {
            return "Chỉ có thể tiếp tục chiến dịch đang tạm dừng.";
        }

        if (paymentStatus !== "Paid") {
            return "Chỉ có thể tiếp tục khi thanh toán đã được xác nhận.";
        }

        return undefined;
    }

    if (status !== "Expired") {
        return "Chỉ có thể mở lại chiến dịch đã hết hạn.";
    }

    if (paymentStatus !== "Paid") {
        return "Chỉ có thể mở lại sau khi thanh toán đã được xác nhận.";
    }

    return undefined;
};

const buildPromotionNote = (
    item: RawPromotionRow,
    promotionStatus: "Scheduled" | "Active" | "Paused" | "Completed" | "Expired",
    paymentStatus: "Paid" | "Pending Verification",
) => {
    const lifecycleStatus = promotionStatus as PromotionLifecycleStatus;

    if (promotionStatus === "Paused") {
        return "Chiến dịch đang tạm dừng và chưa phân phối lượt hiển thị.";
    }

    if (promotionStatus === "Scheduled") {
        return paymentStatus === "Paid"
            ? "Chiến dịch đã được lên lịch cho đợt hiển thị sắp tới."
            : "Chiến dịch đã lên lịch nhưng còn chờ xác nhận thanh toán.";
    }

    if (promotionStatus === "Completed") {
        return "Chi\u1ebfn d\u1ecbch \u0111\u00e3 d\u00f9ng h\u1ebft quota v\u00e0 ho\u00e0n t\u1ea5t tr\u01b0\u1edbc khi h\u1ebft th\u1eddi gian ch\u1ea1y.";
    }

    if (false && promotionStatus === "Completed") {
        return "Chiáº¿n dá»‹ch Ä‘Ã£ dÃ¹ng háº¿t quota vÃ  hoÃ n táº¥t trÆ°á»›c khi háº¿t thá»i gian cháº¡y.";
    }

    if (promotionStatus === "Expired") {
        return "Chiến dịch đã hết thời gian chạy và không còn hoạt động.";
    }

    if (lifecycleStatus === "Closed") {
        return "Chiến dịch đã bị đóng và được đưa ra khỏi hàng chờ phân phối.";
    }

    return `Chiến dịch đang sử dụng vị trí hiển thị của gói ${item.packageTitle ?? "đã chọn"}.`;
};

const getPromotionStatus = (
    lifecycleStatus: PromotionLifecycleStatus,
    totalQuota: number,
    usedQuota: number,
): "Scheduled" | "Active" | "Paused" | "Completed" | "Expired" => {
    if (lifecycleStatus === "Closed") {
        return "Expired";
    }

    if (lifecycleStatus === "Paused") {
        return "Paused";
    }

    if (lifecycleStatus === "Scheduled") {
        return "Scheduled";
    }

    if (usedQuota >= totalQuota) {
        return "Completed";
    }

    if (lifecycleStatus === "Expired") {
        return "Expired";
    }

    return "Active";
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
        return "Nhóm vận hành A";
    }

    if (slot === "Category Top") {
        return "Nhóm vận hành B";
    }

    return "Nhóm vận hành C";
};

const getOperatorNameByScope = (scope: AdminPlacementSlotScope) => {
    if (scope === "Homepage") {
        return "Ops Team A";
    }

    if (scope === "Category") {
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

    if (usedQuota >= totalQuota) {
        return "Completed";
    }

    if (lifecycleStatus === "Expired") {
        return "Expired";
    }

    return "Active";
};

const getCtrRate = (clicks: number, impressions: number) => {
    if (impressions <= 0) {
        return 0;
    }

    return clicks / impressions;
};

const getDeliveryHealth = (
    boostedStatus: "Scheduled" | "Active" | "Paused" | "Completed" | "Expired" | "Closed",
    ctrRate: number,
    averageCtrRate: number,
): "Healthy" | "Watch" | "At Risk" => {
    if (boostedStatus === "Scheduled" || boostedStatus === "Paused") {
        return "Watch";
    }

    if (boostedStatus === "Closed") {
        return "At Risk";
    }

    if (averageCtrRate <= 0) {
        return ctrRate > 0 ? "Healthy" : "Watch";
    }

    if (ctrRate < averageCtrRate * 0.75) {
        return "At Risk";
    }

    if (ctrRate < averageCtrRate * 0.95) {
        return "Watch";
    }

    return "Healthy";
};

const buildBoostedNotes = (
    boostedStatus: "Scheduled" | "Active" | "Paused" | "Completed" | "Expired" | "Closed",
    reviewStatus: "Approved" | "Needs Update" | "Escalated",
) => {
    if (boostedStatus === "Closed") {
        return "Chiến dịch đã bị quản trị viên đóng và được đưa ra khỏi hàng chờ phân phối.";
    }

    if (boostedStatus === "Completed") {
        return "Chiến dịch đã hoàn tất sau khi dùng hết quota hiển thị đã cấu hình.";
    }

    if (boostedStatus === "Expired") {
        return reviewStatus === "Escalated"
            ? "Chiến dịch đã hết hạn sau khi phát sinh cảnh báo kiểm duyệt hoặc bài đăng thay đổi khả năng hiển thị."
            : "Chiến dịch đã hết hạn trước khi dùng hết toàn bộ quota phân phối.";
    }

    if (boostedStatus === "Paused") {
        return "Chiến dịch đang tạm dừng trong lúc đội vận hành hoặc kiểm duyệt theo dõi thêm.";
    }

    if (boostedStatus === "Scheduled") {
        return "Chiến dịch đã vào lịch phân phối tiếp theo và đang chờ bàn giao cho vận hành.";
    }

    return "Chiến dịch đang phân phối lượt hiển thị đẩy nổi bật và được đội vận hành theo dõi.";
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
        .where(inArray(posts.categoryId, BONSAI_CATEGORY_IDS))
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

const buildPromotionWarnings = (
    currentItem: RawPromotionRow & { latestPayment: LatestPaymentRecord | null },
    allItems: Array<RawPromotionRow & { latestPayment: LatestPaymentRecord | null }>,
) => {
    const warnings: string[] = [];
    const lifecycleStatus = getLifecycleStatus(currentItem);

    if (!isPostEligibleForPromotion(currentItem.postStatus)) {
        warnings.push("Bài đăng chưa ở trạng thái được phép chạy quảng bá.");
    }

    if (!currentItem.packageTitle?.trim()) {
        warnings.push("Chiến dịch đang thiếu gói quảng bá hợp lệ.");
    }

    if (!currentItem.slotCode?.trim()) {
        warnings.push("Chiến dịch đang thiếu vị trí hiển thị hợp lệ.");
    }

    if (
        currentItem.startAt &&
        currentItem.endAt &&
        currentItem.endAt.getTime() < currentItem.startAt.getTime()
    ) {
        warnings.push("Khoảng thời gian chạy không hợp lệ.");
    }

    const slotCapacity = Math.max(0, toNumber(currentItem.slotCapacity));
    if (
        slotCapacity > 0 &&
        shouldReserveSlot(lifecycleStatus) &&
        currentItem.slotId
    ) {
        const overlappingCount = allItems.filter((item) => {
            if (item.promotionId === currentItem.promotionId || item.slotId !== currentItem.slotId) {
                return false;
            }

            const status = getLifecycleStatus(item);
            if (!shouldReserveSlot(status)) {
                return false;
            }

            return rangesOverlap(currentItem.startAt, currentItem.endAt, item.startAt, item.endAt);
        }).length;

        if (overlappingCount + 1 > slotCapacity) {
            warnings.push("Vị trí hiển thị đang vượt sức chứa trong khoảng thời gian này.");
        }
    }

    return warnings;
};

const logPromotionEvent = async (params: {
    eventType: string;
    userId: number | null;
    postId: number;
    slotId: number | null;
    actorName?: string | null;
    action: string;
    detail: string;
    result?: string;
    targetName: string;
}) => {
    await db.insert(eventLogs).values({
        eventLogUserId: params.userId,
        eventLogPostId: params.postId,
        eventLogSlotId: params.slotId,
        eventLogEventType: params.eventType,
        eventLogEventTime: new Date(),
        eventLogMeta: {
            action: params.action,
            detail: params.detail,
            performedBy: params.actorName?.trim() || "Quản trị viên hệ thống",
            actorRole: "Quản trị viên",
            result: params.result ?? "Thành công",
            moduleLabel: "Khuyến mãi",
            targetType: "Chiến dịch quảng bá",
            targetName: params.targetName,
        },
    });
};

const mapRecordToPromotion = (
    item: RawPromotionRow & { latestPayment: LatestPaymentRecord | null },
    allItems: Array<RawPromotionRow & { latestPayment: LatestPaymentRecord | null }>,
): AdminPromotionResponse => {
    const slot = mapPlacementSlotLabel(item.slotCode, item.slotTitle);
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
    const warnings = buildPromotionWarnings(item, allItems);
    const totalQuota = Math.max(
        1,
        toNumber(item.packageQuota) || toNumber(item.slotCapacity) || 1,
    );
    const elapsedRatio = getElapsedRatio(item.startAt, item.endAt);
    const usedQuota = getUsedQuota(totalQuota, lifecycleStatus, elapsedRatio);
    const promotionStatus = getPromotionStatus(
        lifecycleStatus,
        totalQuota,
        usedQuota,
    );

    return {
        id: item.promotionId,
        postId: item.postId,
        postTitle: item.postTitle,
        owner: getOwnerName(item),
        packageId: item.packageId,
        slot,
        packageName: item.packageTitle?.trim() || "Gói chưa xác định",
        startDate: formatDate(item.startAt),
        endDate: formatDate(item.endAt),
        status: promotionStatus,
        budget: formatCurrencyLabel(item.latestPayment?.paymentTxnAmount ?? item.packagePrice),
        note: buildPromotionNote(item, promotionStatus, paymentStatus),
        paymentStatus,
        handledBy: getHandledBy(lifecycleStatus),
        reopenEligible: !reopenBlockedReason,
        canPause: !pauseBlockedReason,
        canResume: !resumeBlockedReason,
        pauseBlockedReason,
        resumeBlockedReason,
        reopenBlockedReason,
        warnings,
    };
};

const mapRecordToBoostedPost = (
    item: RawPromotionRow & { latestPayment: LatestPaymentRecord | null },
): AdminBoostedPostResponse => {
    const slot = mapPlacementSlotLabel(item.slotCode, item.slotTitle);
    const slotScope = mapPlacementSlotScope(item.slotCode, item.slotTitle);
    const lifecycleStatus = getLifecycleStatus(item);
    const totalQuota = Math.max(
        1,
        toNumber(item.packageQuota) || toNumber(item.slotCapacity) || 1,
    );
    const elapsedRatio = getElapsedRatio(item.startAt, item.endAt);
    const usedQuota = getUsedQuota(totalQuota, lifecycleStatus, elapsedRatio);
    const boostedStatus = getBoostedStatus(lifecycleStatus, totalQuota, usedQuota);
    const reviewStatus = getReviewStatus(item.postStatus);
    const slotCode = (item.slotCode ?? "slot").replace(/[^a-z0-9]/gi, "").toUpperCase();
    const impressions = usedQuota;
    const ctrBase =
        slotScope === "Homepage" ? 0.029 : slotScope === "Category" ? 0.024 : 0.02;
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
        packageName: item.packageTitle?.trim() || "Gói chưa xác định",
        startDate: formatDate(item.startAt),
        endDate: formatDate(item.endAt),
        status: boostedStatus,
        deliveryHealth: "Watch",
        reviewStatus,
        assignedOperator: getOperatorNameByScope(slotScope),
        totalQuota,
        usedQuota,
        impressions,
        clicks,
        lastOptimizedAt: formatDateTime(item.postUpdatedAt ?? item.createdAt),
        notes: buildBoostedNotes(boostedStatus, reviewStatus),
    };
};

const applyBoostedPostDeliveryHealth = (
    posts: AdminBoostedPostResponse[],
): AdminBoostedPostResponse[] => {
    const averageCtrBySlot = new Map<string, number>();

    for (const slot of Array.from(new Set(posts.map((item) => item.slot)))) {
        const comparablePosts = posts.filter(
            (item) =>
                item.slot === slot &&
                item.impressions > 0 &&
                item.status !== "Scheduled" &&
                item.status !== "Paused",
        );

        const averageCtr =
            comparablePosts.length === 0
                ? 0
                : comparablePosts.reduce(
                    (sum, item) => sum + getCtrRate(item.clicks, item.impressions),
                    0,
                ) / comparablePosts.length;

        averageCtrBySlot.set(slot, averageCtr);
    }

    return posts.map((item) => ({
        ...item,
        deliveryHealth: getDeliveryHealth(
            item.status,
            getCtrRate(item.clicks, item.impressions),
            averageCtrBySlot.get(item.slot) ?? 0,
        ),
    }));
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
        return records.map((record) => mapRecordToPromotion(record, records));
    },

    async getPromotionById(promotionId: number): Promise<AdminPromotionResponse | null> {
        const record = await getPromotionRecordById(promotionId);
        if (!record) {
            return null;
        }

        const records = await getPromotionRecords();
        const refreshedRecord =
            records.find((item) => item.promotionId === promotionId) ?? record;

        return mapRecordToPromotion(refreshedRecord, records);
    },

    async updatePromotionStatus(
        promotionId: number,
        status: "Active" | "Paused",
        actorName?: string | null,
    ): Promise<AdminPromotionResponse | null> {
        const current = await getPromotionRecordById(promotionId);
        if (!current) {
            return null;
        }

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

        await logPromotionEvent({
            eventType: status === "Paused" ? "admin_promotion_paused" : "admin_promotion_resumed",
            userId: current.buyerId,
            postId: current.postId,
            slotId: current.slotId,
            actorName,
            action: status === "Paused" ? "Tạm dừng chiến dịch" : "Tiếp tục chiến dịch",
            detail:
                status === "Paused"
                    ? `Chiến dịch quảng bá cho bài "${current.postTitle}" đã được tạm dừng bởi quản trị viên.`
                    : `Chiến dịch quảng bá cho bài "${current.postTitle}" đã được tiếp tục bởi quản trị viên.`,
            targetName: current.postTitle,
        });

        return this.getPromotionById(promotionId);
    },

    async changePromotionPackage(
        promotionId: number,
        payload: PromotionActionPayload,
        actorName?: string | null,
    ): Promise<AdminPromotionResponse | null> {
        const current = await getPromotionRecordById(promotionId);
        if (!current) {
            return null;
        }

        if (getPaymentStatus(current.latestPayment) === "Paid") {
            throw new Error(
                "Đơn quảng bá đã thanh toán không thể đổi gói hoặc chỉnh lại thời gian chạy. Chỉ đơn chưa thanh toán mới được phép cập nhật các thông tin này.",
            );
        }

        const packageRecord = await ensurePromotionPackage(payload.packageId);
        if (!packageRecord) {
            throw new Error("Không tìm thấy gói quảng bá.");
        }

        const startAt = parseDateInput(payload.startDate);
        const endAt = parseDateInput(payload.endDate);
        validatePromotionActionDates(
            startAt,
            endAt,
            packageRecord.promotionPackageDurationDays,
        );

        if (!packageRecord.promotionPackagePublished) {
            throw new Error("Gói quảng bá đã chọn hiện không còn hoạt động.");
        }

        const [slotRecord] = await db
            .select()
            .from(placementSlots)
            .where(eq(placementSlots.placementSlotId, packageRecord.promotionPackageSlotId))
            .limit(1);

        if (!slotRecord?.placementSlotPublished) {
            throw new Error("Vị trí hiển thị của gói đang tạm tắt.");
        }

        if (!isPostEligibleForPromotion(current.postStatus)) {
            throw new Error("Bài đăng chưa đủ điều kiện để chạy quảng bá.");
        }

        const nextRawStatus = getPersistedStatus(
            startAt!,
            current.rawStatus?.toLowerCase() === "paused" ? "paused" : "active",
        );

        const [updated] = await db
            .update(postPromotions)
            .set({
                postPromotionPackageId: packageRecord.promotionPackageId,
                postPromotionSlotId: packageRecord.promotionPackageSlotId,
                postPromotionStartAt: startAt!,
                postPromotionEndAt: endAt!,
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

        await logPromotionEvent({
            eventType: "admin_promotion_package_changed",
            userId: current.buyerId,
            postId: current.postId,
            slotId: packageRecord.promotionPackageSlotId,
            actorName,
            action: "Đổi gói quảng bá",
            detail: `Chiến dịch quảng bá cho bài "${current.postTitle}" đã được đổi sang gói "${packageRecord.promotionPackageTitle ?? "Không rõ tên"}" từ ${payload.startDate} đến ${payload.endDate}.`,
            targetName: current.postTitle,
        });

        return this.getPromotionById(promotionId);
    },

    async reopenPromotion(
        promotionId: number,
        payload: PromotionActionPayload,
        actorName?: string | null,
    ): Promise<AdminPromotionResponse | null> {
        if (payload.paymentStatus !== "Paid") {
            throw new Error("Chỉ có thể mở lại sau khi thanh toán đã được xác nhận.");
        }

        const current = await getPromotionRecordById(promotionId);
        if (!current) {
            return null;
        }

        const packageRecord = await ensurePromotionPackage(payload.packageId);
        if (!packageRecord) {
            throw new Error("Không tìm thấy gói quảng bá.");
        }

        const startAt = parseDateInput(payload.startDate);
        const endAt = parseDateInput(payload.endDate);
        validatePromotionActionDates(
            startAt,
            endAt,
            packageRecord.promotionPackageDurationDays,
        );

        if (!packageRecord.promotionPackagePublished) {
            throw new Error("Gói quảng bá đã chọn hiện không còn hoạt động.");
        }

        const [slotRecord] = await db
            .select()
            .from(placementSlots)
            .where(eq(placementSlots.placementSlotId, packageRecord.promotionPackageSlotId))
            .limit(1);

        if (!slotRecord?.placementSlotPublished) {
            throw new Error("Vị trí hiển thị của gói đang tạm tắt.");
        }

        if (!isPostEligibleForPromotion(current.postStatus)) {
            throw new Error("Bài đăng chưa đủ điều kiện để chạy quảng bá.");
        }

        const [updated] = await db
            .update(postPromotions)
            .set({
                postPromotionPackageId: packageRecord.promotionPackageId,
                postPromotionSlotId: packageRecord.promotionPackageSlotId,
                postPromotionStartAt: startAt!,
                postPromotionEndAt: endAt!,
                postPromotionStatus: getPersistedStatus(startAt!, "active"),
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

        await logPromotionEvent({
            eventType: "admin_promotion_reopened",
            userId: current.buyerId,
            postId: current.postId,
            slotId: packageRecord.promotionPackageSlotId,
            actorName,
            action: "Mở lại chiến dịch quảng bá",
            detail: `Chiến dịch quảng bá cho bài "${current.postTitle}" đã được mở lại với gói "${packageRecord.promotionPackageTitle ?? "Không rõ tên"}" từ ${payload.startDate} đến ${payload.endDate}.`,
            targetName: current.postTitle,
        });

        return this.getPromotionById(promotionId);
    },

    async getBoostedPosts(): Promise<AdminBoostedPostResponse[]> {
        const records = await getPromotionRecords();
        return applyBoostedPostDeliveryHealth(records.map(mapRecordToBoostedPost));
    },

    async getBoostedPostById(
        promotionId: number,
    ): Promise<AdminBoostedPostResponse | null> {
        const record = await getPromotionRecordById(promotionId);
        if (!record) {
            return null;
        }

        const records = await getPromotionRecords();
        const refreshedRecords = records.map(mapRecordToBoostedPost);

        return (
            applyBoostedPostDeliveryHealth(refreshedRecords).find(
                (item) => item.id === promotionId,
            ) ?? null
        );
    },

    async updateBoostedPostStatus(
        promotionId: number,
        status: "Active" | "Paused" | "Closed",
        actorName?: string | null,
    ): Promise<AdminBoostedPostResponse | null> {
        const current = await getPromotionRecordById(promotionId);
        if (!current) {
            return null;
        }

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

        await logPromotionEvent({
            eventType:
                status === "Paused"
                    ? "admin_promotion_paused"
                    : status === "Active"
                        ? "admin_promotion_resumed"
                        : "admin_boosted_post_closed",
            userId: current.buyerId,
            postId: current.postId,
            slotId: current.slotId,
            actorName,
            action:
                status === "Paused"
                    ? "Tạm dừng chiến dịch"
                    : status === "Active"
                        ? "Tiếp tục chiến dịch"
                        : "Đóng chiến dịch",
            detail:
                status === "Closed"
                    ? `Chiến dịch quảng bá cho bài "${current.postTitle}" đã được đóng khỏi hàng chờ phân phối.`
                    : status === "Paused"
                        ? `Chiến dịch quảng bá cho bài "${current.postTitle}" đã được tạm dừng.`
                        : `Chiến dịch quảng bá cho bài "${current.postTitle}" đã được tiếp tục.`,
            targetName: current.postTitle,
        });

        return this.getBoostedPostById(promotionId);
    },
};
