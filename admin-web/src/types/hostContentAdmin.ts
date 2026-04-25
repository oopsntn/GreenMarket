export type HostContentStatus = "pending_admin" | "published" | "rejected";

export type HostContentAdminItem = {
  hostContentId: number;
  authorId: number;
  title: string;
  description: string | null;
  category: string;
  status: HostContentStatus;
  statusLabel: string;
  payoutAmount: number;
  payoutAmountLabel: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  mediaCount: number;
  authorName: string;
  authorEmail: string | null;
};

export type HostContentAdminSummary = {
  totalContents: number;
  pendingContents: number;
  publishedContents: number;
  rejectedContents: number;
  totalPayout: number;
  totalPayoutLabel: string;
};

export type HostContentAdminListResult = {
  data: HostContentAdminItem[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  summary: HostContentAdminSummary;
};

export type HostContentAdminDetail = {
  hostContentId: number;
  authorId: number;
  title: string;
  description: string | null;
  body: string | null;
  category: string;
  status: HostContentStatus;
  statusLabel: string;
  payoutAmount: number;
  payoutAmountLabel: string;
  viewCount: number;
  mediaUrls: string[];
  createdAt: string;
  updatedAt: string;
  authorName: string;
  authorEmail: string | null;
  authorMobile: string | null;
  authorLocation: string | null;
};

export type HostContentAdminFilters = {
  keyword: string;
  status: HostContentStatus | "all";
  category: string;
  page: number;
  limit: number;
};
