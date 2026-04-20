import { and, desc, eq, sql } from "drizzle-orm";
import ExcelJS from "exceljs";
import { db } from "../config/db.ts";
import {
    PERSONAL_PLAN_SLOT_CODE,
    SHOP_REGISTRATION_SLOT_CODE,
    SHOP_VIP_SLOT_CODE,
    isBoostPostSlotCode,
} from "../constants/promotion.ts";
import {
    attributes,
    categories,
    categoryAttributes,
    businessRoles,
    eventLogs,
    paymentTxn,
    payoutRequests,
    promotionPackagePrices,
    posts,
    promotionPackages,
    reports,
    shops,
    users,
} from "../models/schema/index.ts";
import { adminAccountPackageService } from "./adminAccountPackage.service.ts";
import {
    adminPlacementSlotCatalogService,
    type AdminPlacementSlotCatalogItem,
} from "./adminPlacementSlotCatalog.service.ts";
import { adminPromotionService } from "./adminPromotion.service.ts";

type DateRange = {
    from: Date | null;
    to: Date | null;
};

type DashboardStatCard = {
    title: string;
    value: string;
    note?: string;
};

type DashboardAlert = {
    id: string;
    level: "critical" | "warning" | "info";
    title: string;
    detail: string;
};

type DashboardSummary = {
    title: string;
    description: string;
};

type AnalyticsKpiCard = {
    title: string;
    value: string;
    change: string;
};

type TopPlacement = {
    id: number;
    slot: string;
    impressions: string;
    clicks: string;
    ctr: string;
    revenue: string;
};

type AnalyticsDailyTrafficSlot = {
    slot: string;
    impressions: number;
};

type AnalyticsDailyTrafficPoint = {
    date: string;
    slots: AnalyticsDailyTrafficSlot[];
};

type ReportingSlotCatalogItem = AdminPlacementSlotCatalogItem;

type RevenueCard = {
    title: string;
    value: string;
    note: string;
};

type RevenueRow = {
    id: number;
    packageName: string;
    slot: string;
    orders: number;
    revenue: string;
};

type CustomerSpendingCard = {
    title: string;
    value: string;
    note: string;
};

type CustomerSpendingRow = {
    id: number;
    customerName: string;
    email: string;
    totalOrders: number;
    totalSpent: string;
    avgOrderValue: string;
    lastPurchase: string;
};

type ExportHistoryItem = {
    id: number;
    reportName: string;
    type: "General" | "Financial";
    format: "CSV" | "XLSX";
    generatedBy: string;
    date: string;
    status: "Completed" | "In Progress";
};

type ExportPayload = {
    fromDate?: string;
    toDate?: string;
    format: "CSV" | "XLSX";
};

type GeneralExportPayload = ExportPayload & {
    module: "Users" | "Categories" | "Attributes" | "Templates" | "Promotions" | "Analytics";
    generatedBy: string;
};

type FinancialExportPayload = ExportPayload & {
    reportType: "Revenue Summary" | "Customer Spending Report" | "Promotion Performance";
    generatedBy: string;
};

type ExportFileResult = {
    historyItem: ExportHistoryItem;
    fileName: string;
    mimeType: string;
    content: string;
    contentEncoding: "utf-8" | "base64";
};

type ExportColumn = {
    key: string;
    header: string;
    width?: number;
};

type AnalyticsSummaryResponse = {
    kpiCards: AnalyticsKpiCard[];
    topPlacements: TopPlacement[];
    dailyTraffic: AnalyticsDailyTrafficPoint[];
    slotCatalog: ReportingSlotCatalogItem[];
};

type DashboardOverviewResponse = {
    statCards: DashboardStatCard[];
    alerts: DashboardAlert[];
    summary: DashboardSummary;
};

type RevenueSummaryResponse = {
    summaryCards: RevenueCard[];
    rows: RevenueRow[];
    slotCatalog: ReportingSlotCatalogItem[];
};

type PaymentOrder = {
    paymentTxnId: number;
    userId: number;
    customerName: string;
    email: string;
    packageName: string;
    slot: string;
    slotCode: string | null;
    amount: number;
    createdAt: Date | null;
};

type HostPayoutOrder = {
    payoutRequestId: number;
    userId: number;
    amount: number;
    processedAt: Date | null;
};

const parseDateRange = (fromDate?: string, toDate?: string): DateRange => {
    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
    const to = toDate ? new Date(`${toDate}T23:59:59.999`) : null;

    return {
        from: from && !Number.isNaN(from.getTime()) ? from : null,
        to: to && !Number.isNaN(to.getTime()) ? to : null,
    };
};

const isDateInRange = (value: Date | null, range: DateRange) => {
    if (!value) {
        return false;
    }

    if (range.from && value.getTime() < range.from.getTime()) {
        return false;
    }

    if (range.to && value.getTime() > range.to.getTime()) {
        return false;
    }

    return true;
};

const differenceInDays = (target: Date, base: Date) =>
    Math.ceil((target.getTime() - base.getTime()) / (1000 * 60 * 60 * 24));

const isSevereReport = (reasonCode: string | null, reason: string | null) => {
    const normalizedCode = (reasonCode ?? "").trim().toLowerCase();
    const normalizedReason = (reason ?? "").trim().toLowerCase();

    return (
        ["fraud", "scam", "counterfeit", "illegal", "violence", "harassment"].includes(
            normalizedCode,
        ) ||
        ["lừa đảo", "giả mạo", "hàng cấm", "vi phạm nghiêm trọng", "quấy rối"].some(
            (keyword) => normalizedReason.includes(keyword),
        )
    );
};

const doesRangeOverlap = (startDate: string, endDate: string, range: DateRange) => {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59.999`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return true;
    }

    if (range.from && end.getTime() < range.from.getTime()) {
        return false;
    }

    if (range.to && start.getTime() > range.to.getTime()) {
        return false;
    }

    return true;
};

const formatDate = (value: Date | null) => {
    if (!value || Number.isNaN(value.getTime())) {
        return "";
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const formatNumber = (value: number) => value.toLocaleString("en-US");

const formatCurrency = (value: number) => `${value.toLocaleString("en-US")} VND`;

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const enumerateDateRange = (from: Date, to: Date) => {
    const days: Date[] = [];
    const cursor = new Date(from);

    while (cursor.getTime() <= to.getTime()) {
        days.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }

    return days;
};

const getPreviousRange = (range: DateRange): DateRange | null => {
    if (!range.from || !range.to) {
        return null;
    }

    const durationMs = range.to.getTime() - range.from.getTime();
    const previousTo = new Date(range.from.getTime() - 1);
    const previousFrom = new Date(previousTo.getTime() - durationMs);

    return {
        from: previousFrom,
        to: previousTo,
    };
};

const escapeDelimitedValue = (value: unknown, delimiter: "," | "\t") => {
    const text = String(value ?? "");
    if (delimiter === "\t") {
        return text.replace(/\r?\n/g, " ");
    }

    if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
        return `"${text.replace(/"/g, "\"\"")}"`;
    }

    return text;
};

const toDelimitedContent = (
    rows: Array<Record<string, unknown>>,
    format: "CSV" | "XLSX",
    columns?: ExportColumn[],
) => {
    const delimiter: "," | "\t" = format === "CSV" ? "," : "\t";
    const headers = columns?.length
        ? columns.map((column) => column.header)
        : rows.length > 0
            ? Object.keys(rows[0])
            : [];

    if (headers.length === 0) {
        return "";
    }

    const lines = [
        headers.join(delimiter),
        ...rows.map((row) =>
            (columns?.length ? columns : headers.map((header) => ({ key: header, header })))
                .map((column) => escapeDelimitedValue(row[column.key], delimiter))
                .join(delimiter),
        ),
    ];

    return lines.join("\n");
};

const buildXlsxBase64 = async (
    rows: Array<Record<string, unknown>>,
    sheetName: string,
    columns?: ExportColumn[],
) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "GreenMarket Admin";
    workbook.lastModifiedBy = "GreenMarket Admin";
    workbook.created = new Date();
    workbook.modified = new Date();

    const worksheet = workbook.addWorksheet((sheetName || "Sheet1").slice(0, 31));
    const resolvedColumns: ExportColumn[] = columns?.length
        ? columns
        : rows.length > 0
            ? Object.keys(rows[0]).map((key) => ({ key, header: key }))
            : [];

    if (resolvedColumns.length === 0) {
        return Buffer.from(await workbook.xlsx.writeBuffer()).toString("base64");
    }

    worksheet.addRow(resolvedColumns.map((column) => column.header));
    rows.forEach((row) => {
        worksheet.addRow(resolvedColumns.map((column) => row[column.key] ?? ""));
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.columns = resolvedColumns.map((column) => ({
        key: column.key,
        width: column.width ?? Math.max(16, column.header.length + 4),
    }));

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer).toString("base64");
};

const buildExportContent = (
    rows: Array<Record<string, unknown>>,
    format: "CSV" | "XLSX",
    sheetName: string,
    columns?: ExportColumn[],
) => {
    if (format === "XLSX") {
        return {
            content: "",
            contentEncoding: "base64" as const,
        };
    }

    return {
        content: toDelimitedContent(rows, format, columns),
        contentEncoding: "utf-8" as const,
    };
};

const getGeneratedByLabel = (generatedBy: string) => generatedBy || "Quản trị viên hệ thống";

const isPriceEffectiveAt = (
    effectiveFrom: Date | null,
    effectiveTo: Date | null,
    createdAt: Date | null,
) => {
    if (!createdAt) {
        return false;
    }

    if (effectiveFrom && createdAt.getTime() < effectiveFrom.getTime()) {
        return false;
    }

    if (effectiveTo && createdAt.getTime() >= effectiveTo.getTime()) {
        return false;
    }

    return true;
};

const ACCOUNT_SLOT_LABEL_BY_CODE: Record<string, string> = {
    [SHOP_REGISTRATION_SLOT_CODE]: "Gói tài khoản",
    [PERSONAL_PLAN_SLOT_CODE]: "Gói tài khoản",
    [SHOP_VIP_SLOT_CODE]: "Danh sách nhà vườn VIP",
};

const getSuccessfulPayments = async (): Promise<PaymentOrder[]> => {
    const [slotCatalog, accountPackages, transactions, allSlots, allPriceRows] = await Promise.all([
        adminPlacementSlotCatalogService.getCatalog(),
        adminAccountPackageService.getCatalog(),
        db
            .select({
                paymentTxnId: paymentTxn.paymentTxnId,
                paymentTxnUserId: paymentTxn.paymentTxnUserId,
                paymentTxnAmount: paymentTxn.paymentTxnAmount,
                paymentTxnStatus: paymentTxn.paymentTxnStatus,
                paymentTxnCreatedAt: paymentTxn.paymentTxnCreatedAt,
                paymentTxnPriceId: paymentTxn.paymentTxnPriceId,
                userDisplayName: users.userDisplayName,
                userEmail: users.userEmail,
                packageId: promotionPackages.promotionPackageId,
                packageTitle: promotionPackages.promotionPackageTitle,
            })
            .from(paymentTxn)
            .leftJoin(users, eq(paymentTxn.paymentTxnUserId, users.userId))
            .leftJoin(
                promotionPackages,
                eq(paymentTxn.paymentTxnPackageId, promotionPackages.promotionPackageId),
            )
            .orderBy(desc(paymentTxn.paymentTxnCreatedAt)),
        db.select().from(promotionPackages),
        db.select().from(promotionPackagePrices),
    ]);
    const slotByPackageId = new Map<number, number | null>();
    const packageTitleById = new Map<number, string>();
    allSlots.forEach((item) => {
        slotByPackageId.set(item.promotionPackageId, item.promotionPackageSlotId);
        packageTitleById.set(
            item.promotionPackageId,
            item.promotionPackageTitle?.trim() || `Gói #${item.promotionPackageId}`,
        );
    });

    const packageIdByPriceId = new Map<number, number>();
    allPriceRows.forEach((item) => {
        packageIdByPriceId.set(item.priceId, item.packageId);
    });

    const slotNameById = new Map<number, string>();
    const slotCodeById = new Map<number, string>();
    slotCatalog.forEach((item) => {
        slotNameById.set(item.id, item.label);
        slotCodeById.set(item.id, item.code);
    });

    const accountPackageByPrice = new Map<
        number,
        Array<{ title: string; slot: string; slotCode: string }>
    >();
    accountPackages.forEach((item) => {
        const slotCode =
            item.code === "OWNER_LIFETIME"
                ? SHOP_REGISTRATION_SLOT_CODE
                : item.code === "PERSONAL_MONTHLY"
                    ? PERSONAL_PLAN_SLOT_CODE
                    : SHOP_VIP_SLOT_CODE;
        const amountKey = Math.round(item.price);
        const current = accountPackageByPrice.get(amountKey) ?? [];
        current.push({
            title: item.title.trim(),
            slot: ACCOUNT_SLOT_LABEL_BY_CODE[slotCode] ?? "Gói tài khoản",
            slotCode,
        });
        accountPackageByPrice.set(amountKey, current);
    });

    const resolvePackageId = (item: (typeof transactions)[number]) => {
        if (item.packageId) {
            return item.packageId;
        }

        if (item.paymentTxnPriceId && packageIdByPriceId.has(item.paymentTxnPriceId)) {
            return packageIdByPriceId.get(item.paymentTxnPriceId) ?? null;
        }

        const amount = Number(item.paymentTxnAmount ?? 0);
        const matchedPrices = allPriceRows.filter(
            (priceRow) =>
                Number(priceRow.price ?? 0) === amount &&
                isPriceEffectiveAt(
                    priceRow.effectiveFrom,
                    priceRow.effectiveTo,
                    item.paymentTxnCreatedAt,
                ),
        );

        if (matchedPrices.length === 1) {
            return matchedPrices[0]?.packageId ?? null;
        }

        return null;
    };

    return transactions
        .filter((item) => item.paymentTxnStatus === "success")
        .map((item) => {
            const resolvedPackageId = resolvePackageId(item);
            const resolvedSlotId = slotByPackageId.get(resolvedPackageId ?? -1) ?? null;
            const resolvedSlotCode =
                resolvedSlotId !== null ? slotCodeById.get(resolvedSlotId) ?? null : null;
            const resolvedSlotLabel =
                resolvedSlotId !== null ? slotNameById.get(resolvedSlotId) ?? null : null;
            const amount = Math.round(Number(item.paymentTxnAmount ?? 0));
            const accountPackageCandidates = accountPackageByPrice.get(amount) ?? [];
            const fallbackAccountPackage =
                !resolvedPackageId && accountPackageCandidates.length === 1
                    ? accountPackageCandidates[0]
                    : null;
            const slotCode = fallbackAccountPackage?.slotCode ?? resolvedSlotCode;
            const slotLabel =
                fallbackAccountPackage?.slot ||
                (slotCode
                    ? ACCOUNT_SLOT_LABEL_BY_CODE[slotCode] ?? resolvedSlotLabel
                    : resolvedSlotLabel);

            const basePayment: PaymentOrder = {
                paymentTxnId: item.paymentTxnId,
                userId: item.paymentTxnUserId,
                customerName:
                    item.userDisplayName?.trim() || `Người dùng #${item.paymentTxnUserId}`,
                email: item.userEmail?.trim() || "Chưa có email",
                packageName:
                    item.packageTitle?.trim() ||
                    packageTitleById.get(resolvedPackageId ?? -1) ||
                    "Giao dịch chưa gắn gói",
                slot:
                    slotNameById.get(
                        slotByPackageId.get(resolvedPackageId ?? -1) ?? -1,
                    ) || "Nhóm gói chưa xác định",
                slotCode: null,
                amount: Number(item.paymentTxnAmount ?? 0),
                createdAt: item.paymentTxnCreatedAt,
            };

            return {
                ...basePayment,
                customerName:
                    item.userDisplayName?.trim() || `Người dùng #${item.paymentTxnUserId}`,
                email: item.userEmail?.trim() || "Chưa có email",
                packageName:
                    item.packageTitle?.trim() ||
                    packageTitleById.get(resolvedPackageId ?? -1) ||
                    fallbackAccountPackage?.title ||
                    "Giao dịch chưa gắn gói",
                slot: slotLabel || "Vị trí chưa xác định",
                slotCode,
                amount,
            };
        });
};

const getCompletedHostPayouts = async (): Promise<HostPayoutOrder[]> => {
    const rows = await db
        .select({
            payoutRequestId: payoutRequests.payoutRequestId,
            userId: payoutRequests.payoutRequestUserId,
            amount: payoutRequests.payoutRequestAmount,
            processedAt: payoutRequests.payoutRequestProcessedAt,
        })
        .from(payoutRequests)
        .leftJoin(users, eq(payoutRequests.payoutRequestUserId, users.userId))
        .leftJoin(
            businessRoles,
            eq(users.userBusinessRoleId, businessRoles.businessRoleId),
        )
        .where(
            and(
                eq(payoutRequests.payoutRequestStatus, "completed"),
                eq(sql`upper(${businessRoles.businessRoleCode})`, "HOST"),
            ),
        )
        .orderBy(desc(payoutRequests.payoutRequestProcessedAt));

    return rows.map((item) => ({
        payoutRequestId: item.payoutRequestId,
        userId: item.userId,
        amount: Number(item.amount ?? 0),
        processedAt: item.processedAt,
    }));
};

const buildExportHistoryItem = (
    id: number,
    reportName: string,
    type: "General" | "Financial",
    format: "CSV" | "XLSX",
    generatedBy: string,
): ExportHistoryItem => ({
    id,
    reportName,
    type,
    format,
    generatedBy: getGeneratedByLabel(generatedBy),
    date: formatDate(new Date()),
        status: "Completed",
});

const mapEventLogToHistoryItem = (
    item: typeof eventLogs.$inferSelect,
): ExportHistoryItem | null => {
    const meta = item.eventLogMeta as Record<string, unknown> | null;
    if (!meta) {
        return null;
    }

    const format = meta.format === "XLSX" ? "XLSX" : "CSV";
    const reportType = meta.type === "Financial" ? "Financial" : "General";
    const status = meta.status === "In Progress" ? "In Progress" : "Completed";

    return {
        id: item.eventLogId,
        reportName: typeof meta.reportName === "string" ? meta.reportName : "Xuất dữ liệu",
        type: reportType,
        format,
        generatedBy:
            typeof meta.generatedBy === "string" ? meta.generatedBy : "Quản trị viên hệ thống",
        date: formatDate(item.eventLogEventTime),
        status,
    };
};

export const adminReportingService = {
    async getDashboardOverview(fromDate?: string, toDate?: string) {
        const range = parseDateRange(fromDate, toDate);
        const [allUsers, allPosts, allReports, allPayments, promotions] = await Promise.all([
            db.select().from(users),
            db.select().from(posts),
            db.select().from(reports),
            getSuccessfulPayments(),
            adminPromotionService.getPromotions(),
        ]);

        const filteredUsers = allUsers.filter((item) =>
            item.userStatus?.toLowerCase() !== "deleted",
        );
        const filteredPosts = allPosts.filter((item) => item.postStatus !== "deleted");
        const filteredReports = allReports.filter((item) => isDateInRange(item.reportCreatedAt, range));
        const filteredPayments = allPayments.filter((item) => isDateInRange(item.createdAt, range));

        const revenue = filteredPayments.reduce((sum, item) => sum + item.amount, 0);
        const activePromotions = promotions.filter((item) => item.status === "Active").length;

        const statCards: DashboardStatCard[] = [
            { title: "Tổng người dùng", value: formatNumber(filteredUsers.length) },
            { title: "Tổng bài đăng", value: formatNumber(filteredPosts.length) },
            {
                title: "Báo cáo chờ xử lý",
                value: formatNumber(
                    filteredReports.filter((item) => item.reportStatus === "pending").length,
                ),
            },
            { title: "Doanh thu", value: formatCurrency(revenue) },
        ];

        const summary: DashboardSummary = {
            title: "Tóm tắt hệ thống",
            description:
                activePromotions > 0 || filteredPayments.length > 0
                    ? `Hiện có ${formatNumber(activePromotions)} chiến dịch quảng bá đang hoạt động và ${formatNumber(filteredPayments.length)} giao dịch thanh toán thành công trong giai đoạn đã chọn.`
                    : "Chưa ghi nhận thêm chiến dịch quảng bá hoặc giao dịch thanh toán thành công trong giai đoạn đã chọn.",
        };

        return { statCards, summary };
    },

    async getAnalyticsSummary(fromDate?: string, toDate?: string): Promise<AnalyticsSummaryResponse> {
        const range = parseDateRange(fromDate, toDate);
        const [boostedPosts, payments, slotCatalog] = await Promise.all([
            adminPromotionService.getBoostedPosts(),
            getSuccessfulPayments(),
            adminPlacementSlotCatalogService.getCatalog(),
        ]);
        const reportingSlotCatalog = slotCatalog.filter((item) => isBoostPostSlotCode(item.code));
        const boostSlotLabels = new Set(reportingSlotCatalog.map((item) => item.label));

        const filteredBoostedPosts = boostedPosts.filter((item) =>
            doesRangeOverlap(item.startDate, item.endDate, range),
        );
        const filteredPayments = payments.filter(
            (item) =>
                isDateInRange(item.createdAt, range) &&
                boostSlotLabels.has(item.slot),
        );

        const totalViews = filteredBoostedPosts.reduce((sum, item) => sum + item.impressions, 0);
        const totalClicks = filteredBoostedPosts.reduce((sum, item) => sum + item.clicks, 0);
        const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
        const revenue = filteredPayments.reduce((sum, item) => sum + item.amount, 0);
        const conversions = filteredPayments.length;

        const placementMap = new Map<string, { impressions: number; clicks: number; revenue: number }>();
        const revenueBySlot = new Map<string, number>();

        filteredPayments.forEach((item) => {
            revenueBySlot.set(item.slot, (revenueBySlot.get(item.slot) ?? 0) + item.amount);
        });

        filteredBoostedPosts.forEach((item) => {
            const current = placementMap.get(item.slot) ?? { impressions: 0, clicks: 0, revenue: 0 };
            current.impressions += item.impressions;
            current.clicks += item.clicks;
            placementMap.set(item.slot, current);
        });

        revenueBySlot.forEach((slotRevenue, slot) => {
            const current = placementMap.get(slot) ?? {
                impressions: 0,
                clicks: 0,
                revenue: 0,
            };
            current.revenue = slotRevenue;
            placementMap.set(slot, current);
        });

        const activeSlotLabels = Array.from(
            new Set(
                reportingSlotCatalog
                    .map((item) => item.label)
                    .filter((label) => placementMap.has(label)),
            ),
        );
        const activeTrafficSlotLabels = Array.from(
            new Set(
                reportingSlotCatalog
                    .map((item) => item.label)
                    .filter((label) =>
                        filteredBoostedPosts.some(
                            (item) => item.slot === label && item.impressions > 0,
                        ),
                    ),
            ),
        );

        const topPlacements: TopPlacement[] = activeSlotLabels.map((slot, index) => {
            const item = placementMap.get(slot) ?? { impressions: 0, clicks: 0, revenue: 0 };

            return {
                id: index + 1,
                slot,
                impressions: formatNumber(item.impressions),
                clicks: formatNumber(item.clicks),
                ctr: formatPercent(item.impressions > 0 ? (item.clicks / item.impressions) * 100 : 0),
                revenue: formatCurrency(item.revenue),
            };
        });

        const fallbackFrom = range.from
            ?? new Date(`${filteredBoostedPosts[0]?.startDate ?? formatDate(new Date())}T00:00:00`);
        const fallbackTo = range.to
            ?? new Date(`${filteredBoostedPosts[filteredBoostedPosts.length - 1]?.endDate ?? formatDate(new Date())}T23:59:59.999`);

        const dailyTrafficMap = new Map<
            string,
            {
                slot: string;
                impressions: number;
            }
        >();

        filteredBoostedPosts.forEach((item) => {
            const campaignStart = new Date(`${item.startDate}T00:00:00`);
            const campaignEnd = new Date(`${item.endDate}T23:59:59.999`);
            const overlapStart = new Date(
                Math.max(campaignStart.getTime(), fallbackFrom.getTime()),
            );
            const overlapEnd = new Date(
                Math.min(campaignEnd.getTime(), fallbackTo.getTime()),
            );

            if (Number.isNaN(overlapStart.getTime()) || Number.isNaN(overlapEnd.getTime())) {
                return;
            }

            if (overlapStart.getTime() > overlapEnd.getTime()) {
                return;
            }

            const activeDays = enumerateDateRange(
                new Date(
                    overlapStart.getFullYear(),
                    overlapStart.getMonth(),
                    overlapStart.getDate(),
                ),
                new Date(
                    overlapEnd.getFullYear(),
                    overlapEnd.getMonth(),
                    overlapEnd.getDate(),
                ),
            );

            if (activeDays.length === 0) {
                return;
            }

            let remainingImpressions = item.impressions;

            activeDays.forEach((day, index) => {
                const daysLeft = activeDays.length - index;
                const allocation = Math.max(
                    0,
                    Math.round(remainingImpressions / Math.max(daysLeft, 1)),
                );
                remainingImpressions -= allocation;

                const dayKey = formatDate(day);
                const slotKey = `${dayKey}::${item.slot}`;
                const current = dailyTrafficMap.get(slotKey) ?? {
                    slot: item.slot,
                    impressions: 0,
                };

                current.impressions += allocation;
                dailyTrafficMap.set(slotKey, current);
            });
        });

        const dailyTraffic: AnalyticsDailyTrafficPoint[] = enumerateDateRange(
            new Date(
                fallbackFrom.getFullYear(),
                fallbackFrom.getMonth(),
                fallbackFrom.getDate(),
            ),
            new Date(
                fallbackTo.getFullYear(),
                fallbackTo.getMonth(),
                fallbackTo.getDate(),
            ),
        ).map((day) => {
            const dayKey = formatDate(day);
            const slots = activeTrafficSlotLabels.map((slot) => ({
                slot,
                impressions: dailyTrafficMap.get(`${dayKey}::${slot}`)?.impressions ?? 0,
            }));

            return {
                date: dayKey,
                slots,
            };
        });

        const kpiCards: AnalyticsKpiCard[] = [
            {
                title: "Tổng lượt hiển thị",
                value: formatNumber(totalViews),
                change: "Độ phủ phân phối thực tế",
            },
            {
                title: "CTR",
                value: formatPercent(ctr),
                change: "Tỷ lệ nhấp trên các chiến dịch quảng bá",
            },
            {
                title: "Lượt chuyển đổi",
                value: formatNumber(conversions),
                change: "Giao dịch mua gói thành công",
            },
            {
                title: "Doanh thu quảng bá",
                value: formatCurrency(revenue),
                change: "Doanh thu từ các gói quảng bá đã thanh toán",
            },
        ];

        return { kpiCards, topPlacements, dailyTraffic, slotCatalog: reportingSlotCatalog };
    },

    async getRevenueSummary(fromDate?: string, toDate?: string): Promise<RevenueSummaryResponse> {
        return this.getRevenueSummaryWithHostCosts(fromDate, toDate);
    },
        /*

        

        const summaryCards: RevenueCard[] = [
            {
                title: "Tổng doanh thu",
                value: formatCurrency(totalRevenue),
                note: `${filteredPayments.length} đơn hàng thanh toán thành công trong kỳ`,
            },
            {
                title: "Gói có phát sinh doanh thu",
                value: formatNumber(packageNames.size),
                note: "Các gói có đơn thanh toán thành công trong kỳ",
            },
            {
                title: "Giá trị đơn hàng trung bình",
                value: formatCurrency(totalHostPayoutCost),
                note: `${filteredHostPayouts.length} completed Host payout request(s) in period`,
            },
            {
                title: "Estimated Profit",
                value: formatCurrency(provisionalProfit),
                note: "Revenue minus completed Host / News payout cost",
            },
            {
                title: "Avg. Order Value",
                value: formatCurrency(avgOrderValue),
                note: "Giá trị trung bình của một giao dịch thành công",
            },
            {
                title: "Vị trí có doanh thu cao nhất",
                value: topSlot?.[0] ?? "Chưa có dữ liệu",
                note: topSlot
                    ? formatCurrency(topSlot[1])
                    : "Chưa có đơn thanh toán thành công trong kỳ",
            },
        ];

        return { summaryCards, rows, slotCatalog };
    },

        */
    async getRevenueSummaryWithHostCosts(
        fromDate?: string,
        toDate?: string,
    ): Promise<RevenueSummaryResponse> {
        const range = parseDateRange(fromDate, toDate);
        const [payments, hostPayouts, slotCatalog] = await Promise.all([
            getSuccessfulPayments(),
            getCompletedHostPayouts(),
            adminPlacementSlotCatalogService.getCatalog(),
        ]);

        const filteredPayments = payments.filter((item) => isDateInRange(item.createdAt, range));
        const filteredHostPayouts = hostPayouts.filter((item) =>
            isDateInRange(item.processedAt, range),
        );

        const grouped = new Map<string, { packageName: string; slot: string; orders: number; revenue: number }>();
        const revenueBySlot = new Map<string, number>();
        const packageNames = new Set<string>();

        filteredPayments.forEach((item) => {
            const key = `${item.packageName}::${item.slot}`;
            const current = grouped.get(key) ?? {
                packageName: item.packageName,
                slot: item.slot,
                orders: 0,
                revenue: 0,
            };

            current.orders += 1;
            current.revenue += item.amount;
            grouped.set(key, current);
            revenueBySlot.set(item.slot, (revenueBySlot.get(item.slot) ?? 0) + item.amount);
            packageNames.add(item.packageName);
        });

        const rows: RevenueRow[] = Array.from(grouped.values())
            .sort((a, b) => b.revenue - a.revenue)
            .map((item, index) => ({
                id: index + 1,
                packageName: item.packageName,
                slot: item.slot,
                orders: item.orders,
                revenue: formatCurrency(item.revenue),
            }));

        const totalRevenue = filteredPayments.reduce((sum, item) => sum + item.amount, 0);
        const totalHostPayoutCost = filteredHostPayouts.reduce(
            (sum, item) => sum + item.amount,
            0,
        );
        const provisionalProfit = totalRevenue - totalHostPayoutCost;
        const avgOrderValue = filteredPayments.length > 0 ? totalRevenue / filteredPayments.length : 0;
        const topSlot = Array.from(revenueBySlot.entries())
            .sort((left, right) => right[1] - left[1])[0];

        const summaryCards: RevenueCard[] = [
            {
                title: "Total Revenue",
                value: formatCurrency(totalRevenue),
                note: `${filteredPayments.length} successful order(s) in period`,
            },
            {
                title: "Active Packages",
                value: formatNumber(packageNames.size),
                note: "Packages with paid orders in period",
            },
            {
                title: "Host / News Payout Cost",
                value: formatCurrency(totalHostPayoutCost),
                note: `${filteredHostPayouts.length} completed Host payout request(s) in period`,
            },
            {
                title: "Estimated Profit",
                value: formatCurrency(provisionalProfit),
                note: "Revenue minus completed Host / News payout cost",
            },
            {
                title: "Avg. Order Value",
                value: formatCurrency(avgOrderValue),
                note: "Average successful package payment",
            },
            {
                title: "Top Slot Revenue",
                value: topSlot?.[0] ?? "No data yet",
                note: topSlot
                    ? formatCurrency(topSlot[1])
                    : "No paid orders in period",
            },
        ];

        return { summaryCards, rows, slotCatalog };
    },

    async getCustomerSpendingSummary(fromDate?: string, toDate?: string) {
        const range = parseDateRange(fromDate, toDate);
        const payments = (await getSuccessfulPayments()).filter((item) =>
            isDateInRange(item.createdAt, range),
        );

        const grouped = new Map<number, {
            customerName: string;
            email: string;
            totalOrders: number;
            totalSpent: number;
            lastPurchase: Date | null;
        }>();

        payments.forEach((item) => {
            const current = grouped.get(item.userId) ?? {
                customerName: item.customerName,
                email: item.email,
                totalOrders: 0,
                totalSpent: 0,
                lastPurchase: null,
            };
            current.totalOrders += 1;
            current.totalSpent += item.amount;
            if (!current.lastPurchase || ((item.createdAt?.getTime() ?? 0) > current.lastPurchase.getTime())) {
                current.lastPurchase = item.createdAt;
            }
            grouped.set(item.userId, current);
        });

        const rows: CustomerSpendingRow[] = Array.from(grouped.entries())
            .map(([userId, item]) => ({
                id: userId,
                customerName: item.customerName,
                email: item.email,
                totalOrders: item.totalOrders,
                totalSpent: formatCurrency(item.totalSpent),
                avgOrderValue: formatCurrency(item.totalOrders > 0 ? item.totalSpent / item.totalOrders : 0),
                lastPurchase: formatDate(item.lastPurchase),
            }))
            .sort((a, b) => {
                const left = Number(a.totalSpent.replace(/[^\d]/g, ""));
                const right = Number(b.totalSpent.replace(/[^\d]/g, ""));
                return right - left;
            });

        const totalSpent = payments.reduce((sum, item) => sum + item.amount, 0);
        const totalCustomers = rows.length;
        const avgSpend = totalCustomers > 0 ? totalSpent / totalCustomers : 0;
        const topSpend = rows.length > 0 ? Number(rows[0].totalSpent.replace(/[^\d]/g, "")) : 0;

        const summaryCards: CustomerSpendingCard[] = [
            {
                title: "Tổng khách hàng chi tiêu",
                value: formatNumber(totalCustomers),
                note: "Khách hàng có giao dịch thanh toán thành công trong kỳ",
            },
            {
                title: "Tổng chi tiêu",
                value: formatCurrency(totalSpent),
                note: "Tổng chi tiêu từ các giao dịch mua gói thành công",
            },
            {
                title: "Chi tiêu trung bình / khách",
                value: formatCurrency(avgSpend),
                note: "Mức chi tiêu trung bình của mỗi khách hàng phát sinh giao dịch",
            },
            {
                title: "Khách chi tiêu cao nhất",
                value: formatCurrency(topSpend),
                note: "Mức chi tiêu cao nhất của một khách hàng trong kỳ",
            },
        ];

        return { summaryCards, rows };
    },

    async getExportHistory(): Promise<ExportHistoryItem[]> {
        const rows = await db
            .select()
            .from(eventLogs)
            .where(eq(eventLogs.eventLogEventType, "admin_export"))
            .orderBy(desc(eventLogs.eventLogEventTime));

        return rows
            .map(mapEventLogToHistoryItem)
            .filter((item): item is ExportHistoryItem => Boolean(item));
    },

    async createGeneralExport(payload: GeneralExportPayload): Promise<ExportFileResult> {
        const range = parseDateRange(payload.fromDate, payload.toDate);
        let reportName = `${payload.module} Export`;
        let rows: Array<Record<string, unknown>> = [];
        let columns: ExportColumn[] = [];

        if (payload.module === "Users") {
            const allUsers = await db.select().from(users);
            columns = [
                { key: "userId", header: "Mã người dùng", width: 16 },
                { key: "displayName", header: "Tên hiển thị", width: 28 },
                { key: "email", header: "Email", width: 32 },
                { key: "mobile", header: "Số điện thoại", width: 18 },
                { key: "status", header: "Trạng thái", width: 18 },
                { key: "createdAt", header: "Ngày tạo", width: 18 },
            ];
            rows = allUsers.map((item) => ({
                userId: item.userId,
                displayName: item.userDisplayName ?? "",
                email: item.userEmail ?? "",
                mobile: item.userMobile,
                status: item.userStatus ?? "",
                createdAt: formatDate(item.userCreatedAt),
            }));
        } else if (payload.module === "Categories") {
            const allCategories = await db.select().from(categories);
            columns = [
                { key: "categoryId", header: "Mã danh mục", width: 16 },
                { key: "title", header: "Tên danh mục", width: 28 },
                { key: "slug", header: "Slug", width: 24 },
                { key: "published", header: "Đang hiển thị", width: 18 },
                { key: "createdAt", header: "Ngày tạo", width: 18 },
            ];
            rows = allCategories.map((item) => ({
                categoryId: item.categoryId,
                title: item.categoryTitle ?? "",
                slug: item.categorySlug ?? "",
                published: item.categoryPublished ?? false,
                createdAt: formatDate(item.categoryCreatedAt),
            }));
        } else if (payload.module === "Attributes") {
            const allAttributes = await db.select().from(attributes);
            columns = [
                { key: "attributeId", header: "Mã thuộc tính", width: 16 },
                { key: "code", header: "Mã", width: 20 },
                { key: "title", header: "Tên thuộc tính", width: 28 },
                { key: "dataType", header: "Kiểu dữ liệu", width: 20 },
                { key: "published", header: "Đang hiển thị", width: 18 },
                { key: "createdAt", header: "Ngày tạo", width: 18 },
            ];
            rows = allAttributes.map((item) => ({
                attributeId: item.attributeId,
                code: item.attributeCode ?? "",
                title: item.attributeTitle ?? "",
                dataType: item.attributeDataType ?? "",
                published: item.attributePublished ?? false,
                createdAt: formatDate(item.attributeCreatedAt),
            }));
        } else if (payload.module === "Promotions") {
            const promotions = await adminPromotionService.getPromotions();
            columns = [
                { key: "id", header: "Mã chiến dịch", width: 16 },
                { key: "postTitle", header: "Bài đăng", width: 36 },
                { key: "owner", header: "Chủ sở hữu", width: 28 },
                { key: "slot", header: "Vị trí hiển thị", width: 22 },
                { key: "packageName", header: "Gói áp dụng", width: 24 },
                { key: "startDate", header: "Bắt đầu", width: 16 },
                { key: "endDate", header: "Kết thúc", width: 16 },
                { key: "status", header: "Trạng thái", width: 18 },
                { key: "paymentStatus", header: "Thanh toán", width: 18 },
                { key: "budget", header: "Ngân sách", width: 18 },
            ];
            rows = promotions
                .filter((item) => doesRangeOverlap(item.startDate, item.endDate, range))
                .map((item) => ({
                    id: item.id,
                    postTitle: item.postTitle,
                    owner: item.owner,
                    slot: item.slot,
                    packageName: item.packageName,
                    startDate: item.startDate,
                    endDate: item.endDate,
                    status: item.status,
                    paymentStatus: item.paymentStatus,
                    budget: item.budget,
                }));
        } else if (payload.module === "Analytics") {
            reportName = "Analytics Export";
            const analytics = await this.getAnalyticsSummary(payload.fromDate, payload.toDate);
            columns = [
                { key: "id", header: "Mã vị trí", width: 14 },
                { key: "slot", header: "Vị trí hiển thị", width: 22 },
                { key: "impressions", header: "Lượt hiển thị", width: 18 },
                { key: "clicks", header: "Lượt nhấp", width: 16 },
                { key: "ctr", header: "CTR", width: 12 },
                { key: "revenue", header: "Doanh thu", width: 18 },
            ];
            rows = analytics.topPlacements.map((item) => ({
                id: item.id,
                slot: item.slot,
                impressions: item.impressions,
                clicks: item.clicks,
                ctr: item.ctr,
                revenue: item.revenue,
            }));
        } else {
            columns = [
                { key: "message", header: "Ghi chú", width: 96 },
            ];
            rows = [
                {
                    message: "Dữ liệu mẫu nội dung hiện được quản lý trên admin web và chưa lưu đầy đủ ở máy chủ.",
                },
            ];
        }

        const exportFile = payload.format === "XLSX"
            ? {
                content: await buildXlsxBase64(rows, payload.module, columns),
                contentEncoding: "base64" as const,
            }
            : buildExportContent(rows, payload.format, payload.module, columns);
        const fileExtension = payload.format === "CSV" ? "csv" : "xlsx";
        const fileName = `${payload.module.toLowerCase().replace(/\s+/g, "-")}-export.${fileExtension}`;

        const [logRow] = await db.insert(eventLogs).values({
            eventLogUserId: null,
            eventLogEventType: "admin_export",
            eventLogMeta: {
                reportName,
                type: "General",
                format: payload.format,
                generatedBy: getGeneratedByLabel(payload.generatedBy),
                status: "Completed",
            },
        }).returning();

        return {
            historyItem: buildExportHistoryItem(
                logRow.eventLogId,
                reportName,
                "General",
                payload.format,
                payload.generatedBy,
            ),
            fileName,
            mimeType:
                payload.format === "CSV"
                    ? "text/csv;charset=utf-8"
                    : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            content: exportFile.content,
            contentEncoding: exportFile.contentEncoding,
        };
    },

    async createFinancialExport(payload: FinancialExportPayload): Promise<ExportFileResult> {
        let reportName = payload.reportType;
        let rows: Array<Record<string, unknown>> = [];

        if (payload.reportType === "Revenue Summary") {
            const revenue = await this.getRevenueSummary(payload.fromDate, payload.toDate);
            rows = revenue.rows.map((item) => ({
                id: item.id,
                packageName: item.packageName,
                slot: item.slot,
                orders: item.orders,
                revenue: item.revenue,
            }));
        } else if (payload.reportType === "Customer Spending Report") {
            const customerSpending = await this.getCustomerSpendingSummary(
                payload.fromDate,
                payload.toDate,
            );
            rows = customerSpending.rows.map((item) => ({
                id: item.id,
                customerName: item.customerName,
                email: item.email,
                totalOrders: item.totalOrders,
                totalSpent: item.totalSpent,
                avgOrderValue: item.avgOrderValue,
                lastPurchase: item.lastPurchase,
            }));
        } else {
            const boostedPosts = await adminPromotionService.getBoostedPosts();
            const range = parseDateRange(payload.fromDate, payload.toDate);
            rows = boostedPosts
                .filter((item) => doesRangeOverlap(item.startDate, item.endDate, range))
                .map((item) => ({
                    id: item.id,
                    campaignCode: item.campaignCode,
                    slot: item.slot,
                    packageName: item.packageName,
                    status: item.status,
                    impressions: item.impressions,
                    clicks: item.clicks,
                    quotaUsed: `${item.usedQuota}/${item.totalQuota}`,
                }));
        }

        const exportFile = payload.format === "XLSX"
            ? {
                content: await buildXlsxBase64(rows, reportName),
                contentEncoding: "base64" as const,
            }
            : buildExportContent(rows, payload.format, reportName);
        const fileExtension = payload.format === "CSV" ? "csv" : "xlsx";
        const fileName = `${payload.reportType.toLowerCase().replace(/\s+/g, "-")}.${fileExtension}`;

        const [logRow] = await db.insert(eventLogs).values({
            eventLogUserId: null,
            eventLogEventType: "admin_export",
            eventLogMeta: {
                reportName,
                type: "Financial",
                format: payload.format,
                generatedBy: getGeneratedByLabel(payload.generatedBy),
                status: "Completed",
            },
        }).returning();

        return {
            historyItem: buildExportHistoryItem(
                logRow.eventLogId,
                reportName,
                "Financial",
                payload.format,
                payload.generatedBy,
            ),
            fileName,
            mimeType:
                payload.format === "CSV"
                    ? "text/csv;charset=utf-8"
                    : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            content: exportFile.content,
            contentEncoding: exportFile.contentEncoding,
        };
    },
};
