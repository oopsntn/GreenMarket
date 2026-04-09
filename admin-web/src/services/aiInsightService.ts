import { apiClient } from "../lib/apiClient";
import type {
  AIInsightFocus,
  AIInsightFocusFilter,
  AIInsightHistoryItem,
  AIInsightSettings,
  AIInsightSummaryCard,
  AIInsightTone,
  AITrendScoreRow,
} from "../types/aiInsight";

const AI_INSIGHTS_API_PATH = "/api/admin/ai-insights";

const getFocusLabel = (focus: AIInsightFocusFilter): AIInsightFocus => {
  if (focus === "All Focus Areas") {
    return "Placement Performance";
  }

  return focus;
};

export const aiInsightService = {
  getSettings(): Promise<AIInsightSettings> {
    return apiClient.request<AIInsightSettings>(
      `${AI_INSIGHTS_API_PATH}/settings`,
      {
        defaultErrorMessage: "Unable to load AI insight settings.",
      },
    );
  },

  updateSettings(settings: AIInsightSettings): Promise<AIInsightSettings> {
    return apiClient.request<AIInsightSettings>(
      `${AI_INSIGHTS_API_PATH}/settings`,
      {
        method: "PUT",
        includeJsonContentType: true,
        defaultErrorMessage: "Unable to save AI insight settings.",
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
        defaultErrorMessage: "Unable to load AI trend rows.",
      },
    );
  },

  getHistory(): Promise<AIInsightHistoryItem[]> {
    return apiClient.request<AIInsightHistoryItem[]>(
      `${AI_INSIGHTS_API_PATH}/history`,
      {
        defaultErrorMessage: "Unable to load AI insight history.",
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
    const watchlistCount = trendRows.filter((item) => item.score >= 85).length;

    return [
      {
        title: "Prompt Version",
        value: settings.promptVersion,
        subtitle: "Current AI recommendation profile",
      },
      {
        title: "Review Queue",
        value: String(reviewCount),
        subtitle: "Insight summaries waiting for admin review",
      },
      {
        title: "High Score Watchlist",
        value: String(watchlistCount),
        subtitle: "Trend items scoring 85 or above",
      },
      {
        title: "Auto Daily Summary",
        value: settings.autoDailySummary ? "Enabled" : "Disabled",
        subtitle: "Scheduled AI digest generation",
      },
    ];
  },

  async createGeneratedInsight(
    _items: AIInsightHistoryItem[],
    focus: AIInsightFocusFilter,
    tone: AIInsightTone,
    generatedAt: string,
  ): Promise<AIInsightHistoryItem> {
    const resolvedFocus = getFocusLabel(focus);

    return apiClient.request<AIInsightHistoryItem>(
      `${AI_INSIGHTS_API_PATH}/generate`,
      {
        method: "POST",
        includeJsonContentType: true,
        defaultErrorMessage: "Unable to generate AI insight.",
        body: JSON.stringify({
          focus: resolvedFocus,
          tone,
          generatedAt,
        }),
      },
    );
  },
};
