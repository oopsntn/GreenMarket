import { apiClient } from "../lib/apiClient";
import type { RevenueApiResponse, RevenueCard, RevenueRow } from "../types/revenue";

const SUMMARY_TITLE_LABELS: Record<string, string> = {
  "Total Revenue": "Tổng doanh thu",
  "Active Packages": "Gói có phát sinh doanh thu",
  "Avg. Order Value": "Giá trị đơn hàng trung bình",
  "Top Slot Revenue": "Vị trí có doanh thu cao nhất",
};

const SUMMARY_NOTE_LABELS: Array<[string, string]> = [
  ["successful order(s) in period", "đơn hàng thanh toán thành công trong kỳ"],
  ["Packages with paid orders in period", "các gói có đơn thanh toán thành công trong kỳ"],
  ["Average successful package payment", "giá trị trung bình của một giao dịch thành công"],
  ["No paid orders in period", "không có đơn thanh toán thành công trong kỳ"],
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

export const revenueService = {
  async getRevenueSummary(
    fromDate: string,
    toDate: string,
  ): Promise<RevenueApiResponse> {
    const response = await apiClient.request<RevenueApiResponse>(
      `/api/admin/revenue${buildQuery(fromDate, toDate)}`,
      {
        defaultErrorMessage: "Không thể tải báo cáo doanh thu.",
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

  getEmptyRevenue(): RevenueApiResponse {
    return {
      summaryCards: [] as RevenueCard[],
      rows: [] as RevenueRow[],
      slotCatalog: [],
    };
  },
};
