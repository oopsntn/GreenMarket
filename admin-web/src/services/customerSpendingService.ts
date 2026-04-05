import { apiClient } from "../lib/apiClient";
import type {
  CustomerSpendingApiResponse,
  CustomerSpendingCard,
  CustomerSpendingRow,
} from "../types/customerSpending";

const buildQuery = (fromDate: string, toDate: string) => {
  const params = new URLSearchParams();
  params.set("fromDate", fromDate);
  params.set("toDate", toDate);
  return `?${params.toString()}`;
};

export const customerSpendingService = {
  async getCustomerSpendingSummary(
    fromDate: string,
    toDate: string,
  ): Promise<CustomerSpendingApiResponse> {
    return apiClient.request<CustomerSpendingApiResponse>(
      `/api/admin/customer-spending${buildQuery(fromDate, toDate)}`,
      {
        defaultErrorMessage: "Unable to load customer spending summary.",
      },
    );
  },

  getEmptyCustomerSpending(): CustomerSpendingApiResponse {
    return {
      summaryCards: [] as CustomerSpendingCard[],
      rows: [] as CustomerSpendingRow[],
    };
  },
};
