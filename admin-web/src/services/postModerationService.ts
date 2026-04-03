import { apiClient } from "../lib/apiClient";
import { getAdminProfile } from "../utils/adminSession";
import type {
  ApiModerationPostDetailResponse,
  ApiModerationPostResponse,
  PostModerationItem,
  PostModerationStatus,
} from "../types/postModeration";

const formatDateTime = (value: string | null) => {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  const day = date.toISOString().slice(0, 10);
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;

  return `${day} ${time}`;
};

const formatCurrency = (value: string | number | null) => {
  if (value === null || value === undefined || value === "") {
    return "Negotiable";
  }

  const numericValue =
    typeof value === "number" ? value : Number.parseFloat(String(value));

  if (Number.isNaN(numericValue)) {
    return "Negotiable";
  }

  return `${numericValue.toLocaleString("en-US")} VND`;
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
): PostModerationItem => {
  return {
    id: item.postId,
    title: item.postTitle?.trim() || `Post #${item.postId}`,
    slug: item.postSlug?.trim() || "",
    authorLabel: `User #${item.postAuthorId}`,
    shopLabel: item.postShopId ? `Shop #${item.postShopId}` : "No shop",
    categoryLabel: item.categoryId ? `Category #${item.categoryId}` : "No category",
    priceLabel: formatCurrency(item.postPrice),
    location: item.postLocation?.trim() || "No location",
    contactPhone: item.postContactPhone?.trim() || "No phone",
    status: mapStatus(item.postStatus),
    publishedLabel: item.postPublished ? "Published" : "Not published",
    submittedAt: formatDateTime(item.postSubmittedAt || item.postCreatedAt),
    moderatedAt: formatDateTime(item.postModeratedAt),
    views: item.postViewCount ?? 0,
    contacts: item.postContactCount ?? 0,
    rejectedReason: item.postRejectedReason?.trim() || "No rejection reason",
    content: item.postContent?.trim() || "No content provided.",
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
              value: attribute.attributeValue?.trim() || "No value",
            }))
            .filter((attribute) => attribute.id > 0)
        : [],
  };
};

const mapStatusToApi = (status: PostModerationStatus) => status.toLowerCase();

export const postModerationService = {
  async fetchPosts(): Promise<PostModerationItem[]> {
    const data = await apiClient.request<ApiModerationPostResponse[]>(
      "/api/admin/posts",
      {
        defaultErrorMessage: "Unable to load moderation posts.",
      },
    );

    return data.map(mapPostToUi);
  },

  async fetchPostById(postId: number): Promise<PostModerationItem> {
    const data = await apiClient.request<ApiModerationPostDetailResponse>(
      `/api/admin/posts/${postId}`,
      {
        defaultErrorMessage: "Unable to load post details.",
      },
    );

    return mapPostToUi(data);
  },

  async updatePostStatus(
    postId: number,
    status: Extract<PostModerationStatus, "Approved" | "Rejected" | "Pending">,
    reason?: string,
  ): Promise<PostModerationItem> {
    const data = await apiClient.request<ApiModerationPostResponse>(
      `/api/admin/posts/${postId}/status`,
      {
        method: "PATCH",
        includeJsonContentType: true,
        defaultErrorMessage: "Unable to update post status.",
        body: JSON.stringify({
          status: mapStatusToApi(status),
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
      defaultErrorMessage: "Unable to hide post.",
      body: JSON.stringify({
        adminId: adminProfile?.id,
        ...(reason?.trim() ? { reason: reason.trim() } : {}),
      }),
    });

    return mapPostToUi(data.deletedPost);
  },
};
