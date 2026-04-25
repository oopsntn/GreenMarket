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

const logCollaboratorRequest = (label: string, method: string, path: string, extra?: Record<string, unknown>) => {
    console.log(`[CollaboratorService.${label}]`, {
        method,
        url: `${API_BASE_URL}${path}`,
        ...extra,
    })
}

const logCollaboratorError = (label: string, path: string, error: any, extra?: Record<string, unknown>) => {
    console.error(`[CollaboratorService.${label}] failed`, {
        url: `${API_BASE_URL}${path}`,
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
        ...extra,
    })
}

export const CollaboratorService = {
    getProfile: async (): Promise<CollaboratorProfileResponse> => {
        const path = '/collaborator/profile'
        try {
            logCollaboratorRequest('getProfile', 'GET', path)
            const response = await api.get(path);
            return response.data;
        } catch (error: any) {
            logCollaboratorError('getProfile', path, error)
            throw error
        }
    },

    getPublicCollaborators: async (params?: { page?: number; limit?: number }) => {
        const path = '/collaborator/public-list'
        try {
            logCollaboratorRequest('getPublicCollaborators', 'GET', path, { params })
            const response = await api.get(path, { params });
            return response.data;
        } catch (error: any) {
            logCollaboratorError('getPublicCollaborators', path, error, { params })
            throw error
        }
    },

    getPublicCollaboratorDetail: async (id: number) => {
        const path = `/collaborator/public/${id}`
        try {
            logCollaboratorRequest('getPublicCollaboratorDetail', 'GET', path, { collaboratorId: id })
            const response = await api.get(path);
            return response.data;
        } catch (error: any) {
            logCollaboratorError('getPublicCollaboratorDetail', path, error, { collaboratorId: id })
            throw error
        }
    },

    getMyInvitations: async () => {
        const path = '/collaborator/invitations'
        try {
            logCollaboratorRequest('getMyInvitations', 'GET', path)
            const response = await api.get(path);
            return response.data;
        } catch (error: any) {
            logCollaboratorError('getMyInvitations', path, error)
            throw error
        }
    },

    getMyActiveShops: async (): Promise<{ data: CollaboratorActiveShop[] }> => {
        const path = '/collaborator/my-shops'
        try {
            logCollaboratorRequest('getMyActiveShops', 'GET', path)
            const response = await api.get(path);
            return response.data;
        } catch (error: any) {
            logCollaboratorError('getMyActiveShops', path, error)
            throw error
        }
    },

    respondToInvitation: async (id: number, action: 'accept' | 'reject') => {
        const path = `/collaborator/invitations/${id}/respond`
        try {
            logCollaboratorRequest('respondToInvitation', 'POST', path, {
                invitationId: id,
                payload: { action },
            })
            const response = await api.post(path, { action });
            console.log('[CollaboratorService.respondToInvitation] Relationship update result:', response.data)
            return response.data;
        } catch (error: any) {
            logCollaboratorError('respondToInvitation', path, error, {
                invitationId: id,
                action,
            })
            throw error
        }
    },

    updateAvailability: async (data: { availabilityStatus?: string; availabilityNote?: string }) => {
        const path = '/collaborator/profile'
        try {
            logCollaboratorRequest('updateAvailability', 'PATCH', path, { payload: data })
            const response = await api.patch(path, data);
            return response.data;
        } catch (error: any) {
            logCollaboratorError('updateAvailability', path, error, { payload: data })
            throw error
        }
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
