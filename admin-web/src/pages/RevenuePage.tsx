import "./RevenuePage.css";

const revenueCards = [
  { title: "Total Revenue", value: "$18,420", note: "+12.6% vs last month" },
  { title: "Active Packages", value: "126", note: "+8 this week" },
  { title: "Avg. Order Value", value: "$146", note: "+4.2% improvement" },
  { title: "Top Slot Revenue", value: "Home Top", note: "$7,800 generated" },
];

const revenueRows = [
  {
    id: 1,
    packageName: "Premium 7 Days",
    slot: "Home Top",
    orders: 42,
    revenue: "$7,800",
    growth: "+14.2%",
  },
  {
    id: 2,
    packageName: "Standard 5 Days",
    slot: "Category Top",
    orders: 38,
    revenue: "$5,240",
    growth: "+8.9%",
  },
  {
    id: 3,
    packageName: "Boost 3 Days",
    slot: "Search Boost",
    orders: 31,
    revenue: "$3,120",
    growth: "+5.1%",
  },
  {
    id: 4,
    packageName: "Starter 2 Days",
    slot: "Search Boost",
    orders: 18,
    revenue: "$1,260",
    growth: "-2.4%",
  },
];

function RevenuePage() {
  return (
    <div className="revenue-page">
      <div className="revenue-page__header">
        <div>
          <h2>Revenue Summary</h2>
          <p>
            Track promotion revenue across slots, packages, and sales periods.
          </p>
        </div>

        <button className="revenue-page__export-btn" type="button">
          Export Revenue Report
        </button>
      </div>

      <div className="revenue-filters">
        <div className="revenue-field">
          <label htmlFor="date-range">Date Range</label>
          <select id="date-range" defaultValue="Last 30 Days">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
            <option>This Year</option>
          </select>
        </div>

        <div className="revenue-field">
          <label htmlFor="slot-filter">Placement Slot</label>
          <select id="slot-filter" defaultValue="All Slots">
            <option>All Slots</option>
            <option>Home Top</option>
            <option>Category Top</option>
            <option>Search Boost</option>
          </select>
        </div>
      </div>

      <div className="revenue-cards">
        {revenueCards.map((card) => (
          <div key={card.title} className="revenue-card">
            <span>{card.title}</span>
            <strong>{card.value}</strong>
            <small>{card.note}</small>
          </div>
        ))}
      </div>

      <section className="revenue-panel">
        <div className="revenue-panel__header">
          <h3>Revenue by Package</h3>
          <span>Current reporting period</span>
        </div>

        <div className="revenue-table-wrapper">
          <table className="revenue-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Package Name</th>
                <th>Placement Slot</th>
                <th>Orders</th>
                <th>Revenue</th>
                <th>Growth</th>
              </tr>
            </thead>

            <tbody>
              {revenueRows.map((row) => (
                <tr key={row.id}>
                  <td>#{row.id}</td>
                  <td>{row.packageName}</td>
                  <td>
                    <span className="revenue-badge revenue-badge--slot">
                      {row.slot}
                    </span>
                  </td>
                  <td>{row.orders}</td>
                  <td>{row.revenue}</td>
                  <td>
                    <span
                      className={
                        row.growth.startsWith("-")
                          ? "revenue-badge revenue-badge--negative"
                          : "revenue-badge revenue-badge--positive"
                      }
                    >
                      {row.growth}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default RevenuePage;
