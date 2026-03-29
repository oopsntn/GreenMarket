import { useState } from "react";
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
        <div className="dashboard-filters">
          <div className="dashboard-field">
            <label htmlFor="dashboard-date-range">Date Range</label>
            <select
              id="dashboard-date-range"
              value={dateRange}
              onChange={(event) => setDateRange(event.target.value)}
            >
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
              <option>This Year</option>
            </select>
          </div>

          <div className="dashboard-field">
            <label htmlFor="dashboard-overview-scope">Overview Scope</label>
            <select
              id="dashboard-overview-scope"
              value={overviewScope}
              onChange={(event) => setOverviewScope(event.target.value)}
            >
              <option>All Metrics</option>
              <option>Users & Shops</option>
              <option>Posts & Moderation</option>
              <option>Business Overview</option>
            </select>
          </div>
        </div>
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
