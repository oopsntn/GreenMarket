import type { ReportingSlotCatalogItem } from "./reportingSlot";

export type RevenueCard = {
  title: string;
  value: string;
  note: string;
};

export type RevenueRow = {
  id: number;
  packageName: string;
  slot: string;
  orders: number;
  revenue: string;
  growth: string;
};

export type RevenueApiResponse = {
  summaryCards: RevenueCard[];
  rows: RevenueRow[];
  slotCatalog: ReportingSlotCatalogItem[];
};
