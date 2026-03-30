import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/EmptyState";
import FilterBar from "../components/FilterBar";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { revenueService } from "../services/revenueService";
import "./RevenuePage.css";

const PAGE_SIZE = 5;

function RevenuePage() {
  const summaryCards = revenueService.getRevenueCards();
  const rows = revenueService.getRevenueRows();

  const [dateRange, setDateRange] = useState("Last 30 Days");
  const [slotFilter, setSlotFilter] = useState("All Slots");
  const [page, setPage] = useState(1);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const filteredRows = useMemo(() => {
    if (slotFilter === "All Slots") return rows;
    return rows.filter((row) => row.slot === slotFilter);
  }, [rows, slotFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

  const paginatedRows = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredRows.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredRows, page]);

  useEffect(() => {
    setPage(1);
  }, [slotFilter, dateRange]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const showToast = (message: string, tone: ToastItem["tone"] = "success") => {
    const toastId = Date.now() + Math.random();

    setToasts((prev) => [...prev, { id: toastId, message, tone }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
    }, 2600);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const handleExportRevenueReport = () => {
    showToast(
      `Revenue report export started for ${dateRange} • ${slotFilter}.`,
    );
  };

  return (
    <div className="revenue-page">
      <PageHeader
        title="Revenue Summary"
        description="Track promotion revenue across slots, packages, and sales periods."
        actionLabel="Export Revenue Report"
        onActionClick={handleExportRevenueReport}
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
        {filteredRows.length === 0 ? (
          <EmptyState
            title="No revenue rows found"
            description="No revenue package data matches the current filter settings."
          />
        ) : (
          <div className="revenue-table-section">
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
                  {paginatedRows.map((row) => (
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

            <div className="revenue-pagination">
              <span className="revenue-pagination__info">
                Page {page} of {totalPages}
              </span>

              <div className="revenue-pagination__actions">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default RevenuePage;
