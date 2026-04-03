import {
  initialAIInsightHistory,
  initialAIInsightSettings,
  initialAITrendRows,
} from "../mock-data/aiInsights";
import type {
  AIInsightFocus,
  AIInsightFocusFilter,
  AIInsightHistoryItem,
  AIInsightSettings,
  AIInsightSummaryCard,
  AIInsightTone,
  AITrendScoreRow,
} from "../types/aiInsight";

const getNextHistoryId = (items: AIInsightHistoryItem[]) => {
  if (items.length === 0) return 1;
  return Math.max(...items.map((item) => item.id)) + 1;
};

const getFocusLabel = (focus: AIInsightFocusFilter): AIInsightFocus => {
  if (focus === "All Focus Areas") {
    return "Placement Performance";
  }

  return focus;
};

export const aiInsightService = {
  getSettings(): AIInsightSettings {
    return initialAIInsightSettings;
  },

  updateSettings(settings: AIInsightSettings): AIInsightSettings {
    return { ...settings };
  },

  getTrendRows(): AITrendScoreRow[] {
    return initialAITrendRows;
  },

  getHistory(): AIInsightHistoryItem[] {
    return initialAIInsightHistory;
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

  createGeneratedInsight(
    items: AIInsightHistoryItem[],
    focus: AIInsightFocusFilter,
    tone: AIInsightTone,
    generatedAt: string,
  ): AIInsightHistoryItem {
    const resolvedFocus = getFocusLabel(focus);

    return {
      id: getNextHistoryId(items),
      title: `${resolvedFocus} summary`,
      focus: resolvedFocus,
      summary: `Generated a ${tone.toLowerCase()} recommendation summary for ${resolvedFocus.toLowerCase()} using the latest admin filters.`,
      generatedBy: "Admin Manual Trigger",
      generatedAt,
      status: "Needs Review",
    };
  },
};
