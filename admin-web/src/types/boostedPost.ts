export type BoostedPostSlot = "Home Top" | "Category Top" | "Search Boost";

export type BoostedPostStatus =
  | "Scheduled"
  | "Active"
  | "Paused"
  | "Completed"
  | "Expired"
  | "Closed";

export type BoostedPostDeliveryHealth = "Healthy" | "Watch" | "At Risk";

export type BoostedPostReviewStatus =
  | "Approved"
  | "Needs Update"
  | "Escalated";

export type BoostedPost = {
  id: number;
  campaignCode: string;
  postTitle: string;
  ownerName: string;
  slot: BoostedPostSlot;
  packageName: string;
  startDate: string;
  endDate: string;
  status: BoostedPostStatus;
  deliveryHealth: BoostedPostDeliveryHealth;
  reviewStatus: BoostedPostReviewStatus;
  assignedOperator: string;
  totalQuota: number;
  usedQuota: number;
  impressions: number;
  clicks: number;
  lastOptimizedAt: string;
  notes: string;
};

export type BoostedPostSummaryCard = {
  title: string;
  value: string;
  subtitle: string;
};
