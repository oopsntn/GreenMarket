import type { AnalyticsKpiCard, TopPlacement } from "../types/analytics";

export const analyticsKpiCards: AnalyticsKpiCard[] = [
  { title: "Tổng lượt hiển thị", value: "128,450", change: "Độ phủ tăng 12,4%" },
  { title: "CTR", value: "4.8%", change: "+0.9%" },
  { title: "Lượt chuyển đổi", value: "1,245", change: "Tăng 6,3%" },
  { title: "Doanh thu quảng bá", value: "8,920,000 VND", change: "Tăng 14,1%" },
];

export const topPlacements: TopPlacement[] = [
  {
    id: 1,
    slot: "Vị trí 1 trang chủ",
    impressions: "48,200",
    clicks: "3,410",
    ctr: "7.1%",
    revenue: "3,200,000 VND",
  },
  {
    id: 2,
    slot: "Vị trí 2 trang chủ",
    impressions: "34,100",
    clicks: "1,620",
    ctr: "4.8%",
    revenue: "2,450,000 VND",
  },
  {
    id: 3,
    slot: "Vị trí 3 trang chủ",
    impressions: "22,800",
    clicks: "890",
    ctr: "3.9%",
    revenue: "1,780,000 VND",
  },
];
