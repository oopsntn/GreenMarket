export type PromotionSlot = "Home Top" | "Category Top" | "Search Boost";
export type PromotionStatus = "Scheduled" | "Active" | "Paused" | "Expired";

export type Promotion = {
  id: number;
  postTitle: string;
  owner: string;
  slot: PromotionSlot;
  packageName: string;
  startDate: string;
  endDate: string;
  status: PromotionStatus;
  budget: string;
  note: string;
};

export type PromotionSummaryCard = {
  title: string;
  value: string;
  subtitle: string;
};
