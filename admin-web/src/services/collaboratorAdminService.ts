import { apiClient } from "../lib/apiClient";
import type {
  CollaboratorDetail,
  CollaboratorFilters,
  CollaboratorRelationship,
  CollaboratorRelationshipListResult,
} from "../types/collaboratorAdmin";

type CollaboratorListApiResponse = {
  data: Array<{
    relationshipId: number;
    shopId: number;
    collaboratorId: number;
    shopName: string;
    shopStatus: string | null;
    collaboratorName: string;
    collaboratorEmail: string | null;
    collaboratorMobile: string | null;
    roleTitle: string;
    relationshipStatus: CollaboratorRelationship["relationshipStatus"];
    relationshipStatusLabel: string;
    joinedAt: string | null;
    publishedPostCount: number;
    pendingPostCount: number;
  }>;
  meta: CollaboratorRelationshipListResult["meta"];
  summary: CollaboratorRelationshipListResult["summary"];
};

type CollaboratorDetailApiResponse = {
  data: Omit<CollaboratorDetail, "joinedAt" | "recentPosts"> & {
    joinedAt: string | null;
    recentPosts: Array<{
      postId: number;
      title: string;
      status: string;
      createdAt: string | null;
      updatedAt: string | null;
    }>;
  };
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

const getPostStatusLabel = (status: string) => {
  switch (status) {
    case "approved":
      return "Đã duyệt";
    case "pending":
      return "Chờ kiểm duyệt";
    case "pending_owner":
      return "Chờ chủ vườn duyệt";
    case "rejected":
      return "Từ chối";
    case "hidden":
      return "Đã ẩn";
    default:
      return status || "Chưa xác định";
  }
};

const getShopStatusLabel = (status: string | null | undefined) => {
  switch ((status ?? "").trim().toLowerCase()) {
    case "active":
      return "Đang hoạt động";
    case "pending":
      return "Chờ duyệt";
    case "blocked":
      return "Đã khóa";
    case "closed":
      return "Đã đóng";
    default:
      return status?.trim() || "--";
  }
};

const normalizeItem = (
  item: CollaboratorListApiResponse["data"][number],
): CollaboratorRelationship => ({
  ...item,
  shopStatus: getShopStatusLabel(item.shopStatus),
  joinedAt: formatDateTime(item.joinedAt),
});

const buildQuery = (filters: CollaboratorFilters) => {
  const params = new URLSearchParams();

  if (filters.keyword.trim()) {
    params.set("keyword", filters.keyword.trim());
  }

  if (filters.status !== "all") {
    params.set("status", filters.status);
  }

  params.set("page", String(filters.page));
  params.set("limit", String(filters.limit));

  return params.toString();
};

export const collaboratorAdminService = {
  async getRelationships(
    filters: CollaboratorFilters,
  ): Promise<CollaboratorRelationshipListResult> {
    const query = buildQuery(filters);
    const response = await apiClient.request<CollaboratorListApiResponse>(
      `/api/admin/collaborators${query ? `?${query}` : ""}`,
      {
        defaultErrorMessage: "Không thể tải danh sách cộng tác viên.",
      },
    );

    return {
      data: response.data.map(normalizeItem),
      meta: response.meta,
      summary: response.summary,
    };
  },

  async getRelationshipDetail(
    collaboratorId: number,
    shopId: number,
  ): Promise<CollaboratorDetail> {
    const response = await apiClient.request<CollaboratorDetailApiResponse>(
      `/api/admin/collaborators/${collaboratorId}?shopId=${shopId}`,
      {
        defaultErrorMessage: "Không thể tải chi tiết cộng tác viên.",
      },
    );

    return {
      ...response.data,
      shopStatus: getShopStatusLabel(response.data.shopStatus),
      joinedAt: formatDateTime(response.data.joinedAt),
      recentPosts: response.data.recentPosts.map((post) => ({
        ...post,
        statusLabel: getPostStatusLabel(post.status),
        createdAt: formatDateTime(post.createdAt),
        updatedAt: formatDateTime(post.updatedAt),
      })),
    };
  },
};
