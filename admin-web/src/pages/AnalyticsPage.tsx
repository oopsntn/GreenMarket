import { analyticsService } from "../services/analyticsService";
import "./AnalyticsPage.css";

function AnalyticsPage() {
  const kpiCards = analyticsService.getKpiCards();
  const placementRows = analyticsService.getTopPlacements();

  return (
    <div className="analytics-page">
      <div className="analytics-page__header">
        <div>
          <h2>Analytics Dashboard</h2>
          <p>Monitor placement performance, engagement, and revenue trends.</p>
        </div>

        <button className="analytics-page__export-btn" type="button">
          Export Report
        </button>
      </div>

      <div className="analytics-kpis">
        {kpiCards.map((card) => (
          <div key={card.title} className="analytics-kpi-card">
            <span>{card.title}</span>
            <strong>{card.value}</strong>
            <small>{card.change} this month</small>
          </div>
        ))}
      </div>

      <div className="analytics-chart-grid">
        <section className="analytics-panel analytics-panel--large">
          <div className="analytics-panel__header">
            <h3>Traffic Overview</h3>
            <span>Last 30 days</span>
          </div>

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
        </section>

        <section className="analytics-panel">
          <div className="analytics-panel__header">
            <h3>Traffic Sources</h3>
            <span>Distribution</span>
          </div>

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
        </section>
      </div>

      <section className="analytics-panel">
        <div className="analytics-panel__header">
          <h3>Top Placement Performance</h3>
          <span>Best performing slots</span>
        </div>

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
      </section>
    </div>
  );
}

export default AnalyticsPage;
