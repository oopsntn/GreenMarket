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

const getFocusLabel = (focus: AIInsightFocusFilter): AIInsightFocus => {
  if (focus === "All Focus Areas") {
    return "Executive Summary";
  }

  return focus;
};

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

    return apiClient.request<AITrendScoreRow[]>(
      `${AI_INSIGHTS_API_PATH}/trends${query ? `?${query}` : ""}`,
      {
        defaultErrorMessage: "Không thể tải dữ liệu chấm điểm xu hướng AI.",
      },
    );
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

    return apiClient.request<AIInsightOverview>(
      `${AI_INSIGHTS_API_PATH}/overview${query ? `?${query}` : ""}`,
      {
        defaultErrorMessage: "Không thể tải báo cáo đánh giá AI.",
      },
    );
  },

  getHistory(): Promise<AIInsightHistoryItem[]> {
    return apiClient.request<AIInsightHistoryItem[]>(
      `${AI_INSIGHTS_API_PATH}/history`,
      {
        defaultErrorMessage: "Không thể tải lịch sử AI Insights.",
      },
    );
  },

  getSummaryCards(
    settings: AIInsightSettings,
    trendRows: AITrendScoreRow[],
    historyItems: AIInsightHistoryItem[],
  ): AIInsightSummaryCard[] {
    const reviewCount = historyItems.filter(
      (item) => item.status === "Needs Review",
    ).length;
    const watchlistCount = trendRows.filter(
      (item) => item.score >= settings.confidenceThreshold,
    ).length;

    return [
      {
        title: "Phiên bản prompt",
        value: settings.promptVersion,
        subtitle: "Hồ sơ gợi ý AI hiện tại",
      },
      {
        title: "Hàng đợi duyệt",
        value: String(reviewCount),
        subtitle: "Số bản insight đang chờ admin duyệt",
      },
      {
        title: "Danh sách điểm cao",
        value: String(watchlistCount),
        subtitle: `Các dòng xu hướng có điểm từ ${settings.confidenceThreshold} trở lên`,
      },
      {
        title: "Tóm tắt tự động hằng ngày",
        value: settings.autoDailySummary ? "Đang bật" : "Đã tắt",
        subtitle: "Trạng thái tạo bản tóm tắt AI theo lịch",
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

    return apiClient.request<AIInsightHistoryItem>(
      `${AI_INSIGHTS_API_PATH}/generate`,
      {
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
      },
    );
  },
};
