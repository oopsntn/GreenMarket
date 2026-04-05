import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/EmptyState";
import FilterBar from "../components/FilterBar";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { customerSpendingService } from "../services/customerSpendingService";
import type { CustomerSpendingRow } from "../types/customerSpending";
import {
  DEFAULT_REPORT_FROM_DATE,
  DEFAULT_REPORT_TO_DATE,
  formatDateRangeLabel,
} from "../utils/dateRange";
import "./CustomerSpendingPage.css";

const PAGE_SIZE = 5;

const parseCurrencyValue = (value: string) => {
  const numericValue = Number(value.replace(/[^\d]/g, ""));
  return Number.isNaN(numericValue) ? 0 : numericValue;
};

function CustomerSpendingPage() {
  const [customerSpendingData, setCustomerSpendingData] = useState(
    customerSpendingService.getEmptyCustomerSpending(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [fromDate, setFromDate] = useState(DEFAULT_REPORT_FROM_DATE);
  const [toDate, setToDate] = useState(DEFAULT_REPORT_TO_DATE);
  const [customerSegment, setCustomerSegment] = useState("All Customers");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const dateRangeLabel = formatDateRangeLabel(fromDate, toDate);
  const summaryCards = customerSpendingData.summaryCards;
  const rows = customerSpendingData.rows;

  useEffect(() => {
    const loadCustomerSpending = async () => {
      try {
        setIsLoading(true);
        setPageError("");
        const nextCustomerSpending =
          await customerSpendingService.getCustomerSpendingSummary(
            fromDate,
            toDate,
          );
        setCustomerSpendingData(nextCustomerSpending);
      } catch (error) {
        setPageError(
          error instanceof Error
            ? error.message
            : "Failed to load customer spending summary.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadCustomerSpending();
  }, [fromDate, toDate]);

  const filteredRows = useMemo(() => {
    let segmentRows = rows;

    if (customerSegment === "Top Spenders") {
      const sortedRows = [...rows].sort(
        (a, b) =>
          parseCurrencyValue(b.totalSpent) - parseCurrencyValue(a.totalSpent),
      );
      segmentRows = sortedRows.slice(0, 5);
    }

    if (customerSegment === "Returning Buyers") {
      segmentRows = rows.filter((row) => row.totalOrders >= 5);
    }

    if (customerSegment === "New Customers") {
      segmentRows = rows.filter((row) => row.totalOrders <= 2);
    }

    const keyword = searchKeyword.trim().toLowerCase();

    return segmentRows.filter((row) => {
      if (!keyword) return true;

      return (
        row.customerName.toLowerCase().includes(keyword) ||
        row.email.toLowerCase().includes(keyword)
      );
    });
  }, [customerSegment, rows, searchKeyword]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

  const paginatedRows = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredRows.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredRows, page]);

  useEffect(() => {
    setPage(1);
  }, [customerSegment, fromDate, searchKeyword, toDate]);

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
      `Customer spending report export started for ${dateRangeLabel} • ${customerSegment}.`,
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
              id: "customer-spending-from-date",
              label: "From Date",
              type: "date",
              value: fromDate,
              onChange: setFromDate,
            },
            {
              id: "customer-spending-to-date",
              label: "To Date",
              type: "date",
              value: toDate,
              onChange: setToDate,
            },
            {
              id: "customer-segment",
              label: "Customer Segment",
              type: "select",
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

      <SearchToolbar
        placeholder="Search by customer name or email"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
        filterSummary={`Current segment: ${customerSegment} • ${dateRangeLabel}`}
      />

      {isLoading ? (
        <SectionCard title="Customer Spending KPIs">
          <EmptyState
            title="Loading customer spending"
            description="Fetching customer spend metrics from the admin API."
          />
        </SectionCard>
      ) : pageError ? (
        <SectionCard title="Customer Spending KPIs">
          <EmptyState
            title="Unable to load customer spending"
            description={pageError}
          />
        </SectionCard>
      ) : (
        <div className="customer-spending-cards">
          {summaryCards.map((card) => (
            <SectionCard key={card.title}>
              <StatCard
                title={card.title}
                value={card.value}
                subtitle={`${card.note} • ${dateRangeLabel}`}
              />
            </SectionCard>
          ))}
        </div>
      )}

      <SectionCard
        title="Top Customer Spending"
        description={`${dateRangeLabel} • ${customerSegment}`}
      >
        {isLoading ? (
          <EmptyState
            title="Loading customer rows"
            description="Fetching customer spend rows from the admin API."
          />
        ) : pageError ? (
          <EmptyState
            title="Unable to load customer spending rows"
            description={pageError}
          />
        ) : filteredRows.length === 0 ? (
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
