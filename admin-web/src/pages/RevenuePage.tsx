import { useState } from "react";
import FilterBar from "../components/FilterBar";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { revenueService } from "../services/revenueService";
import "./RevenuePage.css";

function RevenuePage() {
  const summaryCards = revenueService.getRevenueCards();
  const rows = revenueService.getRevenueRows();

  const [dateRange, setDateRange] = useState("Last 30 Days");
  const [slotFilter, setSlotFilter] = useState("All Slots");

  return (
    <div className="revenue-page">
      <PageHeader
        title="Revenue Summary"
        description="Track promotion revenue across slots, packages, and sales periods."
        actionLabel="Export Revenue Report"
      />

      <SectionCard
        title="Revenue Filters"
        description="Narrow the reporting period and placement scope."
      >
        <FilterBar
          fields={[
            {
              id: "revenue-date-range",
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
              id: "revenue-slot-filter",
              label: "Placement Slot",
              value: slotFilter,
              onChange: setSlotFilter,
              options: [
                "All Slots",
                "Home Top",
                "Category Top",
                "Search Boost",
              ],
            },
          ]}
        />
      </SectionCard>

      <div className="revenue-cards">
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
        title="Revenue by Package"
        description={`${dateRange} • ${slotFilter}`}
      >
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
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>#{row.id}</td>
                  <td>{row.packageName}</td>
                  <td>
                    <StatusBadge label={row.slot} variant="slot" />
                  </td>
                  <td>{row.orders}</td>
                  <td>{row.revenue}</td>
                  <td>
                    <StatusBadge
                      label={row.growth}
                      variant={
                        row.growth.startsWith("-") ? "negative" : "positive"
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

export default RevenuePage;
