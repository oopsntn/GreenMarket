import { useState } from "react";
import FilterBar from "../components/FilterBar";
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
        <FilterBar
          fields={[
            {
              id: "customer-spending-date-range",
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
              id: "customer-segment",
              label: "Customer Segment",
              value: customerSegment,
              onChange: setCustomerSegment,
              options: [
                "All Customers",
                "Top Spenders",
                "Returning Buyers",
                "New Customers",
              ],
            },
          ]}
        />
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
