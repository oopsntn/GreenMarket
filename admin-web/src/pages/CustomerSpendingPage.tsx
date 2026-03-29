import { useState } from "react";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { customerSpendingService } from "../services/customerSpendingService";
import "./CustomerSpendingPage.css";

function CustomerSpendingPage() {
  const summaryCards = customerSpendingService.getCustomerSpendingCards();
  const rows = customerSpendingService.getCustomerSpendingRows();

  const [dateRange, setDateRange] = useState("Last 30 Days");
  const [customerSegment, setCustomerSegment] = useState("All Customers");

  return (
    <div className="customer-spending-page">
      <PageHeader
        title="Customer Spending Report"
        description="Track customer purchase behavior and promotion spending activity."
        actionLabel="Export Customer Report"
      />

      <SectionCard
        title="Customer Spending Filters"
        description="Narrow the reporting period and customer segment."
      >
        <div className="customer-spending-filters customer-spending-filters--padded">
          <div className="customer-spending-field">
            <label htmlFor="customer-date-range">Date Range</label>
            <select
              id="customer-date-range"
              value={dateRange}
              onChange={(event) => setDateRange(event.target.value)}
            >
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
              <option>This Year</option>
            </select>
          </div>

          <div className="customer-spending-field">
            <label htmlFor="customer-segment">Customer Segment</label>
            <select
              id="customer-segment"
              value={customerSegment}
              onChange={(event) => setCustomerSegment(event.target.value)}
            >
              <option>All Customers</option>
              <option>Top Spenders</option>
              <option>Returning Buyers</option>
              <option>New Customers</option>
            </select>
          </div>
        </div>
      </SectionCard>

      <div className="customer-spending-cards">
        {summaryCards.map((card) => (
          <SectionCard key={card.title}>
            <StatCard
              title={card.title}
              value={card.value}
              subtitle={`${card.note} • ${dateRange}`}
            />
          </SectionCard>
        ))}
      </div>

      <SectionCard
        title="Top Customer Spending"
        description={`${dateRange} • ${customerSegment}`}
      >
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
                    <StatusBadge label={row.totalSpent} variant="success" />
                  </td>
                  <td>{row.avgOrderValue}</td>
                  <td>{row.lastPurchase}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

export default CustomerSpendingPage;
