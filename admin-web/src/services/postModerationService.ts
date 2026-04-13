import { apiClient } from "../lib/apiClient";
import type {
  ApiModerationPostDetailResponse,
  ApiModerationPostResponse,
  PostModerationItem,
  PostModerationStatus,
} from "../types/postModeration";
import { getAdminProfile } from "../utils/adminSession";

const formatDateTime = (value: string | null) => {
  if (!value) return "Chưa có dữ liệu";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có dữ liệu";

  const day = date.toISOString().slice(0, 10);
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;

  return `${day} ${time}`;
};

const formatCurrency = (value: string | number | null) => {
  if (value === null || value === undefined || value === "") {
    return "Thỏa thuận";
  }

  const numericValue =
    typeof value === "number" ? value : Number.parseFloat(String(value));

  if (Number.isNaN(numericValue)) {
    return "Thỏa thuận";
  }

  return `${numericValue.toLocaleString("vi-VN")} VND`;
};

const mapStatus = (value: string | null): PostModerationStatus => {
  switch ((value || "").toLowerCase()) {
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "hidden":
      return "Hidden";
    case "draft":
      return "Draft";
    case "pending":
    default:
      return "Pending";
  }
};

const mapPostToUi = (
  item: ApiModerationPostResponse | ApiModerationPostDetailResponse,
): PostModerationItem => ({
  id: item.postId,
  title: item.postTitle?.trim() || `Bài đăng #${item.postId}`,
  slug: item.postSlug?.trim() || "",
  authorLabel: `Người dùng #${item.postAuthorId}`,
  shopLabel: item.postShopId
    ? `Cửa hàng #${item.postShopId}`
    : "Chưa có cửa hàng",
  categoryLabel: item.categoryId
    ? `Danh mục #${item.categoryId}`
    : "Chưa có danh mục",
  priceLabel: formatCurrency(item.postPrice),
  location: item.postLocation?.trim() || "Chưa có địa điểm",
  contactPhone: item.postContactPhone?.trim() || "Chưa có số điện thoại",
  status: mapStatus(item.postStatus),
  publishedLabel: item.postPublished ? "Đã xuất bản" : "Chưa xuất bản",
  submittedAt: formatDateTime(item.postSubmittedAt || item.postCreatedAt),
  moderatedAt: formatDateTime(item.postModeratedAt),
  views: item.postViewCount ?? 0,
  contacts: item.postContactCount ?? 0,
  rejectedReason: item.postRejectedReason?.trim() || "Chưa có lý do từ chối",
  images:
    "images" in item
      ? (item.images ?? [])
          .map((image) => image.imageUrl?.trim() || "")
          .filter((imageUrl) => imageUrl.length > 0)
      : [],
  attributes:
    "attributes" in item
      ? (item.attributes ?? [])
          .map((attribute) => ({
            id: attribute.attributeId ?? 0,
            value: attribute.attributeValue?.trim() || "Chưa có giá trị",
          }))
          .filter((attribute) => attribute.id > 0)
      : [],
});

const mapStatusToApi = (status: PostModerationStatus) => status.toLowerCase();

export const postModerationService = {
  async fetchPosts(): Promise<PostModerationItem[]> {
    const data = await apiClient.request<ApiModerationPostResponse[]>(
      "/api/admin/posts",
      {
        defaultErrorMessage: "Không thể tải danh sách bài đăng kiểm duyệt.",
      },
    );

    return data.map(mapPostToUi);
  },

  async fetchPostById(postId: number): Promise<PostModerationItem> {
    const data = await apiClient.request<ApiModerationPostDetailResponse>(
      `/api/admin/posts/${postId}`,
      {
        defaultErrorMessage: "Không thể tải chi tiết bài đăng.",
      },
    );

    return mapPostToUi(data);
  },

  async updatePostStatus(
    postId: number,
    status: Extract<PostModerationStatus, "Approved" | "Rejected" | "Pending">,
    reason?: string,
  ): Promise<PostModerationItem> {
    const adminProfile = getAdminProfile();

    const data = await apiClient.request<ApiModerationPostResponse>(
      `/api/admin/posts/${postId}/status`,
      {
        method: "PATCH",
        includeJsonContentType: true,
        defaultErrorMessage: "Không thể cập nhật trạng thái bài đăng.",
        body: JSON.stringify({
          status: mapStatusToApi(status),
          adminName: adminProfile?.fullName,
          ...(reason?.trim() ? { reason: reason.trim() } : {}),
        }),
      },
    );

    return mapPostToUi(data);
  },

  async hidePost(postId: number, reason?: string): Promise<PostModerationItem> {
    const adminProfile = getAdminProfile();

    const data = await apiClient.request<{
      deletedPost: ApiModerationPostResponse;
    }>(`/api/admin/posts/${postId}`, {
      method: "DELETE",
      includeJsonContentType: true,
      defaultErrorMessage: "Không thể ẩn bài đăng.",
      body: JSON.stringify({
        adminId: adminProfile?.id,
        adminName: adminProfile?.fullName,
        ...(reason?.trim() ? { reason: reason.trim() } : {}),
      }),
    });

    return mapPostToUi(data.deletedPost);
  },
};
