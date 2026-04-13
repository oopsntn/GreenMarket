import { apiClient } from "../lib/apiClient";
import type {
  AnalyticsApiResponse,
  AnalyticsDailyTrafficPoint,
  AnalyticsKpiCard,
  TopPlacement,
} from "../types/analytics";
import type { ReportingSlotCatalogItem } from "../types/reportingSlot";

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

const normalizeSlotLabel = (value: string) => value.trim();

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
    return true;
  });
};

const normalizeAnalyticsResponse = (
  response: AnalyticsApiResponse,
): AnalyticsApiResponse => ({
  ...response,
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
