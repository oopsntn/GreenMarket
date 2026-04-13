export type AIInsightFocus =
  | "Executive Summary"
  | "Placement Performance"
  | "Promotion Watchlist"
  | "Revenue Signals"
  | "Customer Spending"
  | "Operator Load";

export type AIInsightFocusFilter = AIInsightFocus | "All Focus Areas";

export type AIInsightTone = "Conservative" | "Balanced" | "Aggressive";

export type AIInsightReviewMode = "Required" | "Optional";

export type AIInsightHistoryStatus = "Generated" | "Needs Review" | "Archived";

export type AIInsightHistoryStatusFilter =
  | AIInsightHistoryStatus
  | "All Statuses";

export type AITrendMomentum = "Up" | "Stable" | "Down";

export type AIInsightSettings = {
  autoDailySummary: boolean;
  anomalyAlerts: boolean;
  operatorDigest: boolean;
  recommendationTone: AIInsightTone;
  confidenceThreshold: number;
  promptVersion: string;
  reviewMode: AIInsightReviewMode;
};

export type AITrendScoreRow = {
  id: number;
  focus: AIInsightFocus;
  entity: string;
  score: number;
  momentum: AITrendMomentum;
  recommendation: string;
  owner: string;
  updatedAt: string;
};

export type AIInsightHistoryItem = {
  id: number;
  title: string;
  focus: AIInsightFocus;
  summary: string;
  generatedBy: string;
  generatedAt: string;
  status: AIInsightHistoryStatus;
};

export type AIInsightSummaryCard = {
  title: string;
  value: string;
  subtitle: string;
};

export type AIInsightOverviewCard = {
  title: string;
  value: string;
  subtitle: string;
};

export type AIInsightOverviewTone = "neutral" | "positive" | "warning";

export type AIInsightOverviewBullet = {
  title: string;
  body: string;
  tone: AIInsightOverviewTone;
};

export type AIInsightOverviewRow = {
  label: string;
  value: string;
  detail: string;
};

export type AIInsightOverview = {
  summaryCards: AIInsightOverviewCard[];
  highlightCards: AIInsightOverviewBullet[];
  recommendations: AIInsightOverviewBullet[];
  topRows: AIInsightOverviewRow[];
  availableFocuses: AIInsightFocus[];
};
