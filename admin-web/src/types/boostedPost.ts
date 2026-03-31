export type BoostedPostSlot = "Home Top" | "Category Top" | "Search Boost";

export type BoostedPostStatus =
  | "Scheduled"
  | "Active"
  | "Paused"
  | "Completed"
  | "Expired"
  | "Closed";

export type BoostedPost = {
  id: number;
  postTitle: string;
  ownerName: string;
  slot: BoostedPostSlot;
  packageName: string;
  startDate: string;
  endDate: string;
  status: BoostedPostStatus;
  impressions: number;
  clicks: number;
  remainingQuota: number;
  notes: string;
};

export type BoostedPostSummaryCard = {
  title: string;
  value: string;
  subtitle: string;
};
