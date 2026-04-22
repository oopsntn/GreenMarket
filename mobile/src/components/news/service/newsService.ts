import { api } from '../../../config/api';

export type HostPublicContent = {
  hostContentId: number;
  hostContentTitle: string;
  hostContentDescription?: string | null;
  hostContentCategory?: string | null;
  hostContentMediaUrls?: string[] | string | null;
  hostContentCreatedAt?: string | null;
  hostContentViewCount?: number | string | null;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

export type PaginatedHostPublicContents = {
  data: HostPublicContent[];
  meta: PaginationMeta;
};

const normalizeMediaUrls = (raw: unknown): string[] => {
  if (Array.isArray(raw)) return raw.filter((x) => typeof x === 'string' && x.length > 0) as string[];
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

export const newsService = {
  getPublicContents: async (params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedHostPublicContents> => {
    const response = await api.get<{ data: HostPublicContent[]; meta: PaginationMeta }>(
      '/host/public/contents',
      { params },
    );

    const rows = Array.isArray(response.data?.data) ? response.data.data : [];
    const meta = response.data?.meta;

    return {
      data: rows.map((row) => ({
        ...row,
        hostContentMediaUrls: normalizeMediaUrls((row as any)?.hostContentMediaUrls),
        hostContentViewCount: Number((row as any)?.hostContentViewCount || 0),
      })),
      meta: {
        page: Number(meta?.page || 1),
        limit: Number(meta?.limit || params?.limit || 10),
        totalItems: Number(meta?.totalItems || 0),
        totalPages: Number(meta?.totalPages || 1),
      },
    };
  },

  checkSaved: async (contentId: number): Promise<boolean> => {
    const res = await api.get<{ isSaved?: boolean }>(`/host/favorites/${contentId}/check`);
    return Boolean(res.data?.isSaved);
  },

  toggleSaved: async (contentId: number): Promise<boolean> => {
    const res = await api.post<{ isSaved?: boolean }>(`/host/favorites/${contentId}`);
    return Boolean(res.data?.isSaved);
  },
};

