import type { AnalyticsKpiCard, TopPlacement } from "../types/analytics";

export const analyticsKpiCards: AnalyticsKpiCard[] = [
  { title: "Total Views", value: "128,450", change: "+12.4%" },
  { title: "CTR", value: "4.8%", change: "+0.9%" },
  { title: "Conversions", value: "1,245", change: "+6.3%" },
  { title: "Revenue", value: "$8,920", change: "+14.1%" },
];

export const topPlacements: TopPlacement[] = [
  {
    id: 1,
    slot: "Home Top",
    impressions: "48,200",
    clicks: "3,410",
    ctr: "7.1%",
    revenue: "$3,200",
  },
  {
    id: 2,
    slot: "Category Top",
    impressions: "34,100",
    clicks: "1,620",
    ctr: "4.8%",
    revenue: "$2,450",
  },
  {
    id: 3,
    slot: "Search Boost",
    impressions: "22,800",
    clicks: "890",
    ctr: "3.9%",
    revenue: "$1,780",
  },
];
