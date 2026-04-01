import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/EmptyState";
import FilterBar from "../components/FilterBar";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import SectionCard from "../components/SectionCard";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { exportService } from "../services/exportService";
import type {
  ExportFormat,
  ExportHistoryItem,
  FinancialReportType,
  GeneralExportModule,
} from "../types/export";
import {
  DEFAULT_REPORT_FROM_DATE,
  DEFAULT_REPORT_TO_DATE,
  formatDateRangeLabel,
} from "../utils/dateRange";
import "./ExportPage.css";

const PAGE_SIZE = 5;

function ExportPage() {
  const [historyItems, setHistoryItems] = useState<ExportHistoryItem[]>(
    exportService.getExportHistory(),
  );
  const [generalModule, setGeneralModule] =
    useState<GeneralExportModule>("Users");
  const [generalFromDate, setGeneralFromDate] = useState(
    DEFAULT_REPORT_FROM_DATE,
  );
  const [generalToDate, setGeneralToDate] = useState(DEFAULT_REPORT_TO_DATE);
  const [generalFormat, setGeneralFormat] = useState<ExportFormat>("CSV");

  const [financialReportType, setFinancialReportType] =
    useState<FinancialReportType>("Revenue Summary");
  const [financialFromDate, setFinancialFromDate] = useState(
    DEFAULT_REPORT_FROM_DATE,
  );
  const [financialToDate, setFinancialToDate] = useState(
    DEFAULT_REPORT_TO_DATE,
  );
  const [financialFormat, setFinancialFormat] = useState<ExportFormat>("CSV");
  const [historySearchKeyword, setHistorySearchKeyword] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("All Statuses");
  const [showHistoryFilters, setShowHistoryFilters] = useState(false);

  const [page, setPage] = useState(1);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const generalDateRangeLabel = formatDateRangeLabel(
    generalFromDate,
    generalToDate,
  );
  const financialDateRangeLabel = formatDateRangeLabel(
    financialFromDate,
    financialToDate,
  );

  const filteredHistory = useMemo(() => {
    const keyword = historySearchKeyword.trim().toLowerCase();

    return historyItems.filter((item) => {
      const matchesStatus =
        historyStatusFilter === "All Statuses" ||
        item.status === historyStatusFilter;
      const matchesKeyword =
        !keyword ||
        item.reportName.toLowerCase().includes(keyword) ||
        item.type.toLowerCase().includes(keyword) ||
        item.generatedBy.toLowerCase().includes(keyword);

      return matchesStatus && matchesKeyword;
    });
  }, [historyItems, historySearchKeyword, historyStatusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / PAGE_SIZE));

  const paginatedHistory = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredHistory.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredHistory, page]);

  useEffect(() => {
    setPage(1);
  }, [historySearchKeyword, historyStatusFilter]);

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

  const handleExportGeneralData = () => {
    const newHistoryItem = exportService.createGeneralExportHistoryItem(
      historyItems,
      generalModule,
      generalFormat,
    );

    setHistoryItems((prev) => [newHistoryItem, ...prev]);
    setPage(1);

    showToast(
      `${generalModule} export started for ${generalDateRangeLabel} in ${generalFormat} format.`,
    );
  };

  const handleExportFinancialReport = () => {
    const newHistoryItem = exportService.createFinancialExportHistoryItem(
      historyItems,
      financialReportType,
      financialFormat,
    );

    setHistoryItems((prev) => [newHistoryItem, ...prev]);
    setPage(1);

    showToast(
      `${financialReportType} export started for ${financialDateRangeLabel} in ${financialFormat} format.`,
    );
  };

  return (
    <div className="export-page">
      <PageHeader
        title="Export CSV"
        description="Export operational and financial reports for GreenMarket admin."
      />

      <div className="export-grid">
        <SectionCard
          title="General Data Export"
          description="Export operational records from the admin system."
        >
          <div className="export-form export-form--padded">
            <FilterBar
              fields={[
                {
                  id: "general-module",
                  label: "Module",
                  type: "select",
                  value: generalModule,
                  onChange: (value) =>
                    setGeneralModule(value as GeneralExportModule),
                  options: [
                    "Users",
                    "Categories",
                    "Attributes",
                    "Templates",
                    "Promotions",
                    "Analytics",
                  ],
                },
                {
                  id: "general-from-date",
                  label: "From Date",
                  type: "date",
                  value: generalFromDate,
                  onChange: setGeneralFromDate,
                },
                {
                  id: "general-to-date",
                  label: "To Date",
                  type: "date",
                  value: generalToDate,
                  onChange: setGeneralToDate,
                },
                {
                  id: "general-format",
                  label: "File Format",
                  type: "select",
                  value: generalFormat,
                  onChange: (value) => setGeneralFormat(value as ExportFormat),
                  options: ["CSV", "XLSX"],
                },
              ]}
            />

            <button
              className="export-button"
              type="button"
              onClick={handleExportGeneralData}
            >
              Export General Data
            </button>
          </div>
        </SectionCard>

        <SectionCard
          title="Financial Export"
          description="Export revenue and customer spending reports."
        >
          <div className="export-form export-form--padded">
            <FilterBar
              fields={[
                {
                  id: "financial-report-type",
                  label: "Report Type",
                  type: "select",
                  value: financialReportType,
                  onChange: (value) =>
                    setFinancialReportType(value as FinancialReportType),
                  options: [
                    "Revenue Summary",
                    "Customer Spending Report",
                    "Promotion Performance",
                  ],
                },
                {
                  id: "financial-from-date",
                  label: "From Date",
                  type: "date",
                  value: financialFromDate,
                  onChange: setFinancialFromDate,
                },
                {
                  id: "financial-to-date",
                  label: "To Date",
                  type: "date",
                  value: financialToDate,
                  onChange: setFinancialToDate,
                },
                {
                  id: "financial-format",
                  label: "File Format",
                  type: "select",
                  value: financialFormat,
                  onChange: (value) =>
                    setFinancialFormat(value as ExportFormat),
                  options: ["CSV", "XLSX"],
                },
              ]}
            />

            <button
              className="export-button"
              type="button"
              onClick={handleExportFinancialReport}
            >
              Export Financial Report
            </button>
          </div>
        </SectionCard>
      </div>

      <SearchToolbar
        placeholder="Search by report name, type, or generated by"
        searchValue={historySearchKeyword}
        onSearchChange={setHistorySearchKeyword}
        onFilterClick={() => setShowHistoryFilters((prev) => !prev)}
        filterLabel="Filter by export status"
        filterSummary={`Showing ${filteredHistory.length} history item(s)`}
      />

      {showHistoryFilters ? (
        <SectionCard
          title="Export History Filters"
          description="Refine recent exports by completion status."
        >
          <FilterBar
            fields={[
              {
                id: "export-history-status",
                label: "Status",
                type: "select",
                value: historyStatusFilter,
                onChange: setHistoryStatusFilter,
                options: ["All Statuses", "Completed", "In Progress"],
              },
            ]}
          />
        </SectionCard>
      ) : null}

      <SectionCard
        title="Recent Export History"
        description={`Track recently generated reports • ${historyStatusFilter}`}
      >
        {filteredHistory.length === 0 ? (
          <EmptyState
            title="No export history found"
            description="Generated export records will appear here after you run an export."
          />
        ) : (
          <div className="export-history-section">
            <div className="export-history-table-wrapper">
              <table className="export-history-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Report Name</th>
                    <th>Type</th>
                    <th>Format</th>
                    <th>Generated By</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedHistory.map((item) => (
                    <tr key={item.id}>
                      <td>#{item.id}</td>
                      <td>{item.reportName}</td>
                      <td>{item.type}</td>
                      <td>{item.format}</td>
                      <td>{item.generatedBy}</td>
                      <td>{item.date}</td>
                      <td>
                        <StatusBadge
                          label={item.status}
                          variant={
                            item.status === "Completed"
                              ? "success"
                              : "processing"
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="export-pagination">
              <span className="export-pagination__info">
                Page {page} of {totalPages}
              </span>

              <div className="export-pagination__actions">
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

export default ExportPage;
