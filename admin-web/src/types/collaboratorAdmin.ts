export type CollaboratorRelationshipStatus =
  | "active"
  | "pending"
  | "rejected"
  | "removed";

export type CollaboratorRelationship = {
  relationshipId: number;
  shopId: number;
  collaboratorId: number;
  shopName: string;
  shopStatus: string | null;
  collaboratorName: string;
  collaboratorEmail: string | null;
  collaboratorMobile: string | null;
  roleTitle: string;
  relationshipStatus: CollaboratorRelationshipStatus;
  relationshipStatusLabel: string;
  joinedAt: string;
  publishedPostCount: number;
  pendingPostCount: number;
};

export type CollaboratorRelationshipSummary = {
  totalRelationships: number;
  activeRelationships: number;
  pendingRelationships: number;
  endedRelationships: number;
};

export type CollaboratorRelationshipListResult = {
  data: CollaboratorRelationship[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  summary: CollaboratorRelationshipSummary;
};

export type CollaboratorRecentPost = {
  postId: number;
  title: string;
  status: string;
  statusLabel: string;
  createdAt: string;
  updatedAt: string;
};

export type CollaboratorDetail = {
  shopId: number;
  collaboratorId: number;
  shopName: string;
  shopStatus: string | null;
  shopEmail: string | null;
  shopPhone: string | null;
  collaboratorName: string;
  collaboratorEmail: string | null;
  collaboratorMobile: string | null;
  collaboratorLocation: string | null;
  collaboratorBio: string | null;
  roleCode: string | null;
  roleTitle: string;
  relationshipStatus: CollaboratorRelationshipStatus;
  relationshipStatusLabel: string;
  joinedAt: string;
  postSummary: {
    totalPosts: number;
    approvedPosts: number;
    pendingPosts: number;
    rejectedPosts: number;
  };
  recentPosts: CollaboratorRecentPost[];
};

export type CollaboratorFilters = {
  keyword: string;
  status: CollaboratorRelationshipStatus | "all";
  page: number;
  limit: number;
};
