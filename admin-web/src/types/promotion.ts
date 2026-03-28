export type PromotionSlot = "Home Top" | "Category Top" | "Search Boost";
export type PromotionStatus = "Active" | "Paused" | "Expired";

export type Promotion = {
  id: number;
  postTitle: string;
  owner: string;
  slot: PromotionSlot;
  packageName: string;
  startDate: string;
  endDate: string;
  status: PromotionStatus;
};
