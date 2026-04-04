import { apiClient } from "../lib/apiClient";
import type {
  DashboardApiResponse,
  DashboardStatCard,
  DashboardSummary,
} from "../types/dashboard";

const buildQuery = (fromDate: string, toDate: string) => {
  const params = new URLSearchParams();
  params.set("fromDate", fromDate);
  params.set("toDate", toDate);
  return `?${params.toString()}`;
};

export const dashboardService = {
  async getOverview(
    fromDate: string,
    toDate: string,
  ): Promise<DashboardApiResponse> {
    return apiClient.request<DashboardApiResponse>(
      `/api/admin/dashboard${buildQuery(fromDate, toDate)}`,
      {
        defaultErrorMessage: "Unable to load dashboard overview.",
      },
    );
  },

  getEmptyOverview(): DashboardApiResponse {
    return {
      statCards: [] as DashboardStatCard[],
      summary: {
        title: "System Summary",
        description: "Dashboard data will appear here after loading.",
      } as DashboardSummary,
    };
  },
};
