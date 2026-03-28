import type { DashboardStatCard, DashboardSummary } from "../types/dashboard";

export const dashboardStatCards: DashboardStatCard[] = [
  {
    title: "Total Users",
    value: "1,250",
  },
  {
    title: "Total Posts",
    value: "3,480",
  },
  {
    title: "Pending Reports",
    value: "28",
  },
  {
    title: "Revenue",
    value: "$2,340",
  },
];

export const dashboardSummary: DashboardSummary = {
  title: "System Summary",
  description:
    "This area will later display analytics, latest activities, moderation status, promotion performance, and financial reports.",
};
