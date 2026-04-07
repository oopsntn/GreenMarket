import { api } from '../../config/api';

export interface PostModerationData {
    postId: number;
    postTitle: string;
    postShopId: number;
    postPrice: number;
    postStatus: string;
    postCreatedAt: string;
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
    reporterId: number;
    reporterDisplayName: string;
    targetTitle: string;
    postTitle?: string;
    shopName?: string;
    reportReason: string;
    reportStatus: string;
    reportCreatedAt: string;
    [key: string]: any;
}

const ModeratorService = {
    // Posts Moderation
    getPosts: async (): Promise<PostModerationData[]> => {
        const response = await api.get('/admin/posts');
        return response.data;
    },
    getPostById: async (id: number | string): Promise<PostModerationData> => {
        const response = await api.get(`/admin/posts/${id}`);
        return response.data;
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
        return response.data;
    },
    getShopById: async (id: number | string): Promise<ShopModerationData> => {
        const response = await api.get(`/admin/shops/${id}`);
        return response.data;
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
    getDashboardOverview: async (fromDate?: string, toDate?: string): Promise<any> => {
        const response = await api.get('/admin/dashboard', { params: { fromDate, toDate } });
        return response.data;
    },

    // Reports Moderation
    getReports: async (): Promise<ReportModerationData[]> => {
        const response = await api.get('/admin/reports');
        return response.data;
    },
    getReportById: async (id: number | string): Promise<ReportModerationData> => {
        const response = await api.get(`/admin/reports/${id}`);
        return response.data;
    },
    resolveReport: async (id: number | string, status: string, adminNote?: string) => {
        const response = await api.patch(`/admin/reports/${id}/resolve`, { status, adminNote });
        return response.data;
    },
};

export default ModeratorService;
