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

const ModeratorService = {
    // Posts Moderation
    getPosts: async (): Promise<PostModerationData[]> => {
        const response = await api.get('/admin/posts');
        const rows = Array.isArray(response.data) ? response.data : [];
        return rows.map(normalizePost);
    },
    getPostById: async (id: number | string): Promise<PostModerationData> => {
        const response = await api.get(`/admin/posts/${id}`);
        return normalizePost(response.data);
    },
    updatePostStatus: async (id: number | string, status: string, reason?: string) => {
        const response = await api.patch(`/admin/posts/${id}/status`, { status, reason });
        return response.data;
    },
    deletePost: async (id: number | string, adminId: number | string, reason?: string) => {
        const response = await api.delete(`/admin/posts/${id}`, { data: { adminId, reason } });
        return response.data;
    },

    // Shops Moderation
    getShops: async (): Promise<ShopModerationData[]> => {
        const response = await api.get('/admin/shops');
        const rows = Array.isArray(response.data) ? response.data : [];
        return rows.map(normalizeShop);
    },
    getShopById: async (id: number | string): Promise<ShopModerationData> => {
        const response = await api.get(`/admin/shops/${id}`);
        return normalizeShop(response.data);
    },
    updateShopStatus: async (id: number | string, status: string) => {
        const response = await api.patch(`/admin/shops/${id}/status`, { status });
        return response.data;
    },
    verifyShop: async (id: number | string) => {
        const response = await api.patch(`/admin/shops/${id}/verify`);
        return response.data;
    },

    // Dashboard
    getDashboardOverview: async (fromDate?: string, toDate?: string): Promise<DashboardOverview> => {
        const response = await api.get('/admin/dashboard', { params: { fromDate, toDate } });
        return response.data || {};
    },

    // Reports Moderation
    getReports: async (): Promise<ReportModerationData[]> => {
        const response = await api.get('/admin/reports');
        const rows = Array.isArray(response.data) ? response.data : [];
        return rows.map(normalizeReport);
    },
    getReportById: async (id: number | string): Promise<ReportModerationData> => {
        const response = await api.get(`/admin/reports/${id}`);
        return normalizeReport(response.data);
    },
    resolveReport: async (id: number | string, status: string, adminNote?: string) => {
        const response = await api.patch(`/admin/reports/${id}/resolve`, { status, adminNote });
        return response.data;
    },
};

export default ModeratorService;
