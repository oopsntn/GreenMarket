import { useMemo, useState } from "react";
import FilterBar from "../components/FilterBar";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import { dashboardService } from "../services/dashboardService";
import {
  DEFAULT_REPORT_FROM_DATE,
  DEFAULT_REPORT_TO_DATE,
  formatDateRangeLabel,
} from "../utils/dateRange";
import "./DashboardPage.css";

function DashboardPage() {
  const statCards = dashboardService.getStatCards();
  const summary = dashboardService.getSummary();

  const [fromDate, setFromDate] = useState(DEFAULT_REPORT_FROM_DATE);
  const [toDate, setToDate] = useState(DEFAULT_REPORT_TO_DATE);
  const [overviewScope, setOverviewScope] = useState("All Metrics");
  const dateRangeLabel = formatDateRangeLabel(fromDate, toDate);

  const filteredCards = useMemo(() => {
    if (overviewScope === "All Metrics") return statCards;

    const normalizedCards = statCards.map((card, index) => ({
      ...card,
      _index: index,
      _title: card.title.toLowerCase(),
    }));

    const scopeRules: Record<string, (title: string) => boolean> = {
      "Users & Shops": (title) =>
        title.includes("user") ||
        title.includes("shop") ||
        title.includes("seller"),
      "Posts & Moderation": (title) =>
        title.includes("post") ||
        title.includes("report") ||
        title.includes("moderat") ||
        title.includes("review"),
      "Business Overview": (title) =>
        title.includes("revenue") ||
        title.includes("promotion") ||
        title.includes("order") ||
        title.includes("spending") ||
        title.includes("sale"),
    };

    const matched = normalizedCards.filter((card) =>
      scopeRules[overviewScope]?.(card._title),
    );

    if (matched.length > 0) {
      return matched.map(({ _index, _title, ...card }) => card);
    }

    if (overviewScope === "Users & Shops") {
      return statCards.slice(0, 2);
    }

    if (overviewScope === "Posts & Moderation") {
      return statCards.slice(1, 3);
    }

    return statCards.slice(-2);
  }, [overviewScope, statCards]);

  const scopeSummaryText =
    overviewScope === "All Metrics"
      ? "Showing all KPI groups across the admin system."
      : `Showing KPI cards related to ${overviewScope.toLowerCase()}.`;

  return (
    <div className="dashboard-page">
      <PageHeader
        title="Dashboard Overview"
        description="Welcome back. Here is the summary of GreenMarket system."
      />

      <SectionCard
        title="Dashboard Filters"
        description="Adjust the reporting period and overview scope."
      >
        <FilterBar
          fields={[
            {
              id: "dashboard-from-date",
              label: "From Date",
              type: "date",
              value: fromDate,
              onChange: setFromDate,
            },
            {
              id: "dashboard-to-date",
              label: "To Date",
              type: "date",
              value: toDate,
              onChange: setToDate,
            },
            {
              id: "dashboard-overview-scope",
              label: "Overview Scope",
              type: "select",
              value: overviewScope,
              onChange: setOverviewScope,
              options: [
                "All Metrics",
                "Users & Shops",
                "Posts & Moderation",
                "Business Overview",
              ],
            },
          ]}
        />
      </SectionCard>

      <SectionCard
        title="Overview Context"
        description={`${dateRangeLabel} • ${overviewScope}`}
      >
        <div className="dashboard-context">
          <p>{scopeSummaryText}</p>
        </div>
      </SectionCard>

      <div className="dashboard-cards">
        {filteredCards.map((card) => (
          <SectionCard key={card.title}>
            <StatCard
              title={card.title}
              value={card.value}
              subtitle={`${dateRangeLabel} • ${overviewScope}`}
            />
          </SectionCard>
        ))}
      </div>

      <SectionCard title={summary.title}>
        <div className="dashboard-panel">
          <p>{summary.description}</p>
        </div>
      </SectionCard>
    </div>
  );
}

export default DashboardPage;
