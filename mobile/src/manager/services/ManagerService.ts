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
    reporterDisplayName: report.reporterName ?? null,
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

    getDashboardOverview: async (fromDate?: string, toDate?: string): Promise<DashboardOverview> => {
        const response = await api.get('/manager/statistics', { params: { from: fromDate, to: toDate } });
        const kpi = response.data?.kpi || {};
        return {
            statCards: [
                { title: 'Pending Posts', value: String(kpi.pendingPosts || 0) },
                { title: 'Pending Shops', value: String(kpi.pendingShops || 0) },
                { title: 'Pending Reports', value: String(kpi.pendingReports || 0) },
                { title: 'Total Actions', value: String(kpi.totalActions || 0) },
            ],
            summary: {
                title: 'Moderation Overview',
                description: `There are ${kpi.openQueueItems || 0} items currently waiting in the moderation queue.`,
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

    getHistory: async (params?: { from?: string; to?: string; actionType?: string; page?: number; limit?: number }) => {
        const response = await api.get('/manager/history', { params });
        return response.data;
    },

    escalate: async (data: { targetType: string; targetId: number | string; severity: string; reason: string; evidenceUrls?: string[] }) => {
        const response = await api.post('/manager/escalations', data);
        return response.data;
    },
};

export default managerService;
