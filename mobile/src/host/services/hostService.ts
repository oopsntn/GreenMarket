import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, API_BASE_URL } from '../../config/api';

export type HostContentTargetType = 'post' | 'shop' | 'external';

export interface HostDashboardStats {
  totalContents: number;
  totalViews: number;
  totalClicks: number;
  totalEarnings: number;
  availableBalance: number;
}

export interface HostDashboardResponse {
  stats: HostDashboardStats;
}

export interface HostContent {
  hostContentId: number;
  hostContentAuthorId: number;
  hostContentTitle: string;
  hostContentDescription: string | null;
  hostContentTargetType: HostContentTargetType;
  hostContentTargetId: number | null;
  hostContentTrackingUrl: string | null;
  hostContentMediaUrls: string[];
  hostContentStatus: string;
  hostContentViewCount: number;
  hostContentClickCount: number;
  hostContentCreatedAt: string | null;
  hostContentUpdatedAt: string | null;
}

export interface HostEarning {
  hostEarningId: number;
  hostEarningHostId: number;
  hostEarningAmount: string;
  hostEarningStatus: string;
  hostEarningSourceType: string;
  hostEarningSourceId: number | null;
  hostEarningCreatedAt: string | null;
}

export interface HostPayoutRequest {
  hostPayoutId: number;
  hostPayoutHostId: number;
  hostPayoutAmount: string;
  hostPayoutMethod: string;
  hostPayoutStatus: string;
  hostPayoutNote: string | null;
  hostPayoutProcessedAt: string | null;
  hostPayoutCreatedAt: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages?: number;
  };
}

export interface CreateHostContentPayload {
  title: string;
  description: string;
  targetType: HostContentTargetType;
  targetId?: number;
  mediaUrls?: string[];
}

export interface CreateHostPayoutPayload {
  amount: number;
  method: string;
  note?: string;
}

export interface UploadMediaResponse {
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
};

const getFileInfo = (uri: string) => {
  const cleanUri = uri.split('?')[0];
  const fileName = cleanUri.split('/').pop() || `upload_${Date.now()}.jpg`;
  const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
  const mimeType = MIME_MAP[ext] || 'application/octet-stream';
  return { fileName, mimeType };
};

const normalizeMediaUrls = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  if (typeof value === 'string') {
    return value
      .split('|')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeContent = (content: HostContent): HostContent => {
  return {
    ...content,
    hostContentMediaUrls: normalizeMediaUrls(content.hostContentMediaUrls),
    hostContentViewCount: Number(content.hostContentViewCount || 0),
    hostContentClickCount: Number(content.hostContentClickCount || 0),
  };
};

const toNumber = (value: string | number | null | undefined): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const hostService = {
  getDashboard: async (): Promise<HostDashboardResponse> => {
    const response = await api.get<HostDashboardResponse>('/host/dashboard');
    return {
      stats: {
        totalContents: Number(response.data?.stats?.totalContents || 0),
        totalViews: Number(response.data?.stats?.totalViews || 0),
        totalClicks: Number(response.data?.stats?.totalClicks || 0),
        totalEarnings: toNumber(response.data?.stats?.totalEarnings),
        availableBalance: toNumber(response.data?.stats?.availableBalance),
      },
    };
  },

  getContents: async (): Promise<HostContent[]> => {
    const response = await api.get<HostContent[]>('/host/contents');
    const rows = Array.isArray(response.data) ? response.data : [];
    return rows.map(normalizeContent);
  },

  createContent: async (payload: CreateHostContentPayload): Promise<HostContent> => {
    const response = await api.post<HostContent>('/host/contents', payload);
    return normalizeContent(response.data);
  },

  getEarnings: async (page = 1, limit = 20): Promise<PaginatedResponse<HostEarning>> => {
    const response = await api.get<PaginatedResponse<HostEarning>>('/host/earnings', {
      params: { page, limit },
    });
    return {
      data: Array.isArray(response.data?.data) ? response.data.data : [],
      meta: {
        page: Number(response.data?.meta?.page || 1),
        limit: Number(response.data?.meta?.limit || 20),
        totalItems: Number(response.data?.meta?.totalItems || 0),
      },
    };
  },

  getPayoutRequests: async (page = 1, limit = 20): Promise<PaginatedResponse<HostPayoutRequest>> => {
    const response = await api.get<PaginatedResponse<HostPayoutRequest>>('/host/payout-requests', {
      params: { page, limit },
    });
    return {
      data: Array.isArray(response.data?.data) ? response.data.data : [],
      meta: {
        page: Number(response.data?.meta?.page || 1),
        limit: Number(response.data?.meta?.limit || 20),
        totalItems: Number(response.data?.meta?.totalItems || 0),
      },
    };
  },

  createPayoutRequest: async (payload: CreateHostPayoutPayload): Promise<HostPayoutRequest> => {
    const response = await api.post<{ data: HostPayoutRequest }>('/host/payout-requests', payload);
    return response.data.data;
  },

  uploadMedia: async (fileUris: string[] = []): Promise<UploadMediaResponse> => {
    const formData = new FormData();

    for (const uri of fileUris) {
      const { fileName, mimeType } = getFileInfo(uri);
      formData.append(
        'media',
        {
          uri,
          name: fileName,
          type: mimeType,
        } as unknown as Blob,
      );
    }

    const token = await AsyncStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const data = (await response.json()) as UploadMediaResponse;
    if (!data?.urls || !Array.isArray(data.urls)) {
      throw new Error('Invalid upload response');
    }

    return data;
  },
};
