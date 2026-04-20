import { apiClient } from "../lib/apiClient";
import type {
  RevenueApiResponse,
  RevenueCard,
  RevenueRow,
} from "../types/revenue";

const SUMMARY_TITLE_LABELS: Record<string, string> = {
  "Total Revenue": "Tổng doanh thu",
  "Active Packages": "Gói có phát sinh doanh thu",
  "Host / News Payout Cost": "Chi phí chi trả Host / News",
  "Estimated Profit": "Lợi nhuận tạm tính",
  "Avg. Order Value": "Giá trị đơn hàng trung bình",
  "Top Slot Revenue": "Vị trí có doanh thu cao nhất",
};

const SUMMARY_NOTE_REPLACEMENTS: Array<[string, string]> = [
  ["successful order(s) in period", "đơn hàng thanh toán thành công trong kỳ"],
  ["Packages with paid orders in period", "gói có đơn thanh toán thành công trong kỳ"],
  [
    "completed Host payout request(s) in period",
    "yêu cầu chi trả Host / News đã hoàn thành trong kỳ",
  ],
  [
    "Revenue minus completed Host / News payout cost",
    "doanh thu trừ chi phí chi trả Host / News đã hoàn tất",
  ],
  [
    "Average successful package payment",
    "giá trị trung bình của một giao dịch thanh toán thành công",
  ],
  ["No paid orders in period", "không có đơn thanh toán thành công trong kỳ"],
];

const SLOT_LABELS: Record<string, string> = {
  "Home Top": "Vị trí 1 trang chủ",
  "Category Top": "Vị trí 2 trang chủ",
  "Search Boost": "Vị trí 3 trang chủ",
  "Gói tài khoản": "Gói tài khoản",
  "Danh sách nhà vườn VIP": "Danh sách nhà vườn VIP",
  "Vị trí chưa xác định": "Vị trí chưa xác định",
};

const buildQuery = (fromDate: string, toDate: string) => {
  const params = new URLSearchParams();
  params.set("fromDate", fromDate);
  params.set("toDate", toDate);
  return `?${params.toString()}`;
};

const translateSummaryNote = (value: string) =>
  SUMMARY_NOTE_REPLACEMENTS.reduce(
    (result, [source, target]) => result.replaceAll(source, target),
    value,
  );

const translateSlot = (value: string) => SLOT_LABELS[value] || value;

const parseRevenueAmount = (value: string) => {
  const digits = value.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
};

const isUnknownValue = (value: string) => {
  const normalized = value.trim().toLowerCase();

  return (
    !normalized ||
    normalized.includes("unknown") ||
    normalized.includes("chưa xác định") ||
    normalized.includes("xác định")
  );
};

const getFallbackPackageName = (row: RevenueRow) => {
  const amount = parseRevenueAmount(row.revenue);

  if (amount === 30000) {
    return "Gói Cá Nhân Theo Tháng";
  }

  if (amount === 499000) {
    return "Gói Nhà Vườn VIP";
  }

  if (amount === 250000) {
    return "Gói Chủ Vườn Vĩnh Viễn";
  }

  return row.packageName;
};

const getFallbackSlot = (row: RevenueRow) => {
  const amount = parseRevenueAmount(row.revenue);

  if (amount === 30000 || amount === 250000) {
    return "Gói tài khoản";
  }

  if (amount === 499000) {
    return "Danh sách nhà vườn VIP";
  }

  return row.slot;
};

const normalizeRevenueRow = (row: RevenueRow): RevenueRow => {
  const packageName = isUnknownValue(row.packageName)
    ? getFallbackPackageName(row)
    : row.packageName;

  const slot = isUnknownValue(row.slot) ? getFallbackSlot(row) : row.slot;

  return {
    ...row,
    packageName,
    slot: translateSlot(slot),
  };
};

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
        note: translateSummaryNote(card.note),
      })),
      rows: response.rows.map(normalizeRevenueRow),
      slotCatalog: response.slotCatalog.map((item) => ({
        ...item,
        label: translateSlot(item.label),
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
