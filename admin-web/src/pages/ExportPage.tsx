import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/EmptyState";
import FilterBar from "../components/FilterBar";
import PageHeader from "../components/PageHeader";
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
import "./ExportPage.css";

const PAGE_SIZE = 5;

function ExportPage() {
  const [historyItems, setHistoryItems] = useState<ExportHistoryItem[]>(
    exportService.getExportHistory(),
  );
  const [generalModule, setGeneralModule] =
    useState<GeneralExportModule>("Users");
  const [generalDateRange, setGeneralDateRange] = useState("Last 30 Days");
  const [generalFormat, setGeneralFormat] = useState<ExportFormat>("CSV");

  const [financialReportType, setFinancialReportType] =
    useState<FinancialReportType>("Revenue Summary");
  const [financialDateRange, setFinancialDateRange] = useState("Last 30 Days");
  const [financialFormat, setFinancialFormat] = useState<ExportFormat>("CSV");

  const [page, setPage] = useState(1);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const totalPages = Math.max(1, Math.ceil(historyItems.length / PAGE_SIZE));

  const paginatedHistory = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return historyItems.slice(startIndex, startIndex + PAGE_SIZE);
  }, [historyItems, page]);

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
      `${generalModule} export started for ${generalDateRange} in ${generalFormat} format.`,
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
      `${financialReportType} export started for ${financialDateRange} in ${financialFormat} format.`,
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
                  id: "general-date-range",
                  label: "Date Range",
                  value: generalDateRange,
                  onChange: setGeneralDateRange,
                  options: [
                    "Last 7 Days",
                    "Last 30 Days",
                    "Last 90 Days",
                    "This Year",
                  ],
                },
                {
                  id: "general-format",
                  label: "File Format",
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
                  id: "financial-date-range",
                  label: "Date Range",
                  value: financialDateRange,
                  onChange: setFinancialDateRange,
                  options: [
                    "Last 7 Days",
                    "Last 30 Days",
                    "Last 90 Days",
                    "This Year",
                  ],
                },
                {
                  id: "financial-format",
                  label: "File Format",
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

      <SectionCard
        title="Recent Export History"
        description="Track recently generated reports."
      >
        {historyItems.length === 0 ? (
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
