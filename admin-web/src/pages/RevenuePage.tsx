import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import StatusBadge from "../components/StatusBadge";
import { revenueService } from "../services/revenueService";
import "./RevenuePage.css";

function RevenuePage() {
  const summaryCards = revenueService.getRevenueCards();
  const rows = revenueService.getRevenueRows();

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
        <div className="revenue-filters revenue-filters--padded">
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
      </SectionCard>

      <div className="revenue-cards">
        {summaryCards.map((card) => (
          <SectionCard key={card.title}>
            <div className="revenue-card">
              <span>{card.title}</span>
              <strong>{card.value}</strong>
              <small>{card.note}</small>
            </div>
          </SectionCard>
        ))}
      </div>

      <SectionCard
        title="Revenue by Package"
        description="Current reporting period"
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
