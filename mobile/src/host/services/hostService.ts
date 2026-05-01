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
  hostContentBody: string | null;
  hostContentCategory: string | null;
  hostContentTargetType: HostContentTargetType;
  hostContentTargetId: number | null;
  hostContentTrackingUrl: string | null;
  hostContentMediaUrls: string[];
  hostContentStatus: 'draft' | 'pending' | 'approved' | 'rejected' | string;
  hostContentViewCount: number;
  hostContentClickCount: number;
  hostContentCreatedAt: string | null;
  hostContentUpdatedAt: string | null;
}

export interface HostEarning {
  hostEarningId: number;
  hostEarningHostId: number;
  hostEarningAmount: number;
  hostEarningStatus: string;
  hostEarningSourceType: string;
  hostEarningSourceId: number | null;
  hostEarningCreatedAt: string | null;
  hostEarningNote: string | null;
  hostEarningRawStatus: string | null;
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

export type PaginationMeta = PaginatedResponse<unknown>['meta'];

export type HostPublicContentTargetType = HostContentTargetType;

export interface HostPublicContentTarget {
  postId?: number;
  postTitle?: string;
  postSlug?: string;
  shopId?: number;
  shopName?: string;
  shopLogoUrl?: string;
}

export interface HostPublicContentDetail {
  hostContentId: number;
  hostContentTitle: string;
  hostContentDescription: string | null;
  hostContentBody: string | null;
  hostContentTargetType: HostPublicContentTargetType;
  hostContentTargetId: number | null;
  hostContentTrackingUrl: string | null;
  hostContentMediaUrls: string[];
  hostContentViewCount: number;
  hostContentClickCount: number;
  hostContentCreatedAt: string | null;
  hostContentUpdatedAt: string | null;
  authorId: number | null;
  authorName: string | null;
  authorAvatar: string | null;
  target?: HostPublicContentTarget | null;
}

export interface CreateHostContentPayload {
  title: string;
  description: string;
  category?: string;
  body?: string;
  mediaUrls?: string[];
  payoutAmount?: number;
}

export interface UpdateHostContentPayload {
  title?: string;
  description?: string | null;
  category?: string | null;
  body?: string | null;
  mediaUrls?: string[];
  payoutAmount?: number | null;
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

const toOptionalPositiveInt = (value: unknown): number | null => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  const normalized = Math.floor(parsed);
  return normalized > 0 ? normalized : null;
};

const normalizeDate = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString();
  }

  return null;
};

const normalizeEarningStatus = (value: unknown): string => {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return normalized === 'available' ? 'available' : 'pending';
};

const normalizeEarningSourceType = (
  row: Record<string, unknown>,
  meta: Record<string, unknown>,
): string => {
  const metaType = typeof meta.type === 'string' ? meta.type.trim().toLowerCase() : '';
  if (metaType) {
    return metaType;
  }

  const sourceType =
    typeof row.hostEarningSourceType === 'string'
      ? row.hostEarningSourceType.trim().toLowerCase()
      : '';
  if (sourceType) {
    return sourceType;
  }

  const referenceType =
    typeof row.ledgerReferenceType === 'string'
      ? row.ledgerReferenceType.trim().toLowerCase()
      : '';
  if (referenceType) {
    return referenceType;
  }

  return 'other';
};

const normalizeHostEarning = (value: unknown): HostEarning => {
  const row = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const meta =
    row.ledgerMeta && typeof row.ledgerMeta === 'object'
      ? (row.ledgerMeta as Record<string, unknown>)
      : {};

  const rawStatus =
    typeof row.hostEarningStatus === 'string'
      ? row.hostEarningStatus
      : typeof row.ledgerStatus === 'string'
        ? row.ledgerStatus
        : null;

  const sourceId =
    toOptionalPositiveInt(row.hostEarningSourceId) ??
    toOptionalPositiveInt(meta.sourceId) ??
    toOptionalPositiveInt(row.ledgerReferenceId);

  return {
    hostEarningId: toNumber(row.hostEarningId as string | number | null | undefined) || toNumber(row.ledgerId as string | number | null | undefined),
    hostEarningHostId: toNumber(row.hostEarningHostId as string | number | null | undefined) || toNumber(row.ledgerUserId as string | number | null | undefined),
    hostEarningAmount: toNumber(row.hostEarningAmount as string | number | null | undefined) || toNumber(row.ledgerAmount as string | number | null | undefined),
    hostEarningStatus: normalizeEarningStatus(rawStatus),
    hostEarningSourceType: normalizeEarningSourceType(row, meta),
    hostEarningSourceId: sourceId,
    hostEarningCreatedAt: normalizeDate(row.hostEarningCreatedAt) || normalizeDate(row.ledgerCreatedAt),
    hostEarningNote:
      typeof row.hostEarningNote === 'string'
        ? row.hostEarningNote
        : typeof row.ledgerNote === 'string'
          ? row.ledgerNote
          : null,
    hostEarningRawStatus: rawStatus,
  };
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

  updateContent: async (id: number | string, payload: UpdateHostContentPayload): Promise<HostContent> => {
    const response = await api.patch<HostContent>(`/host/contents/${id}`, payload);
    return normalizeContent(response.data);
  },

  deleteContent: async (id: number | string): Promise<{ message?: string }> => {
    const response = await api.delete<{ message?: string }>(`/host/contents/${id}`);
    return response.data;
  },

  getPublicContentDetail: async (id: number | string): Promise<HostPublicContentDetail> => {
    const response = await api.get<HostPublicContentDetail>(`/host/public/contents/${id}`);
    const row = response.data as any;
    return {
      ...row,
      hostContentMediaUrls: normalizeMediaUrls(row?.hostContentMediaUrls),
      hostContentViewCount: Number(row?.hostContentViewCount || 0),
      hostContentClickCount: Number(row?.hostContentClickCount || 0),
    };
  },

  getEarnings: async (page = 1, limit = 20): Promise<PaginatedResponse<HostEarning>> => {
    const response = await api.get<PaginatedResponse<HostEarning>>('/host/earnings', {
      params: { page, limit },
    });
    const rows = Array.isArray(response.data?.data) ? response.data.data : [];

    return {
      data: rows.map((item) => normalizeHostEarning(item)),
      meta: {
        page: Number(response.data?.meta?.page || 1),
        limit: Number(response.data?.meta?.limit || 20),
        totalItems: Number(response.data?.meta?.totalItems || 0),
      },
    };
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
    const response = await fetch(`${API_BASE_URL}/upload/images`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const data = (await response.json().catch(() => null)) as
      | (UploadMediaResponse & { error?: string })
      | null;

    if (!response.ok) {
      const serverMessage =
        typeof data?.error === 'string' && data.error.trim()
          ? data.error.trim()
          : 'Không thể tải ảnh lên máy chủ.';
      throw new Error(serverMessage);
    }

    if (!data?.urls || !Array.isArray(data.urls)) {
      throw new Error('Invalid upload response');
    }

    return data;
  },
};
