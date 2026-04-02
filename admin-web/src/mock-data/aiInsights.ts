import type {
  AIInsightHistoryItem,
  AIInsightSettings,
  AITrendScoreRow,
} from "../types/aiInsight";

export const initialAIInsightSettings: AIInsightSettings = {
  autoDailySummary: true,
  anomalyAlerts: true,
  operatorDigest: false,
  recommendationTone: "Balanced",
  confidenceThreshold: 78,
  promptVersion: "gm-admin-v1.4",
  reviewMode: "Required",
};

export const initialAITrendRows: AITrendScoreRow[] = [
  {
    id: 1,
    focus: "Placement Performance",
    entity: "Home Top / Premium 7 Days",
    score: 91,
    momentum: "Up",
    recommendation: "Increase exposure allocation for homepage premium inventory.",
    owner: "Analytics Bot",
    updatedAt: "2026-04-02 09:10",
  },
  {
    id: 2,
    focus: "Promotion Watchlist",
    entity: "BST-SRC-2410",
    score: 84,
    momentum: "Down",
    recommendation: "Review expired search boost campaigns with zero quota left.",
    owner: "Ops Team C",
    updatedAt: "2026-04-02 08:40",
  },
  {
    id: 3,
    focus: "Revenue Signals",
    entity: "Category Spotlight 5 Days",
    score: 88,
    momentum: "Up",
    recommendation: "Bundle this plan with upsell prompts for repeat buyers.",
    owner: "Revenue Desk",
    updatedAt: "2026-04-01 18:25",
  },
  {
    id: 4,
    focus: "Operator Load",
    entity: "Ops Team A",
    score: 67,
    momentum: "Stable",
    recommendation: "Keep monitoring review queue capacity before adding more manual checks.",
    owner: "System",
    updatedAt: "2026-04-01 17:05",
  },
  {
    id: 5,
    focus: "Promotion Watchlist",
    entity: "BST-HOME-2415",
    score: 73,
    momentum: "Stable",
    recommendation: "Scheduled campaign looks healthy; verify creative readiness 1 day before launch.",
    owner: "Ops Team A",
    updatedAt: "2026-04-01 14:30",
  },
  {
    id: 6,
    focus: "Placement Performance",
    entity: "Search Boost / 3 Days",
    score: 79,
    momentum: "Down",
    recommendation: "Search boost CTR is flattening; consider a smaller premium mix.",
    owner: "Analytics Bot",
    updatedAt: "2026-03-31 16:00",
  },
];

export const initialAIInsightHistory: AIInsightHistoryItem[] = [
  {
    id: 1,
    title: "Daily placement performance summary",
    focus: "Placement Performance",
    summary:
      "Homepage premium placements are outperforming category slots by 14% CTR this week.",
    generatedBy: "AI Summary Job",
    generatedAt: "2026-04-02 09:15",
    status: "Generated",
  },
  {
    id: 2,
    title: "Promotion watchlist review",
    focus: "Promotion Watchlist",
    summary:
      "Two expired campaigns remain eligible for admin reopening after payment confirmation.",
    generatedBy: "AI Summary Job",
    generatedAt: "2026-04-02 08:50",
    status: "Needs Review",
  },
  {
    id: 3,
    title: "Revenue signal digest",
    focus: "Revenue Signals",
    summary:
      "Category Spotlight continues to convert well among repeat customers in the last reporting window.",
    generatedBy: "Revenue Desk",
    generatedAt: "2026-04-01 17:40",
    status: "Generated",
  },
  {
    id: 4,
    title: "Operator load balancing note",
    focus: "Operator Load",
    summary:
      "Ops Team B can absorb another scheduled review batch without affecting SLA.",
    generatedBy: "System",
    generatedAt: "2026-04-01 15:20",
    status: "Archived",
  },
];
