import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { api, API_BASE_URL } from '../../config/api'

export interface CollaboratorProfile {
    userId: number;
    mobile: string;
    displayName: string | null;
    avatarUrl: string | null;
    email: string | null;
    location: string | null;
    bio: string | null;
    status: string;
    availabilityStatus: 'available' | 'busy' | 'offline';
    availabilityNote: string | null;
}

export interface CollaboratorStats {
    totalJobs: number;
    activeJobs: number;
    completedJobs: number;
    totalEarnings: number;
    availableBalance: number;
}

export interface CollaboratorProfileResponse {
    profile: CollaboratorProfile;
    stats: CollaboratorStats;
}

export interface CollaboratorActiveShop {
    shopId: number;
    shopName: string;
    shopLogoUrl: string | null;
    shopLocation: string | null;
    ownerDisplayName: string | null;
    joinedAt: string;
}

export interface Job {
    jobId: number;
    title: string;
    category: string;
    location: string;
    deadline: string;
    price: string | number;
    status: string;
    createdAt: string;
    customer?: {
        userId: number;
        displayName: string | null;
        location?: string | null;
    } | null;
    progressPercent?: number;
}

export interface JobDetail extends Job {
    description: string;
    requirements: string[];
    isAssignedToMe: boolean;
    declineReason?: string | null;
    updatedAt: string;
}

const normalizeJob = (raw: any): Job => {
    const customerFromApi = raw?.customer;
    const customerNameFromApi = raw?.customerName;

    const customer =
        customerFromApi ||
        (typeof customerNameFromApi === 'string' && customerNameFromApi.trim().length > 0
            ? { userId: 0, displayName: customerNameFromApi }
            : null);

    return {
        ...raw,
        customer,
    } as Job;
};

export interface EarningEntry {
    earningEntryId: number;
    jobId?: number | null;
    jobTitle?: string | null;
    amount: string | number;
    type: string;
    createdAt: string;
}

export interface PayoutRequest {
    payoutRequestId: number;
    payoutRequestAmount: string | number;
    payoutRequestMethod: string;
    payoutRequestStatus: 'pending' | 'approved' | 'rejected';
    payoutRequestNote: string | null;
    payoutRequestCreatedAt: string;
}

export interface CollaboratorEarningsResponse {
    data: EarningEntry[];
    summary?: {
        totalTransactions?: number;
        averageIncomePerTransaction?: number;
        [key: string]: any;
    };
    [key: string]: any;
}

type UploadResponse = {
    urls: string[];
}

const MIME_MAP: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
}

const getFileInfo = (uri: string) => {
    const cleanUri = uri.split('?')[0]
    const fileName = cleanUri.split('/').pop() || `upload_${Date.now()}.jpg`
    const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg'
    const mimeType = MIME_MAP[ext] || 'application/octet-stream'
    return { fileName, mimeType }
}

export const CollaboratorService = {
    getProfile: async (): Promise<CollaboratorProfileResponse> => {
        const response = await api.get('/collaborator/profile');
        return response.data;
    },

    getPublicCollaborators: async (params?: { page?: number; limit?: number }) => {
        const response = await api.get('/collaborator/public-list', { params });
        return response.data;
    },

    getPublicCollaboratorDetail: async (id: number) => {
        const response = await api.get(`/collaborator/public/${id}`);
        return response.data;
    },

    getMyInvitations: async () => {
        const response = await api.get('/collaborator/invitations');
        return response.data;
    },

    getMyActiveShops: async (): Promise<{ data: CollaboratorActiveShop[] }> => {
        const response = await api.get('/collaborator/my-shops');
        return response.data;
    },

    respondToInvitation: async (id: number, action: 'accept' | 'reject') => {
        const response = await api.post(`/collaborator/invitations/${id}/respond`, { action });
        return response.data;
    },

    updateAvailability: async (data: { availabilityStatus?: string; availabilityNote?: string }) => {
        const response = await api.patch('/collaborator/profile', data);
        return response.data;
    },

    getAvailableJobs: async (params?: { keyword?: string; category?: string; location?: string; page?: number; limit?: number }) => {
        const response = await api.get('/collaborator/jobs', { params });
        return response.data;
    },

    getJobDetail: async (id: number): Promise<JobDetail> => {
        const response = await api.get(`/collaborator/jobs/${id}`);
        return response.data;
    },

    decideJob: async (id: number, decision: 'accept' | 'decline', reason?: string) => {
        const response = await api.post(`/collaborator/jobs/${id}/decision`, { decision, reason });
        return response.data;
    },

    contactCustomer: async (id: number, message: string) => {
        const response = await api.post(`/collaborator/jobs/${id}/contact`, { message });
        return response.data;
    },

    getMyJobs: async (params?: { status?: string; page?: number; limit?: number }) => {
        const response = await api.get('/collaborator/my-jobs', { params });
        const payload = response.data;

        if (payload?.data && Array.isArray(payload.data)) {
            payload.data = payload.data.map(normalizeJob);
        }

        return payload;
    },

    submitDeliverables: async (id: number, fileUrls: string[], note?: string) => {
        const response = await api.post(`/collaborator/jobs/${id}/deliverables`, { fileUrls, note });
        return response.data;
    },

    uploadDeliverables: async (fileUris: string[] = []): Promise<UploadResponse> => {
        const formData = new FormData()

        for (const uri of fileUris) {
            const { fileName, mimeType } = getFileInfo(uri)

            if (Platform.OS === 'web') {
                const response = await fetch(uri)
                const blob = await response.blob()
                const file = new File([blob], fileName, { type: blob.type || mimeType })
                formData.append('media', file)
            } else {
                formData.append('media', {
                    uri,
                    name: fileName,
                    type: mimeType,
                } as any)
            }
        }

        const token = await AsyncStorage.getItem('token')
        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: formData,
        })

        const data = await response.json()
        if (!data?.urls || !Array.isArray(data.urls)) {
            throw new Error('Invalid upload response')
        }

        return data
    },

    getEarnings: async (params?: { from?: string; to?: string }): Promise<CollaboratorEarningsResponse> => {
        const response = await api.get('/collaborator/earnings', { params });
        return response.data;
    },

    getPayoutRequests: async (params?: { page?: number; limit?: number }) => {
        const response = await api.get('/collaborator/payout-requests', { params });
        return response.data;
    },

    createPayoutRequest: async (data: { amount: number; method: string; note?: string }) => {
        const response = await api.post('/collaborator/payout-requests', data);
        return response.data;
    }
};
