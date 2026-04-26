import { apiClient, resolveImageUrl } from "../lib/apiClient";
import type {
  HostContentAdminDetail,
  HostContentAdminFilters,
  HostContentAdminItem,
  HostContentAdminListResult,
  HostContentStatus,
} from "../types/hostContentAdmin";

type HostContentListApiResponse = {
  data: Array<{
    hostContentId: number;
    authorId: number;
    title: string;
    description: string | null;
    category: string;
    status: HostContentStatus;
    statusLabel: string;
    payoutAmount: number;
    viewCount: number;
    createdAt: string | null;
    updatedAt: string | null;
    mediaCount: number;
    authorName: string;
    authorEmail: string | null;
  }>;
  meta: HostContentAdminListResult["meta"];
  summary: {
    totalContents: number;
    pendingContents: number;
    publishedContents: number;
    rejectedContents: number;
    totalPayout: number;
  };
};

type HostContentDetailApiResponse = {
  data: Omit<
    HostContentAdminDetail,
    | "payoutAmountLabel"
    | "createdAt"
    | "updatedAt"
    | "mediaUrls"
  > & {
    createdAt: string | null;
    updatedAt: string | null;
    mediaUrls: string[];
  };
};

const formatCurrency = (value: number | string | null | undefined) => {
  const numeric = Number(value ?? 0);
  return `${numeric.toLocaleString("vi-VN")} VND`;
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return "--";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
};

const normalizeItem = (
  item: HostContentListApiResponse["data"][number],
): HostContentAdminItem => ({
  ...item,
  payoutAmountLabel: formatCurrency(item.payoutAmount),
  createdAt: formatDateTime(item.createdAt),
  updatedAt: formatDateTime(item.updatedAt),
});

const buildQuery = (filters: HostContentAdminFilters) => {
  const params = new URLSearchParams();

  if (filters.keyword.trim()) {
    params.set("keyword", filters.keyword.trim());
  }

  if (filters.status !== "all") {
    params.set("status", filters.status);
  }

  if (filters.category.trim()) {
    params.set("category", filters.category.trim());
  }

  params.set("page", String(filters.page));
  params.set("limit", String(filters.limit));

  return params.toString();
};

export const hostContentAdminService = {
  async getHostContents(
    filters: HostContentAdminFilters,
  ): Promise<HostContentAdminListResult> {
    const query = buildQuery(filters);
    const response = await apiClient.request<HostContentListApiResponse>(
      `/api/admin/host-contents${query ? `?${query}` : ""}`,
      {
        defaultErrorMessage: "Không thể tải danh sách nội dung Host.",
      },
    );

    return {
      data: response.data.map(normalizeItem),
      meta: response.meta,
      summary: {
        ...response.summary,
        totalPayoutLabel: formatCurrency(response.summary.totalPayout),
      },
    };
  },

  async getHostContentDetail(id: number): Promise<HostContentAdminDetail> {
    const response = await apiClient.request<HostContentDetailApiResponse>(
      `/api/admin/host-contents/${id}`,
      {
        defaultErrorMessage: "Không thể tải chi tiết nội dung Host.",
      },
    );

    return {
      ...response.data,
      payoutAmountLabel: formatCurrency(response.data.payoutAmount),
      createdAt: formatDateTime(response.data.createdAt),
      updatedAt: formatDateTime(response.data.updatedAt),
      mediaUrls: response.data.mediaUrls.map(resolveImageUrl),
    };
  },

  async updateHostContentStatus(
    id: number,
    payload: { status: HostContentStatus; note?: string },
  ) {
    await apiClient.request(`/api/admin/host-contents/${id}/status`, {
      method: "PATCH",
      includeJsonContentType: true,
      body: JSON.stringify(payload),
      defaultErrorMessage: "Không thể cập nhật trạng thái nội dung Host.",
    });
  },
};
