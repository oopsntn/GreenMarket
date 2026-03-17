import "./CustomerSpendingPage.css";

const spendingCards = [
  { title: "Total Customers", value: "284", note: "+18 this month" },
  { title: "Total Spending", value: "$24,860", note: "+11.3% vs last month" },
  { title: "Avg. Spend / Customer", value: "$87.5", note: "+3.8% increase" },
  { title: "Top Customer Spend", value: "$1,240", note: "Highest in period" },
];

const customerRows = [
  {
    id: 1,
    customerName: "Nguyen Van A",
    email: "vana@greenmarket.vn",
    totalOrders: 12,
    totalSpent: "$1,240",
    avgOrderValue: "$103",
    lastPurchase: "2026-03-16",
  },
  {
    id: 2,
    customerName: "Tran Thi B",
    email: "thib@greenmarket.vn",
    totalOrders: 10,
    totalSpent: "$1,020",
    avgOrderValue: "$102",
    lastPurchase: "2026-03-15",
  },
  {
    id: 3,
    customerName: "Le Van C",
    email: "vanc@greenmarket.vn",
    totalOrders: 8,
    totalSpent: "$860",
    avgOrderValue: "$107",
    lastPurchase: "2026-03-14",
  },
  {
    id: 4,
    customerName: "Pham Thi D",
    email: "thid@greenmarket.vn",
    totalOrders: 7,
    totalSpent: "$790",
    avgOrderValue: "$113",
    lastPurchase: "2026-03-13",
  },
];

function CustomerSpendingPage() {
  return (
    <div className="customer-spending-page">
      <div className="customer-spending-page__header">
        <div>
          <h2>Customer Spending Report</h2>
          <p>
            Track customer purchase behavior and promotion spending activity.
          </p>
        </div>

        <button className="customer-spending-page__export-btn" type="button">
          Export Customer Report
        </button>
      </div>

      <div className="customer-spending-filters">
        <div className="customer-spending-field">
          <label htmlFor="customer-date-range">Date Range</label>
          <select id="customer-date-range" defaultValue="Last 30 Days">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
            <option>This Year</option>
          </select>
        </div>

        <div className="customer-spending-field">
          <label htmlFor="customer-segment">Customer Segment</label>
          <select id="customer-segment" defaultValue="All Customers">
            <option>All Customers</option>
            <option>Top Spenders</option>
            <option>Returning Buyers</option>
            <option>New Customers</option>
          </select>
        </div>
      </div>

      <div className="customer-spending-cards">
        {spendingCards.map((card) => (
          <div key={card.title} className="customer-spending-card">
            <span>{card.title}</span>
            <strong>{card.value}</strong>
            <small>{card.note}</small>
          </div>
        ))}
      </div>

      <section className="customer-spending-panel">
        <div className="customer-spending-panel__header">
          <h3>Top Customer Spending</h3>
          <span>Current reporting period</span>
        </div>

        <div className="customer-spending-table-wrapper">
          <table className="customer-spending-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer Name</th>
                <th>Email</th>
                <th>Total Orders</th>
                <th>Total Spent</th>
                <th>Avg. Order Value</th>
                <th>Last Purchase</th>
              </tr>
            </thead>

            <tbody>
              {customerRows.map((row) => (
                <tr key={row.id}>
                  <td>#{row.id}</td>
                  <td>{row.customerName}</td>
                  <td>{row.email}</td>
                  <td>{row.totalOrders}</td>
                  <td>
                    <span className="customer-spending-badge customer-spending-badge--spent">
                      {row.totalSpent}
                    </span>
                  </td>
                  <td>{row.avgOrderValue}</td>
                  <td>{row.lastPurchase}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default CustomerSpendingPage;
