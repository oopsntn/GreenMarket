import { useState } from "react";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import { aiInsightService } from "../services/aiInsightService";
import type { AIInsightSettings } from "../types/aiInsight";
import "./AIInsightsPage.css";

function AIInsightsPage() {
  const [settings] = useState<AIInsightSettings>(aiInsightService.getSettings());
  const trendRows = aiInsightService.getTrendRows();
  const historyItems = aiInsightService.getHistory();
  const summaryCards = aiInsightService.getSummaryCards(
    settings,
    trendRows,
    historyItems,
  );

  return (
    <div className="ai-insights-page">
      <PageHeader
        title="AI Insights & Recommendation Settings"
        description="Review AI recommendation status and prepare the dedicated admin insight workspace."
      />

      <div className="ai-insights-summary-grid">
        {summaryCards.map((card) => (
          <SectionCard key={card.title}>
            <StatCard
              title={card.title}
              value={card.value}
              subtitle={card.subtitle}
            />
          </SectionCard>
        ))}
      </div>

      <SearchToolbar
        placeholder="Search AI summaries, recommendations, or entities"
        filterSummaryItems={[
          settings.recommendationTone,
          settings.reviewMode,
          settings.promptVersion,
        ]}
      />

      <SectionCard
        title="AI Recommendation Workspace"
        description="Detailed settings, trend scoring, and insight history are layered in the next commit."
      >
        <div className="ai-insights-placeholder">
          <strong>AI workspace scaffold ready</strong>
          <p>
            The admin screen now has its own route and summary layer. The next
            step fills in controls, reports, filters, and history tables.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}

export default AIInsightsPage;
