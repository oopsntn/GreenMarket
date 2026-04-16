import { apiClient } from "../lib/apiClient";
import type {
  AnalyticsApiResponse,
  AnalyticsDailyTrafficPoint,
  AnalyticsKpiCard,
  TopPlacement,
} from "../types/analytics";
import type { ReportingSlotCatalogItem } from "../types/reportingSlot";

const KPI_TITLE_LABELS: Record<string, string> = {
  "Total Views": "Tổng lượt hiển thị",
  Conversions: "Lượt chuyển đổi",
  Revenue: "Doanh thu quảng bá",
};

const KPI_CHANGE_LABELS: Record<string, string> = {
  "Live delivery reach": "Độ phủ phân phối thực tế",
  "Across boosted campaigns": "Tỷ lệ nhấp trên các chiến dịch quảng bá",
  "Successful package purchases": "Giao dịch mua gói thành công",
  "Paid promotion revenue": "Doanh thu từ các gói quảng bá đã thanh toán",
};

const SLOT_LABELS: Record<string, string> = {
  "Home Top": "Vị trí 1 trang chủ",
  "Category Top": "Vị trí 2 trang chủ",
  "Search Boost": "Vị trí 3 trang chủ",
};

const buildQuery = (fromDate: string, toDate: string) => {
  const params = new URLSearchParams();
  params.set("fromDate", fromDate);
  params.set("toDate", toDate);
  return `?${params.toString()}`;
};

const parseMetricNumber = (value: string) => {
  const normalized = value.replace(/[^0-9.]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatNumber = (value: number) => value.toLocaleString("en-US");

const formatCurrency = (value: number) => `${value.toLocaleString("en-US")} VND`;

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const normalizeSlotLabel = (value: string) => {
  const normalized = value.trim();
  return SLOT_LABELS[normalized] || normalized;
};

const normalizeKpiCards = (items: AnalyticsKpiCard[]): AnalyticsKpiCard[] =>
  items.map((item) => ({
    ...item,
    title: KPI_TITLE_LABELS[item.title] || item.title,
    change: KPI_CHANGE_LABELS[item.change] || item.change,
  }));

const normalizeTopPlacements = (items: TopPlacement[]): TopPlacement[] => {
  const grouped = items.reduce<
    Map<
      string,
      {
        slot: string;
        impressions: number;
        clicks: number;
        revenue: number;
      }
    >
  >((accumulator, item) => {
    const slot = normalizeSlotLabel(item.slot);

    if (!slot) {
      return accumulator;
    }

    const key = slot.toLowerCase();
    const current = accumulator.get(key) ?? {
      slot,
      impressions: 0,
      clicks: 0,
      revenue: 0,
    };

    current.impressions += parseMetricNumber(item.impressions);
    current.clicks += parseMetricNumber(item.clicks);
    current.revenue += parseMetricNumber(item.revenue);
    accumulator.set(key, current);
    return accumulator;
  }, new Map());

  return Array.from(grouped.values())
    .sort((left, right) => right.impressions - left.impressions)
    .map((item, index) => ({
      id: index + 1,
      slot: item.slot,
      impressions: formatNumber(item.impressions),
      clicks: formatNumber(item.clicks),
      ctr: formatPercent(
        item.impressions > 0 ? (item.clicks / item.impressions) * 100 : 0,
      ),
      revenue: formatCurrency(item.revenue),
    }));
};

const normalizeDailyTraffic = (
  items: AnalyticsDailyTrafficPoint[],
): AnalyticsDailyTrafficPoint[] =>
  items.map((point) => {
    const grouped = point.slots.reduce<
      Map<string, { slot: string; impressions: number }>
    >((accumulator, item) => {
      const slot = normalizeSlotLabel(item.slot);

      if (!slot) {
        return accumulator;
      }

      const key = slot.toLowerCase();
      const current = accumulator.get(key) ?? {
        slot,
        impressions: 0,
      };

      current.impressions += item.impressions;
      accumulator.set(key, current);
      return accumulator;
    }, new Map());

    return {
      ...point,
      slots: Array.from(grouped.values()),
    };
  });

const normalizeSlotCatalog = (
  items: ReportingSlotCatalogItem[],
): ReportingSlotCatalogItem[] => {
  const seen = new Set<string>();

  return items.filter((item) => {
    const label = normalizeSlotLabel(item.label);

    if (!label) {
      return false;
    }

    const key = label.toLowerCase();
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    item.label = label;
    item.title = normalizeSlotLabel(item.title);
    return true;
  });
};

const normalizeAnalyticsResponse = (
  response: AnalyticsApiResponse,
): AnalyticsApiResponse => ({
  ...response,
  kpiCards: normalizeKpiCards(response.kpiCards),
  topPlacements: normalizeTopPlacements(response.topPlacements),
  dailyTraffic: normalizeDailyTraffic(response.dailyTraffic),
  slotCatalog: normalizeSlotCatalog(response.slotCatalog),
});

export const analyticsService = {
  async getAnalyticsSummary(
    fromDate: string,
    toDate: string,
  ): Promise<AnalyticsApiResponse> {
    const response = await apiClient.request<AnalyticsApiResponse>(
      `/api/admin/analytics${buildQuery(fromDate, toDate)}`,
      {
        defaultErrorMessage: "Không thể tải tổng quan phân tích.",
      },
    );

    return normalizeAnalyticsResponse(response);
  },

  getEmptyAnalytics(): AnalyticsApiResponse {
    return {
      kpiCards: [] as AnalyticsKpiCard[],
      topPlacements: [] as TopPlacement[],
      dailyTraffic: [] as AnalyticsDailyTrafficPoint[],
      slotCatalog: [],
    };
  },
};
