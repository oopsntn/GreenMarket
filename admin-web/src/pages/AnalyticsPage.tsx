import "./AnalyticsPage.css";

const kpiCards = [
  { title: "Total Views", value: "128,450", change: "+12.4%" },
  { title: "CTR", value: "4.8%", change: "+0.9%" },
  { title: "Conversions", value: "1,245", change: "+6.3%" },
  { title: "Revenue", value: "$8,920", change: "+14.1%" },
];

const topPlacements = [
  {
    id: 1,
    slot: "Home Top",
    impressions: "48,200",
    clicks: "3,410",
    ctr: "7.1%",
    revenue: "$3,200",
  },
  {
    id: 2,
    slot: "Category Top",
    impressions: "34,100",
    clicks: "1,620",
    ctr: "4.8%",
    revenue: "$2,450",
  },
  {
    id: 3,
    slot: "Search Boost",
    impressions: "22,800",
    clicks: "890",
    ctr: "3.9%",
    revenue: "$1,780",
  },
];

function AnalyticsPage() {
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
                <span className="dot dot--dark" /> Direct
              </li>
              <li>
                <span className="dot dot--mid" /> Search
              </li>
              <li>
                <span className="dot dot--light" /> Promotions
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
              {topPlacements.map((item) => (
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
