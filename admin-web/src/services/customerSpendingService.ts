import { apiClient } from "../lib/apiClient";
import type {
  CustomerSpendingApiResponse,
  CustomerSpendingCard,
  CustomerSpendingRow,
} from "../types/customerSpending";

const SUMMARY_TITLE_LABELS: Record<string, string> = {
  "Total Customers": "Tổng khách hàng chi tiêu",
  "Total Spending": "Tổng chi tiêu",
  "Avg. Spend / Customer": "Chi tiêu trung bình / khách",
  "Top Customer Spend": "Khách chi tiêu cao nhất",
};

const SUMMARY_NOTE_LABELS: Array<[string, string]> = [
  ["Customers with paid orders in period", "Khách hàng có giao dịch thanh toán thành công trong kỳ"],
  ["Successful promotion purchases", "Tổng chi tiêu từ các giao dịch mua gói thành công"],
  ["Average paid spend per customer", "Mức chi tiêu trung bình của mỗi khách hàng phát sinh giao dịch"],
  ["Highest customer spend in period", "Mức chi tiêu cao nhất của một khách hàng trong kỳ"],
];

const buildQuery = (fromDate: string, toDate: string) => {
  const params = new URLSearchParams();
  params.set("fromDate", fromDate);
  params.set("toDate", toDate);
  return `?${params.toString()}`;
};

const normalizeSummaryNote = (value: string) =>
  SUMMARY_NOTE_LABELS.reduce(
    (result, [source, target]) => result.replaceAll(source, target),
    value,
  );

export const customerSpendingService = {
  async getCustomerSpendingSummary(
    fromDate: string,
    toDate: string,
  ): Promise<CustomerSpendingApiResponse> {
    const response = await apiClient.request<CustomerSpendingApiResponse>(
      `/api/admin/customer-spending${buildQuery(fromDate, toDate)}`,
      {
        defaultErrorMessage: "Không thể tải báo cáo chi tiêu khách hàng.",
      },
    );

    return {
      ...response,
      summaryCards: response.summaryCards.map((card) => ({
        ...card,
        title: SUMMARY_TITLE_LABELS[card.title] || card.title,
        note: normalizeSummaryNote(card.note),
      })),
    };
  },

  getEmptyCustomerSpending(): CustomerSpendingApiResponse {
    return {
      summaryCards: [] as CustomerSpendingCard[],
      rows: [] as CustomerSpendingRow[],
    };
  },
};
