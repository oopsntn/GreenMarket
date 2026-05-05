import type { PlacementSlotStatus } from "./placementSlot";

export type PromotionPackageSlot = string;
export type PromotionPackageStatus = "Active" | "Disabled";

export type PromotionPackage = {
  id: number;
  name: string;
  slot: PromotionPackageSlot;
  slotCode: string;
  durationDays: number;
  price: string;
  maxPosts: number;
  displayQuota: number;
  status: PromotionPackageStatus;
  description: string;
};

export type PromotionPackageApiResponse = {
  promotionPackageId: number;
  promotionPackageSlotId: number | null;
  promotionPackageTitle: string | null;
  promotionPackageDurationDays: number | null;
  promotionPackagePrice: string | number | null;
  promotionPackageMaxPosts: number | null;
  promotionPackageDisplayQuota: number | null;
  promotionPackageDescription: string | null;
  promotionPackagePublished: boolean | null;
  promotionPackageCreatedAt?: string | null;
  slotCode?: string | null;
  slotTitle?: string | null;
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

export type PromotionPackageSlotOption = {
  id: number;
  code: string;
  label: PromotionPackageSlot;
  status: PlacementSlotStatus;
};

export type PromotionPackageSummaryCard = {
  title: string;
  value: string;
  subtitle: string;
};
