import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/EmptyState";
import FilterBar from "../components/FilterBar";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { analyticsService } from "../services/analyticsService";
import {
  DEFAULT_REPORT_FROM_DATE,
  DEFAULT_REPORT_TO_DATE,
  formatDateRangeLabel,
} from "../utils/dateRange";
import "./AnalyticsPage.css";

const PAGE_SIZE = 4;

function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState(
    analyticsService.getEmptyAnalytics(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [fromDate, setFromDate] = useState(DEFAULT_REPORT_FROM_DATE);
  const [toDate, setToDate] = useState(DEFAULT_REPORT_TO_DATE);
  const [metricScope, setMetricScope] = useState("All Placements");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const dateRangeLabel = formatDateRangeLabel(fromDate, toDate);
  const kpiCards = analyticsData.kpiCards;
  const placementRows = analyticsData.topPlacements;

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setIsLoading(true);
        setPageError("");
        const nextAnalytics = await analyticsService.getAnalyticsSummary(
          fromDate,
          toDate,
        );
        setAnalyticsData(nextAnalytics);
      } catch (error) {
        setPageError(
          error instanceof Error
            ? error.message
            : "Failed to load analytics summary.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadAnalytics();
  }, [fromDate, toDate]);

  const filteredRows = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return placementRows.filter((item) => {
      const matchesScope =
        metricScope === "All Placements" || item.slot === metricScope;
      const matchesKeyword =
        !keyword ||
        item.slot.toLowerCase().includes(keyword) ||
        String(item.id).includes(keyword);

      return matchesScope && matchesKeyword;
    });
  }, [metricScope, placementRows, searchKeyword]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

  const paginatedRows = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredRows.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredRows, page]);

  useEffect(() => {
    setPage(1);
  }, [metricScope, fromDate, searchKeyword, toDate]);

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

  const handleExportReport = () => {
    showToast(
      `Analytics report export started for ${dateRangeLabel} • ${metricScope}.`,
    );
  };

  const trafficOverviewTitle =
    metricScope === "All Placements"
      ? "Traffic Overview"
      : `${metricScope} Traffic Overview`;

  return (
    <div className="analytics-page">
      <PageHeader
        title="Analytics Dashboard"
        description="Monitor placement performance, engagement, and revenue trends."
        actionLabel="Export Report"
        onActionClick={handleExportReport}
      />

      <SectionCard
        title="Analytics Filters"
        description="Adjust the reporting period and analytics scope."
      >
        <FilterBar
          fields={[
            {
              id: "analytics-from-date",
              label: "From Date",
              type: "date",
              value: fromDate,
              onChange: setFromDate,
            },
            {
              id: "analytics-to-date",
              label: "To Date",
              type: "date",
              value: toDate,
              onChange: setToDate,
            },
            {
              id: "analytics-metric-scope",
              label: "Placement Scope",
              type: "select",
              value: metricScope,
              onChange: setMetricScope,
              options: [
                "All Placements",
                "Home Top",
                "Category Top",
                "Search Boost",
              ],
            },
          ]}
        />
      </SectionCard>

      <SearchToolbar
        placeholder="Search by placement slot or row ID"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
        filterSummary={`Current scope: ${metricScope} • ${dateRangeLabel}`}
      />

      {isLoading ? (
        <SectionCard title="Analytics KPIs">
          <EmptyState
            title="Loading analytics"
            description="Fetching analytics metrics from the admin API."
          />
        </SectionCard>
      ) : pageError ? (
        <SectionCard title="Analytics KPIs">
          <EmptyState
            title="Unable to load analytics"
            description={pageError}
          />
        </SectionCard>
      ) : (
        <div className="analytics-kpis">
          {kpiCards.map((card) => (
            <SectionCard key={card.title}>
              <StatCard
                title={card.title}
                value={card.value}
                subtitle={`${card.change} • ${dateRangeLabel}`}
              />
            </SectionCard>
          ))}
        </div>
      )}

      <div className="analytics-chart-grid">
        <SectionCard
          title={trafficOverviewTitle}
          description={`${dateRangeLabel} • ${metricScope}`}
        >
          <div className="analytics-panel__body">
            <div className="analytics-chart-placeholder">
              <div className="analytics-bars">
                <div style={{ height: "42%" }} />
                <div style={{ height: "58%" }} />
                <div style={{ height: "48%" }} />
                <div style={{ height: "72%" }} />
                <div style={{ height: "68%" }} />
                <div style={{ height: "84%" }} />
                <div style={{ height: "76%" }} />
                <div style={{ height: "88%" }} />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Traffic Sources"
          description={`${dateRangeLabel} • Distribution`}
        >
          <div className="analytics-panel__body">
            <div className="analytics-donut-placeholder">
              <div className="analytics-donut" />
              <ul className="analytics-legend">
                <li>
                  <span className="dot dot--dark" />
                  Direct
                </li>
                <li>
                  <span className="dot dot--mid" />
                  Search
                </li>
                <li>
                  <span className="dot dot--light" />
                  Promotions
                </li>
              </ul>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Top Placement Performance"
        description={`${dateRangeLabel} • ${metricScope}`}
      >
        {isLoading ? (
          <EmptyState
            title="Loading analytics data"
            description="Fetching placement performance rows."
          />
        ) : pageError ? (
          <EmptyState title="Unable to load analytics data" description={pageError} />
        ) : filteredRows.length === 0 ? (
          <EmptyState
            title="No analytics data found"
            description="No placement performance matches the current filter settings."
          />
        ) : (
          <div className="analytics-table-section">
            <div className="analytics-table-wrapper">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Placement Slot</th>
                    <th>Impressions</th>
                    <th>Clicks</th>
                    <th>CTR</th>
                    <th>Revenue</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedRows.map((item) => (
                    <tr key={item.id}>
                      <td>#{item.id}</td>
                      <td>{item.slot}</td>
                      <td>{item.impressions}</td>
                      <td>{item.clicks}</td>
                      <td>{item.ctr}</td>
                      <td>{item.revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="analytics-pagination">
              <span className="analytics-pagination__info">
                Page {page} of {totalPages}
              </span>

              <div className="analytics-pagination__actions">
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

export default AnalyticsPage;
