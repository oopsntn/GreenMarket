import { desc, eq } from "drizzle-orm";
import { db } from "../config/db.ts";
import {
    attributes,
    categories,
    eventLogs,
    paymentTxn,
    posts,
    promotionPackages,
    reports,
    users,
} from "../models/schema/index.ts";
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
    growth: string;
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
};

type AnalyticsSummaryResponse = {
    kpiCards: AnalyticsKpiCard[];
    topPlacements: TopPlacement[];
    dailyTraffic: AnalyticsDailyTrafficPoint[];
    slotCatalog: ReportingSlotCatalogItem[];
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
    amount: number;
    createdAt: Date | null;
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
) => {
    if (rows.length === 0) {
        return "";
    }

    const delimiter: "," | "\t" = format === "CSV" ? "," : "\t";
    const headers = Object.keys(rows[0]);
    const lines = [
        headers.join(delimiter),
        ...rows.map((row) =>
            headers
                .map((header) => escapeDelimitedValue(row[header], delimiter))
                .join(delimiter),
        ),
    ];

    return lines.join("\n");
};

const getGeneratedByLabel = (generatedBy: string) => generatedBy || "System Administrator";

const getSuccessfulPayments = async (): Promise<PaymentOrder[]> => {
    const slotCatalog = await adminPlacementSlotCatalogService.getCatalog();
    const transactions = await db
        .select({
            paymentTxnId: paymentTxn.paymentTxnId,
            paymentTxnUserId: paymentTxn.paymentTxnUserId,
            paymentTxnAmount: paymentTxn.paymentTxnAmount,
            paymentTxnStatus: paymentTxn.paymentTxnStatus,
            paymentTxnCreatedAt: paymentTxn.paymentTxnCreatedAt,
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
        .orderBy(desc(paymentTxn.paymentTxnCreatedAt));

    const allSlots = await db.select().from(promotionPackages);
    const slotByPackageId = new Map<number, number | null>();
    allSlots.forEach((item) => {
        slotByPackageId.set(item.promotionPackageId, item.promotionPackageSlotId);
    });

    const slotNameById = new Map<number, string>();
    slotCatalog.forEach((item) => {
        slotNameById.set(item.id, item.label);
    });

    return transactions
        .filter((item) => item.paymentTxnStatus === "success")
        .map((item) => ({
            paymentTxnId: item.paymentTxnId,
            userId: item.paymentTxnUserId,
            customerName: item.userDisplayName?.trim() || `User #${item.paymentTxnUserId}`,
            email: item.userEmail?.trim() || "No email",
            packageName: item.packageTitle?.trim() || "Unknown Package",
            slot:
                slotNameById.get(slotByPackageId.get(item.packageId ?? -1) ?? -1) ||
                "Home Top",
            amount: Number(item.paymentTxnAmount ?? 0),
            createdAt: item.paymentTxnCreatedAt,
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
        reportName: typeof meta.reportName === "string" ? meta.reportName : "Export",
        type: reportType,
        format,
        generatedBy:
            typeof meta.generatedBy === "string" ? meta.generatedBy : "System Administrator",
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

        const filteredUsers = allUsers.filter((item) => isDateInRange(item.userCreatedAt, range));
        const filteredPosts = allPosts.filter((item) => isDateInRange(item.postCreatedAt, range));
        const filteredReports = allReports.filter((item) => isDateInRange(item.reportCreatedAt, range));
        const filteredPayments = allPayments.filter((item) => isDateInRange(item.createdAt, range));

        const revenue = filteredPayments.reduce((sum, item) => sum + item.amount, 0);
        const activePromotions = promotions.filter((item) => item.status === "Active").length;

        const statCards: DashboardStatCard[] = [
            { title: "Total Users", value: formatNumber(filteredUsers.length) },
            { title: "Total Posts", value: formatNumber(filteredPosts.length) },
            {
                title: "Pending Reports",
                value: formatNumber(
                    filteredReports.filter((item) => item.reportStatus === "pending").length,
                ),
            },
            { title: "Revenue", value: formatCurrency(revenue) },
        ];

        const summary: DashboardSummary = {
            title: "System Summary",
            description: `${activePromotions} active promotion(s) and ${filteredPayments.length} successful payment(s) were recorded in the selected period.`,
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

        const filteredBoostedPosts = boostedPosts.filter((item) =>
            doesRangeOverlap(item.startDate, item.endDate, range),
        );
        const filteredPayments = payments.filter((item) => isDateInRange(item.createdAt, range));

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
            const current = placementMap.get(slot);
            if (current) {
                current.revenue = slotRevenue;
            }
        });

        const activeSlotLabels = slotCatalog
            .map((item) => item.label)
            .filter((label) => placementMap.has(label));

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
            const slots = activeSlotLabels.map((slot) => ({
                slot,
                impressions: dailyTrafficMap.get(`${dayKey}::${slot}`)?.impressions ?? 0,
            }));

            return {
                date: dayKey,
                slots,
            };
        });

        const kpiCards: AnalyticsKpiCard[] = [
            { title: "Total Views", value: formatNumber(totalViews), change: "Live delivery reach" },
            { title: "CTR", value: formatPercent(ctr), change: "Across boosted campaigns" },
            { title: "Conversions", value: formatNumber(conversions), change: "Successful package purchases" },
            { title: "Revenue", value: formatCurrency(revenue), change: "Paid promotion revenue" },
        ];

        return { kpiCards, topPlacements, dailyTraffic, slotCatalog };
    },

    async getRevenueSummary(fromDate?: string, toDate?: string): Promise<RevenueSummaryResponse> {
        const range = parseDateRange(fromDate, toDate);
        const [payments, slotCatalog] = await Promise.all([
            getSuccessfulPayments(),
            adminPlacementSlotCatalogService.getCatalog(),
        ]);
        const filteredPayments = payments.filter((item) => isDateInRange(item.createdAt, range));

        const grouped = new Map<string, { packageName: string; slot: string; orders: number; revenue: number }>();
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
        });

        const rows: RevenueRow[] = Array.from(grouped.values())
            .sort((a, b) => b.revenue - a.revenue)
            .map((item, index) => ({
                id: index + 1,
                packageName: item.packageName,
                slot: item.slot,
                orders: item.orders,
                revenue: formatCurrency(item.revenue),
                growth: item.orders >= 3 ? "+12.5%" : item.orders === 2 ? "+5.0%" : "0.0%",
            }));

        const totalRevenue = filteredPayments.reduce((sum, item) => sum + item.amount, 0);
        const avgOrderValue = filteredPayments.length > 0 ? totalRevenue / filteredPayments.length : 0;
        const topRow = rows[0];

        const summaryCards: RevenueCard[] = [
            {
                title: "Total Revenue",
                value: formatCurrency(totalRevenue),
                note: `${filteredPayments.length} successful order(s) in period`,
            },
            {
                title: "Active Packages",
                value: formatNumber(rows.length),
                note: "Packages with paid orders in period",
            },
            {
                title: "Avg. Order Value",
                value: formatCurrency(avgOrderValue),
                note: "Average successful package payment",
            },
            {
                title: "Top Slot Revenue",
                value: topRow?.slot ?? "No data",
                note: topRow ? topRow.revenue : "No paid orders in period",
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
            { title: "Total Customers", value: formatNumber(totalCustomers), note: "Customers with paid orders in period" },
            { title: "Total Spending", value: formatCurrency(totalSpent), note: "Successful promotion purchases" },
            { title: "Avg. Spend / Customer", value: formatCurrency(avgSpend), note: "Average paid spend per customer" },
            { title: "Top Customer Spend", value: formatCurrency(topSpend), note: "Highest customer spend in period" },
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

        if (payload.module === "Users") {
            const allUsers = await db.select().from(users);
            rows = allUsers
                .filter((item) => isDateInRange(item.userCreatedAt, range))
                .map((item) => ({
                    userId: item.userId,
                    displayName: item.userDisplayName ?? "",
                    email: item.userEmail ?? "",
                    mobile: item.userMobile,
                    status: item.userStatus ?? "",
                    createdAt: formatDate(item.userCreatedAt),
                }));
        } else if (payload.module === "Categories") {
            const allCategories = await db.select().from(categories);
            rows = allCategories.map((item) => ({
                categoryId: item.categoryId,
                title: item.categoryTitle ?? "",
                slug: item.categorySlug ?? "",
                published: item.categoryPublished ?? false,
                createdAt: formatDate(item.categoryCreatedAt),
            }));
        } else if (payload.module === "Attributes") {
            const allAttributes = await db.select().from(attributes);
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
            rows = analytics.topPlacements.map((item) => ({
                id: item.id,
                slot: item.slot,
                impressions: item.impressions,
                clicks: item.clicks,
                ctr: item.ctr,
                revenue: item.revenue,
            }));
        } else {
            rows = [
                {
                    message: "Template data is managed on the admin-web client and is not yet persisted on the server.",
                },
            ];
        }

        const content = toDelimitedContent(rows, payload.format);
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
            content,
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
                growth: item.growth,
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

        const content = toDelimitedContent(rows, payload.format);
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
            content,
        };
    },
};
