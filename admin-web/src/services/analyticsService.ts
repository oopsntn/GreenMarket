import { analyticsKpiCards, topPlacements } from "../mock-data/analytics";
import type { AnalyticsKpiCard, TopPlacement } from "../types/analytics";

export const analyticsService = {
  getKpiCards(): AnalyticsKpiCard[] {
    return analyticsKpiCards;
  },

  getTopPlacements(): TopPlacement[] {
    return topPlacements;
  },
};
