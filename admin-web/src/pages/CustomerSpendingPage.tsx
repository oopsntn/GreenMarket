import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/EmptyState";
import FilterBar from "../components/FilterBar";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { customerSpendingService } from "../services/customerSpendingService";
import type { CustomerSpendingRow } from "../types/customerSpending";
import "./CustomerSpendingPage.css";

const PAGE_SIZE = 5;

const parseCurrencyValue = (value: string) => {
  const numericValue = Number(value.replace(/[^\d]/g, ""));
  return Number.isNaN(numericValue) ? 0 : numericValue;
};

function CustomerSpendingPage() {
  const summaryCards = customerSpendingService.getCustomerSpendingCards();
  const rows = customerSpendingService.getCustomerSpendingRows();

  const [dateRange, setDateRange] = useState("Last 30 Days");
  const [customerSegment, setCustomerSegment] = useState("All Customers");
  const [page, setPage] = useState(1);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const filteredRows = useMemo(() => {
    if (customerSegment === "All Customers") return rows;

    if (customerSegment === "Top Spenders") {
      const sortedRows = [...rows].sort(
        (a, b) =>
          parseCurrencyValue(b.totalSpent) - parseCurrencyValue(a.totalSpent),
      );
      return sortedRows.slice(0, 5);
    }

    if (customerSegment === "Returning Buyers") {
      return rows.filter((row) => row.totalOrders >= 5);
    }

    if (customerSegment === "New Customers") {
      return rows.filter((row) => row.totalOrders <= 2);
    }

    return rows;
  }, [customerSegment, rows]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

  const paginatedRows = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredRows.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredRows, page]);

  useEffect(() => {
    setPage(1);
  }, [customerSegment, dateRange]);

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

  const handleExportCustomerReport = () => {
    showToast(
      `Customer spending report export started for ${dateRange} • ${customerSegment}.`,
    );
  };

  return (
    <div className="customer-spending-page">
      <PageHeader
        title="Customer Spending Report"
        description="Track customer purchase behavior and promotion spending activity."
        actionLabel="Export Customer Report"
        onActionClick={handleExportCustomerReport}
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
        {filteredRows.length === 0 ? (
          <EmptyState
            title="No customer spending data found"
            description="No customer records match the current segment filter."
          />
        ) : (
          <div className="customer-spending-table-section">
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
                  {paginatedRows.map((row: CustomerSpendingRow) => (
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

            <div className="customer-spending-pagination">
              <span className="customer-spending-pagination__info">
                Page {page} of {totalPages}
              </span>

              <div className="customer-spending-pagination__actions">
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

export default CustomerSpendingPage;
