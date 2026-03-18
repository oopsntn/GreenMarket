import PageHeader from "../components/PageHeader";
import { customerSpendingService } from "../services/customerSpendingService";
import "./CustomerSpendingPage.css";

function CustomerSpendingPage() {
  const summaryCards = customerSpendingService.getCustomerSpendingCards();
  const rows = customerSpendingService.getCustomerSpendingRows();

  return (
    <div className="customer-spending-page">
      <PageHeader
        title="Customer Spending Report"
        description="Track customer purchase behavior and promotion spending activity."
        actionLabel="Export Customer Report"
      />

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
        {summaryCards.map((card) => (
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
              {rows.map((row) => (
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
