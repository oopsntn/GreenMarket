import { dashboardStatCards, dashboardSummary } from "../mock-data/dashboard";
import type { DashboardStatCard, DashboardSummary } from "../types/dashboard";

export const dashboardService = {
  getStatCards(): DashboardStatCard[] {
    return dashboardStatCards;
  },

  getSummary(): DashboardSummary {
    return dashboardSummary;
  },
};
