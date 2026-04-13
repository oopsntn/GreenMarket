import type { ReportingSlotCatalogItem } from "./reportingSlot";

export type AnalyticsKpiCard = {
  title: string;
  value: string;
  change: string;
};

export type TopPlacement = {
  id: number;
  slot: string;
  impressions: string;
  clicks: string;
  ctr: string;
  revenue: string;
};

export type AnalyticsDailyTrafficSlot = {
  slot: string;
  impressions: number;
};

export type AnalyticsDailyTrafficPoint = {
  date: string;
  slots: AnalyticsDailyTrafficSlot[];
};

export type AnalyticsApiResponse = {
  kpiCards: AnalyticsKpiCard[];
  topPlacements: TopPlacement[];
  dailyTraffic: AnalyticsDailyTrafficPoint[];
  slotCatalog: ReportingSlotCatalogItem[];
};
