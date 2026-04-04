import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/EmptyState";
import FilterBar from "../components/FilterBar";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { revenueService } from "../services/revenueService";
import {
  DEFAULT_REPORT_FROM_DATE,
  DEFAULT_REPORT_TO_DATE,
  formatDateRangeLabel,
} from "../utils/dateRange";
import "./RevenuePage.css";

const PAGE_SIZE = 5;

function RevenuePage() {
  const [revenueData, setRevenueData] = useState(
    revenueService.getEmptyRevenue(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [fromDate, setFromDate] = useState(DEFAULT_REPORT_FROM_DATE);
  const [toDate, setToDate] = useState(DEFAULT_REPORT_TO_DATE);
  const [slotFilter, setSlotFilter] = useState("All Slots");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const dateRangeLabel = formatDateRangeLabel(fromDate, toDate);
  const summaryCards = revenueData.summaryCards;
  const rows = revenueData.rows;

  useEffect(() => {
    const loadRevenue = async () => {
      try {
        setIsLoading(true);
        setPageError("");
        const nextRevenue = await revenueService.getRevenueSummary(
          fromDate,
          toDate,
        );
        setRevenueData(nextRevenue);
      } catch (error) {
        setPageError(
          error instanceof Error
            ? error.message
            : "Failed to load revenue summary.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadRevenue();
  }, [fromDate, toDate]);

  const filteredRows = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSlot = slotFilter === "All Slots" || row.slot === slotFilter;
      const matchesKeyword =
        !keyword ||
        row.packageName.toLowerCase().includes(keyword) ||
        row.slot.toLowerCase().includes(keyword);

      return matchesSlot && matchesKeyword;
    });
  }, [rows, searchKeyword, slotFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

  const paginatedRows = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredRows.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredRows, page]);

  useEffect(() => {
    setPage(1);
  }, [fromDate, searchKeyword, slotFilter, toDate]);

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
      `Revenue report export started for ${dateRangeLabel} • ${slotFilter}.`,
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
              id: "revenue-from-date",
              label: "From Date",
              type: "date",
              value: fromDate,
              onChange: setFromDate,
            },
            {
              id: "revenue-to-date",
              label: "To Date",
              type: "date",
              value: toDate,
              onChange: setToDate,
            },
            {
              id: "revenue-slot-filter",
              label: "Placement Slot",
              type: "select",
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

      <SearchToolbar
        placeholder="Search by package name or slot"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
        filterSummary={`Current slot filter: ${slotFilter} • ${dateRangeLabel}`}
      />

      {isLoading ? (
        <SectionCard title="Revenue KPIs">
          <EmptyState
            title="Loading revenue"
            description="Fetching revenue metrics from the admin API."
          />
        </SectionCard>
      ) : pageError ? (
        <SectionCard title="Revenue KPIs">
          <EmptyState title="Unable to load revenue" description={pageError} />
        </SectionCard>
      ) : (
        <div className="revenue-cards">
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
        title="Revenue by Package"
        description={`${dateRangeLabel} • ${slotFilter}`}
      >
        {isLoading ? (
          <EmptyState
            title="Loading revenue rows"
            description="Fetching revenue rows from the admin API."
          />
        ) : pageError ? (
          <EmptyState title="Unable to load revenue rows" description={pageError} />
        ) : filteredRows.length === 0 ? (
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
