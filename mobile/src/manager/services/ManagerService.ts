import { api } from '../../config/api';

export interface PostModerationData {
    postId: number;
    postTitle: string;
    postShopId?: number | null;
    postPrice: number | string;
    postStatus: string;
    postCreatedAt?: string;
    postUpdatedAt?: string;
    postRejectedReason?: string | null;
    postLocation?: string | null;
    images?: { imageUrl: string }[];
    attributes?: any[];
    [key: string]: any;
}

export interface ShopModerationData {
    id: number;
    name: string;
    ownerName: string;
    ownerEmail: string;
    totalPosts: number;
    status: string;
    createdAt: string;
    description: string;
    [key: string]: any;
}

export interface ReportModerationData {
    reportId: number;
    reporterId?: number | null;
    reporterDisplayName?: string | null;
    postId?: number | null;
    reportShopId?: number | null;
    postTitle?: string;
    shopName?: string;
    reportReason?: string | null;
    reportNote?: string | null;
    reportStatus: string;
    reportCreatedAt?: string;
    adminNote?: string | null;
    [key: string]: any;
}

type DashboardOverview = {
    statCards?: Array<{ title: string; value: string }>;
    summary?: { title: string; description: string };
}

const normalizePost = (post: any): PostModerationData => ({
    ...post,
    postStatus: String(post?.postStatus || '').toLowerCase(),
})

const normalizeShop = (shop: any): ShopModerationData => ({
    ...shop,
    status: String(shop?.status || ''),
})

const normalizeReport = (report: any): ReportModerationData => ({
    ...report,
    reportStatus: String(report?.reportStatus || '').toLowerCase(),
})

const ManagerService = {
    // Posts Moderation
    getPosts: async (): Promise<PostModerationData[]> => {
        // Use manager queue filtered by post
        const response = await api.get('/manager/moderation/queue', { params: { type: 'post' } });
        const items = response.data?.data || [];
        return items.map((item: any) => normalizePost({
            postId: item.targetId,
            postTitle: item.title,
            postStatus: item.status,
            postCreatedAt: item.createdAt,
            postUpdatedAt: item.updatedAt,
            authorName: item.subtitle,
        }));
    },
    getPostById: async (id: number | string): Promise<PostModerationData> => {
        // Fallback to admin if manager detail not available
        const response = await api.get(`/admin/posts/${id}`);
        return normalizePost(response.data);
    },
    updatePostStatus: async (id: number | string, status: string, reason?: string) => {
        const response = await api.patch(`/manager/posts/${id}/status`, { status, reason });
        return response.data;
    },
    deletePost: async (id: number | string, adminId: number | string, reason?: string) => {
        const response = await api.delete(`/admin/posts/${id}`, { data: { adminId, reason } });
        return response.data;
    },

    // Shops Moderation
    getShops: async (): Promise<ShopModerationData[]> => {
        const response = await api.get('/manager/moderation/queue', { params: { type: 'shop' } });
        const items = response.data?.data || [];
        return items.map((item: any) => normalizeShop({
            id: item.targetId,
            name: item.title,
            status: item.status,
            createdAt: item.createdAt,
            ownerName: item.subtitle,
        }));
    },
    getShopById: async (id: number | string): Promise<ShopModerationData> => {
        // Fallback to admin if manager detail not available
        const response = await api.get(`/admin/shops/${id}`);
        return normalizeShop(response.data);
    },
    updateShopStatus: async (id: number | string, status: string) => {
        const response = await api.patch(`/manager/shops/${id}/status`, { status });
        return response.data;
    },
    verifyShop: async (id: number | string) => {
        const response = await api.patch(`/admin/shops/${id}/verify`);
        return response.data;
    },

    // Dashboard
    getDashboardOverview: async (fromDate?: string, toDate?: string): Promise<DashboardOverview> => {
        const response = await api.get('/manager/statistics', { params: { from: fromDate, to: toDate } });
        const kpi = response.data?.kpi || {};
        return {
            statCards: [
                { title: 'Pending Posts', value: String(kpi.pendingPosts || 0) },
                { title: 'Pending Reports', value: String(kpi.pendingReports || 0) },
                { title: 'Total Actions', value: String(kpi.totalActions || 0) },
            ],
            summary: {
                title: 'Moderation Health',
                description: `There are ${kpi.openQueueItems || 0} items waiting in the queue.`,
            }
        };
    },

    // Reports Moderation
    getReports: async (): Promise<ReportModerationData[]> => {
        const response = await api.get('/manager/reports');
        const rows = response.data?.data || [];
        return rows.map(normalizeReport);
    },
    getReportById: async (id: number | string): Promise<ReportModerationData> => {
        const response = await api.get(`/admin/reports/${id}`);
        return normalizeReport(response.data);
    },
    resolveReport: async (id: number | string, status: string, resolution: string, note?: string) => {
        const response = await api.patch(`/manager/reports/${id}/resolve`, { status, resolution, note });
        return response.data;
    },

    // Moderation Feedback & Communication
    moderationFeedback: async (data: { targetType: string; targetId: number; recipientUserId: number; message: string; templateId?: number }) => {
        const response = await api.post('/manager/moderation-feedback', data);
        return response.data;
    },

    // History and Escalation
    getHistory: async (params?: { from?: string; to?: string; actionType?: string; page?: number; limit?: number }) => {
        const response = await api.get('/manager/history', { params });
        return response.data;
    },
    
    escalate: async (data: { targetType: string; targetId: number | string; severity: string; reason: string; evidenceUrls?: string[] }) => {
        const response = await api.post('/manager/escalations', data);
        return response.data;
    },
};

export default ManagerService;
