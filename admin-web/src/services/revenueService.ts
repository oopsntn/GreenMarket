import { apiClient } from "../lib/apiClient";
import type { RevenueApiResponse, RevenueCard, RevenueRow } from "../types/revenue";

const buildQuery = (fromDate: string, toDate: string) => {
  const params = new URLSearchParams();
  params.set("fromDate", fromDate);
  params.set("toDate", toDate);
  return `?${params.toString()}`;
};

export const revenueService = {
  async getRevenueSummary(
    fromDate: string,
    toDate: string,
  ): Promise<RevenueApiResponse> {
    return apiClient.request<RevenueApiResponse>(
      `/api/admin/revenue${buildQuery(fromDate, toDate)}`,
      {
        defaultErrorMessage: "Không thể tải báo cáo doanh thu.",
      },
    );
  },

  getEmptyRevenue(): RevenueApiResponse {
    return {
      summaryCards: [] as RevenueCard[],
      rows: [] as RevenueRow[],
      slotCatalog: [],
    };
  },
};
