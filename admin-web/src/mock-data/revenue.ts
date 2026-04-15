import type { RevenueCard, RevenueRow } from "../types/revenue";

export const revenueCards: RevenueCard[] = [
  { title: "Total Revenue", value: "$18,420", note: "+12.6% vs last month" },
  { title: "Active Packages", value: "126", note: "+8 this week" },
  { title: "Avg. Order Value", value: "$146", note: "+4.2% improvement" },
  { title: "Top Slot Revenue", value: "Home Top", note: "$7,800 generated" },
];

export const revenueRows: RevenueRow[] = [
  {
    id: 1,
    packageName: "Premium 7 Days",
    slot: "Home Top",
    orders: 42,
    revenue: "$7,800",
  },
  {
    id: 2,
    packageName: "Standard 5 Days",
    slot: "Category Top",
    orders: 38,
    revenue: "$5,240",
  },
  {
    id: 3,
    packageName: "Boost 3 Days",
    slot: "Search Boost",
    orders: 31,
    revenue: "$3,120",
  },
  {
    id: 4,
    packageName: "Starter 2 Days",
    slot: "Search Boost",
    orders: 18,
    revenue: "$1,260",
  },
];
