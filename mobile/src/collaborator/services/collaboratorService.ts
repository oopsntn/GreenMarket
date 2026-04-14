import { api } from "../../config/api";

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

export interface Job {
    jobId: number;
    title: string;
    category: string;
    location: string;
    deadline: string;
    price: string | number;
    status: string;
    createdAt: string;
    customer: {
        userId: number;
        displayName: string | null;
        location?: string | null;
    };
    progressPercent?: number;
}

export interface JobDetail extends Job {
    description: string;
    requirements: string[];
    isAssignedToMe: boolean;
    declineReason?: string | null;
    updatedAt: string;
}

export interface EarningEntry {
    earningEntryId: number;
    earningEntryAmount: string | number;
    earningEntryType: string;
    earningEntryDescription: string | null;
    earningEntryCreatedAt: string;
}

export interface PayoutRequest {
    payoutRequestId: number;
    payoutRequestAmount: string | number;
    payoutRequestMethod: string;
    payoutRequestStatus: 'pending' | 'approved' | 'rejected';
    payoutRequestNote: string | null;
    payoutRequestCreatedAt: string;
}

export const CollaboratorService = {
    getProfile: async (): Promise<CollaboratorProfileResponse> => {
        const response = await api.get('/collaborator/profile');
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
        return response.data;
    },

    submitDeliverables: async (id: number, fileUrls: string[], note?: string) => {
        const response = await api.post(`/collaborator/jobs/${id}/deliverables`, { fileUrls, note });
        return response.data;
    },

    getEarnings: async (params?: { from?: string; to?: string }) => {
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
