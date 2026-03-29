import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import { analyticsService } from "../services/analyticsService";
import "./AnalyticsPage.css";

function AnalyticsPage() {
  const kpiCards = analyticsService.getKpiCards();
  const placementRows = analyticsService.getTopPlacements();

  return (
    <div className="analytics-page">
      <PageHeader
        title="Analytics Dashboard"
        description="Monitor placement performance, engagement, and revenue trends."
        actionLabel="Export Report"
      />

      <div className="analytics-kpis">
        {kpiCards.map((card) => (
          <SectionCard key={card.title}>
            <div className="analytics-kpi-card">
              <span>{card.title}</span>
              <strong>{card.value}</strong>
              <small>{card.change} this month</small>
            </div>
          </SectionCard>
        ))}
      </div>

      <div className="analytics-chart-grid">
        <SectionCard title="Traffic Overview" description="Last 30 days">
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

        <SectionCard title="Traffic Sources" description="Distribution">
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
        description="Best performing slots"
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
