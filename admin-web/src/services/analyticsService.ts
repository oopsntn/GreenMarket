import { apiClient } from "../lib/apiClient";
import type {
  AnalyticsApiResponse,
  AnalyticsDailyTrafficPoint,
  AnalyticsKpiCard,
  TopPlacement,
} from "../types/analytics";

const buildQuery = (fromDate: string, toDate: string) => {
  const params = new URLSearchParams();
  params.set("fromDate", fromDate);
  params.set("toDate", toDate);
  return `?${params.toString()}`;
};

export const analyticsService = {
  async getAnalyticsSummary(
    fromDate: string,
    toDate: string,
  ): Promise<AnalyticsApiResponse> {
    return apiClient.request<AnalyticsApiResponse>(
      `/api/admin/analytics${buildQuery(fromDate, toDate)}`,
      {
        defaultErrorMessage: "Unable to load analytics summary.",
      },
    );
  },

  getEmptyAnalytics(): AnalyticsApiResponse {
    return {
      kpiCards: [] as AnalyticsKpiCard[],
      topPlacements: [] as TopPlacement[],
      dailyTraffic: [] as AnalyticsDailyTrafficPoint[],
    };
  },
};
