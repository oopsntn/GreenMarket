import { and, desc, eq, gt, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "../config/db";
import {
    eventLogs,
    transactions,
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
import { BOOST_POST_SLOT_PREFIX } from "../constants/promotion";

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
    userStatus: string | null;
    shopName: string | null;
    shopStatus: string | null;
    packageTitle: string | null;
    packagePrice: string | null;
    packageQuota: number | null;
    packageMaxPosts: number | null;
    slotCode: string | null;
    slotTitle: string | null;
    slotCapacity: number | null;
};

type LatestPaymentRecord = {
    transactionId: number;
    transactionReferenceId: number | null;
    transactionMeta: any;
    transactionAmount: string | null;
    transactionProvider: string | null;
    transactionProviderTxnId: string | null;
    transactionStatus: string | null;
    transactionCreatedAt: Date | null;
};

type PromotionLifecycleStatus =
    | "Scheduled"
    | "Active"
    | "Paused"
    | "Expired"
    | "Closed"
    | "Inactive";

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
    status: "Scheduled" | "Active" | "Paused" | "Completed" | "Expired" | "Inactive";
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
    status: "Scheduled" | "Active" | "Paused" | "Completed" | "Expired" | "Closed" | "Inactive";
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
    startDate?: string;
    endDate?: string;
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
        throw new Error("Ngày bắt đầu phải từ hôm nay trở đi.");
    }

    if (endAt.getTime() < startAt.getTime()) {
        throw new Error("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.");
    }

    const packageDuration = Math.max(Number(durationDays ?? 0), 1);
    const expectedEndAt = calculateExpectedEndAt(startAt, packageDuration);
    if (expectedEndAt.getTime() !== endAt.getTime()) {
        throw new Error(
            `Khoảng thời gian chạy phải đúng ${packageDuration} ngày theo gói đã chọn.`,
        );
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
    return latestPayment?.transactionStatus === "success"
        ? "Paid"
        : "Pending Verification";
};

const isPromotionOwnerInactive = (item: RawPromotionRow) =>
    (item.userStatus ?? "active").toLowerCase() !== "active" ||
    ((item.shopStatus ?? "active").toLowerCase() !== "active" &&
        item.shopStatus !== null);

const getLifecycleStatus = (
    item: RawPromotionRow,
): PromotionLifecycleStatus => {
    const rawStatus = (item.rawStatus ?? "").toLowerCase();
    const now = new Date();

    if (rawStatus === "closed") {
        return "Closed";
    }

    if (isPromotionOwnerInactive(item)) {
        return "Inactive";
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

const assertPromotionOwnerActive = (item: RawPromotionRow) => {
    if (getLifecycleStatus(item) === "Inactive") {
        throw new Error(
            "Tài khoản hoặc cửa hàng sở hữu đang bị khóa nên chiến dịch hiện phải ngừng hoạt động.",
        );
    }
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

    return (
        startA.getTime() <= endB.getTime() &&
        startB.getTime() <= endA.getTime()
    );
};

const shouldReserveSlot = (status: PromotionLifecycleStatus) =>
    status === "Scheduled" || status === "Active" || status === "Paused";

const assertSlotReservationAvailable = async (params: {
    promotionId?: number;
    slotId: number | null | undefined;
    slotCapacity: number | null | undefined;
    startAt: Date | null;
    endAt: Date | null;
    nextStatus?: PromotionLifecycleStatus;
}) => {
    const slotId = params.slotId ?? null;
    const slotCapacity = Math.max(0, Number(params.slotCapacity ?? 0));
    const nextStatus = params.nextStatus ?? "Active";

    if (!slotId || slotCapacity <= 0 || !shouldReserveSlot(nextStatus)) {
        return;
    }

    const records = await getPromotionRecords();
    const overlappingReservations = records.filter((item) => {
        if (item.slotId !== slotId) {
            return false;
        }

        if (
            params.promotionId &&
            item.promotionId === params.promotionId
        ) {
            return false;
        }

        const lifecycleStatus = getLifecycleStatus(item);
        if (!shouldReserveSlot(lifecycleStatus)) {
            return false;
        }

        return rangesOverlap(
            params.startAt,
            params.endAt,
            item.startAt,
            item.endAt,
        );
    });

    if (overlappingReservations.length + 1 > slotCapacity) {
        throw new Error(
            "Vị trí hiển thị đã kín lịch trong khoảng thời gian này. Vui lòng chọn gói, vị trí hoặc thời gian khác.",
        );
    }
};
const buildBlockedReason = (
    status: PromotionLifecycleStatus,
    paymentStatus: "Paid" | "Pending Verification",
    action: "pause" | "resume" | "reopen",
) => {
    if (status === "Inactive") {
        return "Chiến dịch đang ngừng hoạt động vì tài khoản hoặc cửa hàng sở hữu đã bị khóa.";
    }

    if (action === "pause") {
        if (status !== "Active") {
            return "Chỉ có thể tạm dừng chiến dịch quảng bá đang chạy.";
        }
        if (paymentStatus !== "Paid") {
            return "Chỉ có thể tạm dừng chiến dịch sau khi thanh toán đã được xác nhận.";
        }
        return undefined;
    }

    if (action === "resume") {
        if (status !== "Paused") {
            return "Chỉ có thể tiếp tục chiến dịch quảng bá đang tạm dừng.";
        }
        if (paymentStatus !== "Paid") {
            return "Chỉ có thể tiếp tục chiến dịch sau khi thanh toán đã được xác nhận.";
        }
        return undefined;
    }

    if (status !== "Expired") {
        return "Chỉ có thể mở lại các chiến dịch quảng bá đã hết hạn.";
    }
    if (paymentStatus !== "Paid") {
        return "Chỉ có thể mở lại chiến dịch sau khi thanh toán đã được xác nhận.";
    }
    return undefined;
};
const buildPromotionNote = (
    item: RawPromotionRow & { latestPayment: LatestPaymentRecord | null },
    promotionStatus: "Scheduled" | "Active" | "Paused" | "Completed" | "Expired" | "Inactive",
    paymentStatus: "Paid" | "Pending Verification",
) => {
    const lifecycleStatus = promotionStatus as PromotionLifecycleStatus;
    if (promotionStatus === "Inactive") {
        return "Chiến dịch quảng bá đang tự ngừng vì tài khoản hoặc cửa hàng sở hữu đã bị khóa/ngừng hoạt động.";
    }
    if (promotionStatus === "Paused") {
        return "Chiến dịch quảng bá đang tạm dừng và chờ admin tiếp tục.";
    }
    if (promotionStatus === "Scheduled") {
        return paymentStatus === "Paid"
            ? "Chiến dịch quảng bá đã xác nhận thanh toán và đang chờ tới thời gian bắt đầu."
            : "Chiến dịch quảng bá đang chờ xác minh thanh toán trước khi bắt đầu.";
    }
    if (promotionStatus === "Completed") {
        return "Chiến dịch đã dùng hết quota và hoàn tất trước khi hết thời gian chạy.";
    }
    if (promotionStatus === "Expired") {
        return "Chiến dịch quảng bá đã hết thời gian chạy và không còn hoạt động.";
    }
    if (lifecycleStatus === "Closed") {
        return "Chiến dịch quảng bá đã bị đóng và không còn hiển thị trên hệ thống.";
    }
    return `Chiến dịch quảng bá đang sử dụng vị trí hiển thị ${item.slotTitle ?? "không rõ"} với gói ${item.packageTitle ?? "không rõ tên"}.`;
};
const getPromotionStatus = (
    lifecycleStatus: PromotionLifecycleStatus,
    totalQuota: number,
    usedQuota: number,
): "Scheduled" | "Active" | "Paused" | "Completed" | "Expired" | "Inactive" => {
    if (lifecycleStatus === "Closed") {
        return "Expired";
    }

    if (lifecycleStatus === "Inactive") {
        return "Inactive";
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
        lifecycleStatus === "Closed" ||
        lifecycleStatus === "Inactive"
        ? "Admin"
        : "Manager";
};

const getOperatorName = (slot: "Home Top" | "Category Top" | "Search Boost") => {
    switch (slot) {
        case "Home Top":
            return "Nhóm vận hành A";
        case "Category Top":
            return "Nhóm vận hành B";
        default:
            return "Nhóm vận hành C";
    }
};
const getOperatorNameByScope = (scope: AdminPlacementSlotScope) => {
    switch (scope) {
        case "Homepage":
            return "Nhóm vận hành A";
        case "Category":
            return "Nhóm vận hành B";
        default:
            return "Nhóm vận hành C";
    }
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
): "Scheduled" | "Active" | "Paused" | "Completed" | "Expired" | "Closed" | "Inactive" => {
    if (lifecycleStatus === "Closed") {
        return "Closed";
    }

    if (lifecycleStatus === "Inactive") {
        return "Inactive";
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
    boostedStatus: "Scheduled" | "Active" | "Paused" | "Completed" | "Expired" | "Closed" | "Inactive",
    ctrRate: number,
    averageCtrRate: number,
): "Healthy" | "Watch" | "At Risk" => {
    if (boostedStatus === "Scheduled" || boostedStatus === "Paused") {
        return "Watch";
    }

    if (boostedStatus === "Closed" || boostedStatus === "Inactive") {
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
    boostedStatus: "Scheduled" | "Active" | "Paused" | "Completed" | "Expired" | "Closed" | "Inactive",
    reviewStatus: "Approved" | "Needs Update" | "Escalated",
) => {
    if (boostedStatus === "Inactive") {
        return "Chiến dịch đẩy bài đang tự ngừng vì tài khoản hoặc cửa hàng sở hữu đã bị khóa/ngừng hoạt động.";
    }

    if (boostedStatus === "Closed") {
        return "Chiến dịch đẩy bài đã bị đóng và không còn phân phối.";
    }

    if (boostedStatus === "Completed") {
        return "Chiến dịch đẩy bài đã hoàn tất sau khi dùng hết quota hiển thị.";
    }

    if (boostedStatus === "Expired") {
        return "Chiến dịch đẩy bài đã hết hạn và cần mở lại nếu muốn tiếp tục.";
    }

    if (boostedStatus === "Paused") {
        return "Chiến dịch đẩy bài đang tạm dừng và chờ admin tiếp tục.";
    }

    if (boostedStatus === "Scheduled") {
        if (reviewStatus === "Needs Update") {
            return "Chiến dịch đẩy bài đã lên lịch nhưng đang chờ cập nhật nội dung trước khi chạy.";
        }

        if (reviewStatus === "Escalated") {
            return "Chiến dịch đẩy bài đã lên lịch nhưng đang chờ admin xử lý thêm trước khi chạy.";
        }

        return "Chiến dịch đẩy bài đã lên lịch và đang chờ đến thời gian bắt đầu.";
    }

    if (reviewStatus === "Needs Update") {
        return "Chiến dịch đang chạy nhưng cần rà soát và cập nhật thêm nội dung bài đăng.";
    }

    if (reviewStatus === "Escalated") {
        return "Chiến dịch đang chạy nhưng đã được đẩy lên để admin theo dõi kỹ hơn.";
    }

    return "Chiến dịch đẩy bài đang được phân phối và theo dõi theo quota hiện tại.";
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
            userStatus: users.userStatus,
            shopName: shops.shopName,
            shopStatus: shops.shopStatus,
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
        .where(
            and(
                inArray(posts.categoryId, BONSAI_CATEGORY_IDS),
                sql`UPPER(${placementSlots.placementSlotCode}) LIKE ${`${BOOST_POST_SLOT_PREFIX}%`}`,
            ),
        )
        .orderBy(desc(postPromotions.postPromotionCreatedAt));
};

const getLatestPaymentsByPostId = async (
    postIds: number[],
): Promise<Map<number, LatestPaymentRecord>> => {
    const uniqueIds = new Set(postIds);
    const records = await db
        .select({
            transactionId: transactions.transactionId,
            transactionReferenceId: transactions.transactionReferenceId,
            transactionMeta: transactions.transactionMeta,
            transactionAmount: transactions.transactionAmount,
            transactionProvider: transactions.transactionProvider,
            transactionProviderTxnId: transactions.transactionProviderTxnId,
            transactionStatus: transactions.transactionStatus,
            transactionCreatedAt: transactions.transactionCreatedAt,
        })
        .from(transactions)
        .where(eq(transactions.transactionReferenceType, 'package'))
        .orderBy(desc(transactions.transactionCreatedAt));

    const latestByPostId = new Map<number, LatestPaymentRecord>();

    records.forEach((item) => {
        const meta = item.transactionMeta as any;
        const postId = meta?.postId;
        if (!postId || !uniqueIds.has(postId)) {
            return;
        }

        if (!latestByPostId.has(postId)) {
            latestByPostId.set(postId, item);
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
        warnings.push("Bài đăng chưa đủ điều kiện để tiếp tục quảng bá.");
    }
    if (!currentItem.packageTitle?.trim()) {
        warnings.push("Chiến dịch đang thiếu thông tin gói quảng bá hợp lệ.");
    }
    if (!currentItem.slotCode?.trim()) {
        warnings.push("Chiến dịch đang thiếu thông tin vị trí hiển thị hợp lệ.");
    }
    if (
        currentItem.startAt &&
        currentItem.endAt &&
        currentItem.endAt.getTime() < currentItem.startAt.getTime()
    ) {
        warnings.push("Khoảng thời gian chạy hiện tại không hợp lệ.");
    }

    const slotCapacity = Math.max(0, toNumber(currentItem.slotCapacity));
    if (slotCapacity > 0 && shouldReserveSlot(lifecycleStatus) && currentItem.slotId) {
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
            warnings.push("Vị trí hiển thị hiện có nguy cơ trùng lịch với chiến dịch khác trong cùng thời gian.");
        }
    }

    return warnings;
};
const logPromotionEvent = async (params: {
    eventType: string;
    userId: number;
    postId: number;
    slotId: number | null;
    actorName?: string | null;
    action: string;
    detail: string;
    targetName: string;
    result?: string;
}) => {
    await db.insert(eventLogs).values({
        eventLogUserId: params.userId,
        eventLogTargetType: "post",
        eventLogTargetId: params.postId,
        eventLogEventType: params.eventType,
        eventLogEventTime: new Date(),
        eventLogMeta: {
            postId: params.postId,
            detail: params.detail,
            performedBy: params.actorName?.trim() || "Quản trị viên hệ thống",
            actorRole: "Quản trị viên",
            result: params.result ?? "Thành công",
            moduleLabel: "Theo dõi quảng bá",
            targetType: "Chiến dịch quảng bá",
            targetName: params.targetName,
            slotId: params.slotId,
            action: params.action,
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
        budget: formatCurrencyLabel(item.latestPayment?.transactionAmount ?? item.packagePrice),
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
        .from(transactions)
        .where(and(
            eq(transactions.transactionReferenceType, 'package'),
            eq(sql<number>`(${transactions.transactionMeta}->>'postId')::int`, item.postId)
        ))
        .orderBy(desc(transactions.transactionCreatedAt))
        .limit(1);

    const nextPaymentStatus = paymentStatus === "Paid" ? "success" : "pending";
    const nextAmount = currentPrice?.price ? String(currentPrice.price) : "0";
    const nextPriceId = currentPrice?.priceId ?? null;

    if (latestPayment) {
        await db
            .update(transactions)
            .set({
                transactionReferenceId: packageRecord.promotionPackageId,
                transactionAmount: nextAmount,
                transactionStatus: nextPaymentStatus,
                transactionProvider: latestPayment.transactionProvider || "ADMIN_ADJUSTMENT",
                transactionMeta: { 
                    ...(latestPayment.transactionMeta as any),
                    priceId: nextPriceId,
                    postId: item.postId
                },
                transactionUpdatedAt: new Date()
            })
            .where(eq(transactions.transactionId, latestPayment.transactionId));

        return;
    }

    await db.insert(transactions).values({
        transactionUserId: item.buyerId,
        transactionType: "payment",
        transactionReferenceType: "package",
        transactionReferenceId: packageRecord.promotionPackageId,
        transactionAmount: nextAmount,
        transactionProvider: "ADMIN_ADJUSTMENT",
        transactionProviderTxnId: `ADMIN-${item.postId}-${Date.now()}`,
        transactionStatus: nextPaymentStatus,
        transactionMeta: { 
            postId: item.postId,
            priceId: nextPriceId 
        },
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

        assertPromotionOwnerActive(current);

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
            action:
                status === "Paused"
                    ? "Tạm dừng chiến dịch quảng bá"
                    : "Tiếp tục chiến dịch quảng bá",
            detail:
                status === "Paused"
                    ? `Chiến dịch quảng bá cho bài "${current.postTitle}" đã được tạm dừng.`
                    : `Chiến dịch quảng bá cho bài "${current.postTitle}" đã được tiếp tục.`,
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

        assertPromotionOwnerActive(current);

        if (getPaymentStatus(current.latestPayment) === "Paid") {
            throw new Error(
                "Đơn quảng bá đã thanh toán không thể đổi gói hoặc chỉnh lại thời gian chạy. Chỉ đơn chưa thanh toán mới được phép cập nhật các thông tin này.",
            );
        }

        const packageRecord = await ensurePromotionPackage(payload.packageId);
        if (!packageRecord) {
            throw new Error("Không tìm thấy gói quảng bá.");
        }

        const startAt = payload.startDate ? parseDateInput(payload.startDate) : null;
        const endAt = payload.endDate ? parseDateInput(payload.endDate) : null;
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
        const nextLifecycleStatus: PromotionLifecycleStatus =
            nextRawStatus === "paused"
                ? "Paused"
                : startAt!.getTime() > Date.now()
                  ? "Scheduled"
                  : "Active";

        await assertSlotReservationAvailable({
            promotionId,
            slotId: packageRecord.promotionPackageSlotId,
            slotCapacity: slotRecord.placementSlotCapacity,
            startAt,
            endAt,
            nextStatus: nextLifecycleStatus,
        });

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

        assertPromotionOwnerActive(current);

        const packageRecord = await ensurePromotionPackage(payload.packageId);
        if (!packageRecord) {
            throw new Error("Không tìm thấy gói quảng bá.");
        }

        const startAt = new Date();
        const endAt = calculateExpectedEndAt(
            startAt,
            Math.max(Number(packageRecord.promotionPackageDurationDays ?? 0), 1),
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

        await assertSlotReservationAvailable({
            promotionId,
            slotId: packageRecord.promotionPackageSlotId,
            slotCapacity: slotRecord.placementSlotCapacity,
            startAt,
            endAt,
            nextStatus: "Active",
        });

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

        await logPromotionEvent({
            eventType: "admin_promotion_reopened",
            userId: current.buyerId,
            postId: current.postId,
            slotId: packageRecord.promotionPackageSlotId,
            actorName,
            action: "Mở lại chiến dịch quảng bá",
            detail: `Chiến dịch quảng bá cho bài "${current.postTitle}" đã được mở lại ngay khi admin xác nhận với gói "${packageRecord.promotionPackageTitle ?? "Không rõ tên"}", hiệu lực đến ${formatDate(endAt)}.`,
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

        assertPromotionOwnerActive(current);

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
                    ? "Tạm dừng chiến dịch quảng bá"
                    : status === "Active"
                      ? "Tiếp tục chiến dịch quảng bá"
                      : "Đóng chiến dịch quảng bá",
            detail:
                status === "Closed"
                    ? `Chiến dịch quảng bá cho bài "${current.postTitle}" đã được đóng.`
                    : status === "Paused"
                      ? `Chiến dịch quảng bá cho bài "${current.postTitle}" đã được tạm dừng.`
                      : `Chiến dịch quảng bá cho bài "${current.postTitle}" đã được tiếp tục.`,
            targetName: current.postTitle,
        });

        return this.getBoostedPostById(promotionId);
    },
};
