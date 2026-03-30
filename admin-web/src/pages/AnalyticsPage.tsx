import { useState } from "react";
import FilterBar from "../components/FilterBar";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import { analyticsService } from "../services/analyticsService";
import "./AnalyticsPage.css";

function AnalyticsPage() {
  const kpiCards = analyticsService.getKpiCards();
  const placementRows = analyticsService.getTopPlacements();

  const [dateRange, setDateRange] = useState("Last 30 Days");
  const [metricScope, setMetricScope] = useState("All Placements");

  return (
    <div className="analytics-page">
      <PageHeader
        title="Analytics Dashboard"
        description="Monitor placement performance, engagement, and revenue trends."
        actionLabel="Export Report"
      />

      <SectionCard
        title="Analytics Filters"
        description="Adjust the KPI time range and analytics scope."
      >
        <FilterBar
          fields={[
            {
              id: "analytics-date-range",
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
              id: "analytics-metric-scope",
              label: "Analytics Scope",
              value: metricScope,
              onChange: setMetricScope,
              options: [
                "All Placements",
                "Traffic & Reach",
                "CTR & Clicks",
                "Revenue Focus",
              ],
            },
          ]}
        />
      </SectionCard>

      <div className="analytics-kpis">
        {kpiCards.map((card) => (
          <SectionCard key={card.title}>
            <StatCard
              title={card.title}
              value={card.value}
              subtitle={`${card.change} • ${dateRange}`}
            />
          </SectionCard>
        ))}
      </div>

      <div className="analytics-chart-grid">
        <SectionCard
          title="Traffic Overview"
          description={`${dateRange} • ${metricScope}`}
        >
          <div className="analytics-panel__body">
            <div className="analytics-chart-placeholder">
              <div className="analytics-bars">
                <div style={{ height: "42%" }} />
                <div style={{ height: "58%" }} />
                <div style={{ height: "48%" }} />
                <div style={{ height: "72%" }} />
                <div style={{ height: "68%" }} />
                <div style={{ height: "84%" }} />
                <div style={{ height: "76%" }} />
                <div style={{ height: "88%" }} />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Traffic Sources"
          description={`${dateRange} • Distribution`}
        >
          <div className="analytics-panel__body">
            <div className="analytics-donut-placeholder">
              <div className="analytics-donut" />
              <ul className="analytics-legend">
                <li>
                  <span className="dot dot--dark" />
                  Direct
                </li>
                <li>
                  <span className="dot dot--mid" />
                  Search
                </li>
                <li>
                  <span className="dot dot--light" />
                  Promotions
                </li>
              </ul>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Top Placement Performance"
        description={`${dateRange} • ${metricScope}`}
      >
        <div className="analytics-table-wrapper">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Placement Slot</th>
                <th>Impressions</th>
                <th>Clicks</th>
                <th>CTR</th>
                <th>Revenue</th>
              </tr>
            </thead>

            <tbody>
              {placementRows.map((item) => (
                <tr key={item.id}>
                  <td>#{item.id}</td>
                  <td>{item.slot}</td>
                  <td>{item.impressions}</td>
                  <td>{item.clicks}</td>
                  <td>{item.ctr}</td>
                  <td>{item.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

export default AnalyticsPage;
