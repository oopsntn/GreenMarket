export type PromotionPackageSlot = "Home Top" | "Category Top" | "Search Boost";
export type PromotionPackageStatus = "Active" | "Disabled";

export type PromotionPackage = {
  id: number;
  name: string;
  slot: PromotionPackageSlot;
  durationDays: number;
  price: string;
  maxPosts: number;
  displayQuota: number;
  status: PromotionPackageStatus;
  description: string;
};

export type PromotionPackageFormState = {
  name: string;
  slot: PromotionPackageSlot;
  durationDays: number;
  price: string;
  maxPosts: number;
  displayQuota: number;
  description: string;
};

export type PromotionPackageSummaryCard = {
  title: string;
  value: string;
  subtitle: string;
};
