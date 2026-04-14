import { apiClient } from "../lib/apiClient";
import type {
  AIInsightFocus,
  AIInsightFocusFilter,
  AIInsightHistoryItem,
  AIInsightOverview,
  AIInsightSettings,
  AIInsightSummaryCard,
  AIInsightTone,
  AITrendScoreRow,
} from "../types/aiInsight";

const AI_INSIGHTS_API_PATH = "/api/admin/ai-insights";

const TEXT_REPLACEMENTS: Array<[string, string]> = [
  ["System Administrator", "Quản trị viên hệ thống"],
  ["Home Top", "Trang chủ nổi bật"],
  ["Category Top", "Danh mục nổi bật"],
  ["Search Boost", "Tăng tìm kiếm"],
  ["Placement Performance summary", "Tóm tắt hiệu quả vị trí hiển thị"],
  ["Promotion Watchlist summary", "Tóm tắt khuyến mãi cần theo dõi"],
  ["Revenue Signals summary", "Tóm tắt tín hiệu doanh thu"],
  ["Operator Load summary", "Tóm tắt khối lượng vận hành"],
  [
    "Homepage traffic stayed stable while Category Top outperformed revenue expectations in the final week of March. Keep Category Top inventory available because it is converting best among active slots.",
    "Lưu lượng trang chủ giữ ở mức ổn định, trong khi Danh mục nổi bật vượt kỳ vọng doanh thu ở tuần cuối tháng 3. Nên tiếp tục duy trì vị trí Danh mục nổi bật vì đây là slot chuyển đổi tốt nhất trong các slot đang hoạt động.",
  ],
  [
    "Search Boost campaigns that expired on 2026-03-26 still show demand signals. Review whether any eligible cases should be reopened after payment confirmation.",
    "Các chiến dịch Tăng tìm kiếm hết hạn vào ngày 2026-03-26 vẫn cho thấy tín hiệu nhu cầu. Cần rà soát xem trường hợp nào đủ điều kiện để mở lại sau khi xác nhận thanh toán.",
  ],
  [
    "March revenue was concentrated in Homepage and Category Top packages. Search Boost volume increased late in the month but paid contribution is still smaller than premium placements.",
    "Doanh thu tháng 3 tập trung chủ yếu ở các gói Trang chủ nổi bật và Danh mục nổi bật. Tăng tìm kiếm tăng về số lượng ở cuối tháng nhưng đóng góp doanh thu vẫn thấp hơn các vị trí cao cấp.",
  ],
  [
    "Ops Team B handled the largest number of category campaigns. The current load remains acceptable, but new escalations should be balanced toward Team A for the next cycle.",
    "Nhóm vận hành B đang xử lý nhiều chiến dịch danh mục nhất. Khối lượng hiện tại vẫn trong ngưỡng chấp nhận, nhưng các ca leo thang mới nên được phân bổ thêm cho Nhóm vận hành A ở chu kỳ tiếp theo.",
  ],
  [
    "Early March homepage impressions were healthy but softened before premium 30-day inventory was activated. Review creative freshness for homepage premium buyers.",
    "Lượt hiển thị trang chủ đầu tháng 3 ở mức tốt nhưng giảm dần trước khi gói cao cấp 30 ngày được kích hoạt. Cần rà soát lại độ mới của nội dung quảng bá dành cho khách mua vị trí trang chủ.",
  ],
  [
    "Average order value is currently supported by premium homepage packages, while smaller search packages are driving order count. Keep both tiers visible in pricing analysis.",
    "Giá trị đơn hàng trung bình hiện được giữ bởi các gói trang chủ cao cấp, trong khi các gói tìm kiếm nhỏ đang kéo số lượng đơn. Nên tiếp tục theo dõi đồng thời cả hai tầng gói trong phân tích giá.",
  ],
];

const translateText = (value: string) =>
  TEXT_REPLACEMENTS.reduce(
    (result, [source, target]) => result.replaceAll(source, target),
    value,
  );

const getFocusLabel = (focus: AIInsightFocusFilter): AIInsightFocus => {
  if (focus === "All Focus Areas") {
    return "Executive Summary";
  }

  return focus;
};

const normalizeHistoryItem = (item: AIInsightHistoryItem): AIInsightHistoryItem => ({
  ...item,
  title: translateText(item.title),
  summary: translateText(item.summary),
  generatedBy: translateText(item.generatedBy),
});

const normalizeTrendRow = (item: AITrendScoreRow): AITrendScoreRow => ({
  ...item,
  entity: translateText(item.entity),
  recommendation: translateText(item.recommendation),
  owner: translateText(item.owner),
});

const normalizeOverview = (overview: AIInsightOverview): AIInsightOverview => ({
  ...overview,
  summaryCards: overview.summaryCards.map((item) => ({
    ...item,
    title: translateText(item.title),
    value: translateText(item.value),
    subtitle: translateText(item.subtitle),
  })),
  highlightCards: overview.highlightCards.map((item) => ({
    ...item,
    title: translateText(item.title),
    body: translateText(item.body),
  })),
  recommendations: overview.recommendations.map((item) => ({
    ...item,
    title: translateText(item.title),
    body: translateText(item.body),
  })),
  topRows: overview.topRows.map((item) => ({
    ...item,
    label: translateText(item.label),
    value: translateText(item.value),
    detail: translateText(item.detail),
  })),
});

export const aiInsightService = {
  getSettings(): Promise<AIInsightSettings> {
    return apiClient.request<AIInsightSettings>(
      `${AI_INSIGHTS_API_PATH}/settings`,
      {
        defaultErrorMessage: "Không thể tải cấu hình AI Insights.",
      },
    );
  },

  updateSettings(settings: AIInsightSettings): Promise<AIInsightSettings> {
    return apiClient.request<AIInsightSettings>(
      `${AI_INSIGHTS_API_PATH}/settings`,
      {
        method: "PUT",
        includeJsonContentType: true,
        defaultErrorMessage: "Không thể lưu cấu hình AI Insights.",
        body: JSON.stringify(settings),
      },
    );
  },

  getTrendRows(fromDate?: string, toDate?: string): Promise<AITrendScoreRow[]> {
    const params = new URLSearchParams();
    if (fromDate) params.set("fromDate", fromDate);
    if (toDate) params.set("toDate", toDate);
    const query = params.toString();

    return apiClient
      .request<AITrendScoreRow[]>(
        `${AI_INSIGHTS_API_PATH}/trends${query ? `?${query}` : ""}`,
        {
          defaultErrorMessage: "Không thể tải dữ liệu chấm điểm xu hướng AI.",
        },
      )
      .then((items) => items.map(normalizeTrendRow));
  },

  getOverview(
    fromDate?: string,
    toDate?: string,
    focus?: AIInsightFocusFilter,
  ): Promise<AIInsightOverview> {
    const params = new URLSearchParams();
    if (fromDate) params.set("fromDate", fromDate);
    if (toDate) params.set("toDate", toDate);
    if (focus && focus !== "All Focus Areas") {
      params.set("focus", getFocusLabel(focus));
    }
    const query = params.toString();

    return apiClient
      .request<AIInsightOverview>(
        `${AI_INSIGHTS_API_PATH}/overview${query ? `?${query}` : ""}`,
        {
          defaultErrorMessage: "Không thể tải báo cáo đánh giá AI.",
        },
      )
      .then(normalizeOverview);
  },

  getHistory(): Promise<AIInsightHistoryItem[]> {
    return apiClient
      .request<AIInsightHistoryItem[]>(`${AI_INSIGHTS_API_PATH}/history`, {
        defaultErrorMessage: "Không thể tải lịch sử AI Insights.",
      })
      .then((items) => items.map(normalizeHistoryItem));
  },

  getSummaryCards(
    settings: AIInsightSettings,
    trendRows: AITrendScoreRow[],
    historyItems: AIInsightHistoryItem[],
  ): AIInsightSummaryCard[] {
    const toneLabelMap: Record<AIInsightTone, string> = {
      Conservative: "Thận trọng",
      Balanced: "Cân bằng",
      Aggressive: "Tăng trưởng mạnh",
    };
    const reviewCount = historyItems.filter(
      (item) => item.status === "Needs Review",
    ).length;
    const watchlistCount = trendRows.filter(
      (item) => item.score >= settings.confidenceThreshold,
    ).length;

    return [
      {
        title: "Bản phân tích đã tạo",
        value: String(historyItems.length),
        subtitle: "Tổng số bản nhận định AI đang được lưu",
      },
      {
        title: "Cần admin xem lại",
        value: String(reviewCount),
        subtitle: "Các bản AI đang ở trạng thái cần kiểm tra",
      },
      {
        title: "Tín hiệu nổi bật",
        value: String(watchlistCount),
        subtitle: `Các dòng xu hướng có điểm từ ${settings.confidenceThreshold} trở lên`,
      },
      {
        title: "Giọng điệu phân tích",
        value: toneLabelMap[settings.recommendationTone],
        subtitle: "Mức độ quyết liệt của các khuyến nghị AI",
      },
    ];
  },

  async createGeneratedInsight(
    _items: AIInsightHistoryItem[],
    fromDate: string,
    toDate: string,
    focus: AIInsightFocusFilter,
    settings: AIInsightSettings,
    generatedAt: string,
  ): Promise<AIInsightHistoryItem> {
    const resolvedFocus = getFocusLabel(focus);

    return apiClient
      .request<AIInsightHistoryItem>(`${AI_INSIGHTS_API_PATH}/generate`, {
        method: "POST",
        includeJsonContentType: true,
        defaultErrorMessage: "Không thể tạo bản phân tích AI.",
        body: JSON.stringify({
          fromDate,
          toDate,
          focus: resolvedFocus,
          tone: settings.recommendationTone,
          confidenceThreshold: settings.confidenceThreshold,
          reviewMode: settings.reviewMode,
          autoDailySummary: settings.autoDailySummary,
          anomalyAlerts: settings.anomalyAlerts,
          operatorDigest: settings.operatorDigest,
          generatedAt,
        }),
      })
      .then(normalizeHistoryItem);
  },
};
