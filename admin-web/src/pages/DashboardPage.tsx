import { useState } from "react";
import FilterBar from "../components/FilterBar";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import { dashboardService } from "../services/dashboardService";
import "./DashboardPage.css";

function DashboardPage() {
  const statCards = dashboardService.getStatCards();
  const summary = dashboardService.getSummary();

  const [dateRange, setDateRange] = useState("Last 30 Days");
  const [overviewScope, setOverviewScope] = useState("All Metrics");

  return (
    <div className="dashboard-page">
      <PageHeader
        title="Dashboard Overview"
        description="Welcome back. Here is the summary of GreenMarket system."
      />

      <SectionCard
        title="Dashboard Filters"
        description="Adjust the KPI time range and overview scope."
      >
        <FilterBar
          fields={[
            {
              id: "dashboard-date-range",
              label: "Date Range",
              value: dateRange,
              onChange: setDateRange,
              options: [
                "Last 7 Days",
                "Last 30 Days",
                "Last 90 Days",
                "This Year",
              ],
            },
            {
              id: "dashboard-overview-scope",
              label: "Overview Scope",
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

      <div className="dashboard-cards">
        {statCards.map((card) => (
          <SectionCard key={card.title}>
            <StatCard
              title={card.title}
              value={card.value}
              subtitle={`${dateRange} • ${overviewScope}`}
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
