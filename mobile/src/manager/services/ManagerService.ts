import { api } from '../../config/api';

export type ModerationPriority = 'low' | 'medium' | 'high' | 'critical';
export type QueueType = 'post' | 'shop' | 'report';

type ModerationQueueRow = {
    queueId: string;
    type: QueueType;
    targetId: number;
    status: string;
    priority: ModerationPriority;
    title: string;
    subtitle: string | null;
    createdAt: string | null;
    updatedAt: string | null;
};

export interface PostModerationData {
    queueId: string;
    postId: number;
    postTitle: string;
    postStatus: string;
    priority: ModerationPriority;
    postCreatedAt?: string | null;
    postUpdatedAt?: string | null;
    authorName?: string | null;
    summary?: string | null;
}

export interface ShopModerationData {
    queueId: string;
    id: number;
    name: string;
    ownerName: string | null;
    status: string;
    priority: ModerationPriority;
    createdAt?: string | null;
    updatedAt?: string | null;
    subtitle?: string | null;
}

export interface ReportModerationData {
    reportId: number;
    reporterId?: number | null;
    reporterDisplayName?: string | null;
    postId?: number | null;
    reportShopId?: number | null;
    postTitle?: string | null;
    shopName?: string | null;
    reportReason?: string | null;
    reportReasonCode?: string | null;
    reportNote?: string | null;
    reportStatus: string;
    reportCreatedAt?: string | null;
    reportUpdatedAt?: string | null;
    adminNote?: string | null;
    severity?: ModerationPriority;
    evidenceUrls?: string[];
}

export interface ManagerHistoryEntry {
    logId: number;
    actionType: string;
    eventType: string;
    eventTime: string | null;
    actor?: {
        userId?: number | null;
        displayName?: string | null;
    } | null;
    target?: {
        targetType?: string | null;
        targetId?: number | null;
    } | null;
    meta?: Record<string, unknown> | null;
}

export interface ManagerStatisticsData {
    kpi: {
        totalActions: number;
        postStatusUpdates: number;
        shopStatusUpdates: number;
        reportResolved: number;
        feedbackSent: number;
        escalationsCreated: number;
        pendingPosts: number;
        pendingReports: number;
        pendingShops: number;
        openQueueItems: number;
    };
    charts: {
        actionsByType: Array<{
            actionType: string;
            count: number;
        }>;
        actionsByDay: Array<{
            date: string;
            totalActions: number;
            postStatusUpdates: number;
            shopStatusUpdates: number;
            reportResolved: number;
            feedbackSent: number;
            escalationsCreated: number;
        }>;
        severityBreakdown: Array<{
            severity: ModerationPriority;
            count: number;
        }>;
    };
}

export type HostContentModerationStatus = 'pending' | 'approved' | 'rejected' | string;

export interface HostContentModerationData {
    hostContentId: number;
    hostContentTitle: string;
    hostContentDescription?: string | null;
    hostContentBody?: string | null;
    hostContentTargetType?: string | null;
    hostContentTargetId?: number | null;
    hostContentMediaUrls?: any;
    hostContentStatus: HostContentModerationStatus;
    hostContentCreatedAt?: string | null;
    hostContentUpdatedAt?: string | null;
    authorId?: number | null;
    authorName?: string | null;
}

type DashboardOverview = {
    statCards?: Array<{ title: string; value: string }>;
    summary?: { title: string; description: string };
}

const normalizeStatus = (value: unknown) => String(value || '').toLowerCase();

const parseSubtitleValue = (subtitle: string | null | undefined, prefix: string) => {
    if (!subtitle) return null;
    if (subtitle.startsWith(prefix)) {
        return subtitle.slice(prefix.length).trim();
    }
    return subtitle;
};

const normalizeStringArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    }

    if (typeof value === 'string') {
        const trimmedValue = value.trim();
        if (!trimmedValue) return [];

        try {
            const parsedValue = JSON.parse(trimmedValue);
            if (Array.isArray(parsedValue)) {
                return parsedValue.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
            }
        } catch {
            // Ignore invalid JSON and fall back to a simple delimiter parse.
        }

        return trimmedValue
            .split('|')
            .map((item) => item.trim())
            .filter(Boolean);
    }

    return [];
};

const normalizePost = (item: ModerationQueueRow): PostModerationData => ({
    queueId: item.queueId,
    postId: item.targetId,
    postTitle: item.title,
    postStatus: normalizeStatus(item.status),
    priority: item.priority,
    postCreatedAt: item.createdAt,
    postUpdatedAt: item.updatedAt,
    authorName: parseSubtitleValue(item.subtitle, 'Author:'),
    summary: item.subtitle,
});

const normalizeShop = (item: ModerationQueueRow): ShopModerationData => ({
    queueId: item.queueId,
    id: item.targetId,
    name: item.title,
    ownerName: parseSubtitleValue(item.subtitle, 'Owner:'),
    status: normalizeStatus(item.status),
    priority: item.priority,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    subtitle: item.subtitle,
});

const normalizeReport = (report: any): ReportModerationData => ({
    reportId: report.reportId,
    reporterId: report.reporterId ?? null,
    reporterDisplayName:
        report.reporterDisplayName ??
        report.reporterName ??
        (report.reporterId ? `Người dùng #${report.reporterId}` : null),
    postId: report.postId ?? null,
    reportShopId: report.reportShopId ?? null,
    postTitle: report.postTitle ?? null,
    shopName: report.shopName ?? null,
    reportReason: report.reportReason ?? null,
    reportReasonCode: report.reportReasonCode ?? null,
    reportNote: report.reportNote ?? null,
    reportStatus: normalizeStatus(report.reportStatus),
    reportCreatedAt: report.reportCreatedAt ?? null,
    reportUpdatedAt: report.reportUpdatedAt ?? null,
    adminNote: report.adminNote ?? null,
    severity: report.severity ?? 'medium',
    evidenceUrls: normalizeStringArray(report.evidenceUrls ?? report.ticketMetaData?.evidenceUrls),
});

const fetchAllQueueItems = async (type: QueueType) => {
    let page = 1;
    let totalPages = 1;
    const rows: ModerationQueueRow[] = [];

    while (page <= totalPages) {
        const response = await api.get('/manager/moderation/queue', {
            params: { type, page, limit: 100 },
        });

        const data = Array.isArray(response.data?.data) ? response.data.data : [];
        rows.push(...data);

        totalPages = Number(response.data?.meta?.totalPages || 1);
        page += 1;
    }

    return rows;
};

const fetchAllReports = async () => {
    let page = 1;
    let totalPages = 1;
    const rows: any[] = [];

    while (page <= totalPages) {
        const response = await api.get('/manager/reports', {
            params: { page, limit: 100 },
        });

        const data = Array.isArray(response.data?.data) ? response.data.data : [];
        rows.push(...data);

        totalPages = Number(response.data?.meta?.totalPages || 1);
        page += 1;
    }

    return rows;
};

const managerService = {
    getPosts: async (): Promise<PostModerationData[]> => {
        const rows = await fetchAllQueueItems('post');
        return rows.map(normalizePost);
    },

    getPostById: async (id: number | string): Promise<PostModerationData> => {
        // Tìm trong pending post queue trước
        const pendingRows = await fetchAllQueueItems('post');
        const found = pendingRows.find((row) => Number(row.targetId) === Number(id));
        if (found) return normalizePost(found);

        // Fallback: tìm trong toàn bộ moderation queue (không lọc type)
        // cho phép tìm bài đã approved/rejected/hidden từ context báo cáo
        let allPage = 1;
        let allTotalPages = 1;
        while (allPage <= allTotalPages) {
            const response = await api.get('/manager/moderation/queue', {
                params: { page: allPage, limit: 100 }, // Không truyền type
            });
            const data = Array.isArray(response.data?.data) ? response.data.data : [];
            const match = data.find((row: any) => Number(row.targetId) === Number(id) && row.type === 'post');
            if (match) return normalizePost(match);
            allTotalPages = Number(response.data?.meta?.totalPages || 1);
            allPage += 1;
        }

        throw new Error('Post not found');
    },

    updatePostStatus: async (id: number | string, status: 'approved' | 'rejected' | 'hidden', reason?: string, note?: string) => {
        const response = await api.patch(`/manager/posts/${id}/status`, { status, reason, note });
        return response.data;
    },

    deletePost: async (id: number | string, reason?: string) => {
        return managerService.updatePostStatus(id, 'hidden', reason);
    },

    getShops: async (): Promise<ShopModerationData[]> => {
        const rows = await fetchAllQueueItems('shop');
        return rows.map(normalizeShop);
    },

    getShopById: async (id: number | string): Promise<ShopModerationData> => {
        const rows = await fetchAllQueueItems('shop');
        const item = rows.find((row) => Number(row.targetId) === Number(id));
        if (!item) {
            throw new Error('Shop not found');
        }
        return normalizeShop(item);
    },

    updateShopStatus: async (id: number | string, status: 'active' | 'blocked', reason?: string, note?: string) => {
        const response = await api.patch(`/manager/shops/${id}/status`, { status, reason, note });
        return response.data;
    },

    verifyShop: async (id: number | string) => {
        return managerService.updateShopStatus(id, 'active');
    },

    getStatistics: async (fromDate?: string, toDate?: string): Promise<ManagerStatisticsData> => {
        const response = await api.get('/manager/statistics', { params: { from: fromDate, to: toDate } });
        return {
            kpi: {
                totalActions: Number(response.data?.kpi?.totalActions || 0),
                postStatusUpdates: Number(response.data?.kpi?.postStatusUpdates || 0),
                shopStatusUpdates: Number(response.data?.kpi?.shopStatusUpdates || 0),
                reportResolved: Number(response.data?.kpi?.reportResolved || 0),
                feedbackSent: Number(response.data?.kpi?.feedbackSent || 0),
                escalationsCreated: Number(response.data?.kpi?.escalationsCreated || 0),
                pendingPosts: Number(response.data?.kpi?.pendingPosts || 0),
                pendingReports: Number(response.data?.kpi?.pendingReports || 0),
                pendingShops: Number(response.data?.kpi?.pendingShops || 0),
                openQueueItems: Number(response.data?.kpi?.openQueueItems || 0),
            },
            charts: {
                actionsByType: Array.isArray(response.data?.charts?.actionsByType) ? response.data.charts.actionsByType : [],
                actionsByDay: Array.isArray(response.data?.charts?.actionsByDay) ? response.data.charts.actionsByDay : [],
                severityBreakdown: Array.isArray(response.data?.charts?.severityBreakdown) ? response.data.charts.severityBreakdown : [],
            },
        };
    },

    getDashboardOverview: async (fromDate?: string, toDate?: string): Promise<DashboardOverview> => {
        const stats = await managerService.getStatistics(fromDate, toDate);
        const kpi = stats.kpi;
        return {
            statCards: [
                { title: 'Bài đăng chờ duyệt', value: String(kpi.pendingPosts || 0) },
                { title: 'Cửa hàng chờ duyệt', value: String(kpi.pendingShops || 0) },
                { title: 'Báo cáo chờ xử lý', value: String(kpi.pendingReports || 0) },
                { title: 'Tổng hành động', value: String(kpi.totalActions || 0) },
            ],
            summary: {
                title: 'Tổng quan kiểm duyệt',
                description: `Hiện có ${kpi.openQueueItems || 0} mục đang chờ xử lý trong hàng đợi kiểm duyệt.`,
            }
        };
    },

    getReports: async (): Promise<ReportModerationData[]> => {
        const rows = await fetchAllReports();
        return rows.map(normalizeReport);
    },

    getReportById: async (id: number | string): Promise<ReportModerationData> => {
        const rows = await fetchAllReports();
        const item = rows.find((row) => Number(row.reportId) === Number(id));
        if (!item) {
            throw new Error('Report not found');
        }
        return normalizeReport(item);
    },

    resolveReport: async (id: number | string, status: 'resolved' | 'dismissed', resolution: string, note?: string) => {
        const response = await api.patch(`/manager/reports/${id}/resolve`, { status, resolution, note });
        return response.data;
    },

    moderationFeedback: async (data: { targetType: string; targetId: number; recipientUserId: number; message: string; templateId?: number }) => {
        const response = await api.post('/manager/moderation-feedback', data);
        return response.data;
    },

    getHistory: async (params?: { from?: string; to?: string; actionType?: string; page?: number; limit?: number }): Promise<{ data: ManagerHistoryEntry[]; meta?: Record<string, unknown> }> => {
        const response = await api.get('/manager/history', { params });
        return {
            data: Array.isArray(response.data?.data) ? response.data.data : [],
            meta: response.data?.meta,
        };
    },

    escalate: async (data: { targetType: string; targetId: number | string; severity: string; reason: string; evidenceUrls?: string[] }) => {
        const response = await api.post('/manager/escalations', data);
        return response.data;
    },

    getPendingHostContents: async (): Promise<HostContentModerationData[]> => {
        let page = 1;
        let totalPages = 1;
        const rows: HostContentModerationData[] = [];

        while (page <= totalPages) {
            const response = await api.get('/manager/host-contents/pending', {
                params: { page, limit: 100 },
            });

            const data = Array.isArray(response.data?.data) ? response.data.data : [];
            rows.push(...data);

            totalPages = Number(response.data?.meta?.totalPages || 1);
            page += 1;
        }

        return rows.map((item: any) => ({
            hostContentId: item.hostContentId,
            hostContentTitle: item.hostContentTitle,
            hostContentDescription: item.hostContentDescription ?? null,
            hostContentTargetType: item.hostContentTargetType ?? null,
            hostContentTargetId: item.hostContentTargetId ?? null,
            hostContentMediaUrls: item.hostContentMediaUrls,
            hostContentStatus: normalizeStatus(item.hostContentStatus) || 'pending',
            hostContentCreatedAt: item.hostContentCreatedAt ?? null,
            hostContentUpdatedAt: item.hostContentUpdatedAt ?? null,
            authorId: item.authorId ?? null,
            authorName: item.authorName ?? null,
        }));
    },

    getHostContentById: async (id: number | string): Promise<HostContentModerationData> => {
        const response = await api.get(`/manager/host-contents/${id}`);
        const row = response.data?.data;
        if (!row) {
            throw new Error('Host content not found');
        }
        return {
            hostContentId: row.hostContentId,
            hostContentTitle: row.hostContentTitle,
            hostContentDescription: row.hostContentDescription ?? null,
            hostContentBody: row.hostContentBody ?? null,
            hostContentTargetType: row.hostContentTargetType ?? null,
            hostContentTargetId: row.hostContentTargetId ?? null,
            hostContentMediaUrls: row.hostContentMediaUrls,
            hostContentStatus: normalizeStatus(row.hostContentStatus) || 'pending',
            hostContentCreatedAt: row.hostContentCreatedAt ?? null,
            hostContentUpdatedAt: row.hostContentUpdatedAt ?? null,
            authorId: row.authorId ?? null,
            authorName: row.authorName ?? null,
        };
    },

    updateHostContentStatus: async (id: number | string, status: 'approved' | 'rejected', reason?: string, note?: string) => {
        const response = await api.patch(`/manager/host-contents/${id}/status`, { status, reason, note });
        return response.data;
    },
};

export default managerService;
