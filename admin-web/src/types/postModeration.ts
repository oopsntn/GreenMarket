export type PostModerationStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Hidden"
  | "Draft";

export type ApiModerationPostResponse = {
  postId: number;
  postAuthorId: number;
  postShopId: number | null;
  categoryId: number | null;
  postTitle: string;
  postSlug: string;
  postPrice: string | number | null;
  postLocation: string | null;
  postStatus: string;
  postRejectedReason: string | null;
  postContactPhone: string | null;
  postPublished: boolean | null;
  postViewCount: number | null;
  postContactCount: number | null;
  postSubmittedAt: string | null;
  postPublishedAt: string | null;
  postDeletedAt: string | null;
  postModeratedAt: string | null;
  postCreatedAt: string | null;
  postUpdatedAt: string | null;
};

export type ApiModerationPostDetailResponse = ApiModerationPostResponse & {
  images?: Array<{
    imageUrl?: string | null;
  }>;
  attributes?: Array<{
    attributeId?: number | null;
    attributeValue?: string | null;
  }>;
};

export type PostModerationAttribute = {
  id: number;
  value: string;
};

export type PostModerationItem = {
  id: number;
  title: string;
  slug: string;
  authorLabel: string;
  shopLabel: string;
  categoryLabel: string;
  priceLabel: string;
  location: string;
  contactPhone: string;
  status: PostModerationStatus;
  publishedLabel: string;
  submittedAt: string;
  moderatedAt: string;
  views: number;
  contacts: number;
  rejectedReason: string;
  images: string[];
  attributes: PostModerationAttribute[];
};
