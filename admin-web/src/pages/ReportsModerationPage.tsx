import { useEffect, useMemo, useState } from "react";
import BaseModal from "../components/BaseModal";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { reportModerationService } from "../services/reportModerationService";
import type {
  ReportModerationItem,
  ReportModerationStatus,
} from "../types/reportModeration";
import "./ReportsModerationPage.css";

const PAGE_SIZE = 6;

type StatusFilter = ReportModerationStatus | "All";

type ResolutionState = {
  isOpen: boolean;
  action: "resolve" | "dismiss" | null;
  report: ReportModerationItem | null;
};

const statusOptions: StatusFilter[] = ["All", "Pending", "Resolved", "Dismissed"];

function ReportsModerationPage() {
  const [reports, setReports] = useState<ReportModerationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("All");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState<ReportModerationItem | null>(
    null,
  );
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [resolutionState, setResolutionState] = useState<ResolutionState>({
    isOpen: false,
    action: null,
    report: null,
  });
  const [adminNote, setAdminNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

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

  const loadReports = async (showSuccessToast = false) => {
    try {
      setIsLoading(true);
      setError("");

      const nextReports = await reportModerationService.fetchReports();
      setReports(nextReports);

      if (showSuccessToast) {
        showToast("Report moderation queue refreshed.");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load moderation reports.";
      setError(message);
      showToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadReports();
  }, []);

  const filteredReports = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return reports.filter((report) => {
      const matchesKeyword =
        !keyword ||
        report.reason.toLowerCase().includes(keyword) ||
        report.reporterLabel.toLowerCase().includes(keyword) ||
        report.postLabel.toLowerCase().includes(keyword) ||
        report.shopLabel.toLowerCase().includes(keyword) ||
        report.reasonCode.toLowerCase().includes(keyword);

      const matchesStatus =
        selectedStatus === "All" || report.status === selectedStatus;

      return matchesKeyword && matchesStatus;
    });
  }, [reports, searchKeyword, selectedStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / PAGE_SIZE));

  const paginatedReports = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredReports.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredReports, page]);

  useEffect(() => {
    setPage(1);
  }, [searchKeyword, selectedStatus]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pendingCount = reports.filter((report) => report.status === "Pending").length;
  const resolvedCount = reports.filter((report) => report.status === "Resolved").length;
  const dismissedCount = reports.filter((report) => report.status === "Dismissed").length;

  const openDetailModal = async (report: ReportModerationItem) => {
    setSelectedReport(report);
    setIsDetailLoading(true);

    try {
      const detail = await reportModerationService.fetchReportById(report.id);
      setSelectedReport(detail);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Unable to load report details.",
        "error",
      );
    } finally {
      setIsDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setSelectedReport(null);
  };

  const openResolutionModal = (
    report: ReportModerationItem,
    action: "resolve" | "dismiss",
  ) => {
    setResolutionState({
      isOpen: true,
      action,
      report,
    });
    setAdminNote(report.adminNote === "No admin note" ? "" : report.adminNote);
  };

  const closeResolutionModal = () => {
    setResolutionState({
      isOpen: false,
      action: null,
      report: null,
    });
    setAdminNote("");
  };

  const handleResolutionSubmit = async () => {
    if (!resolutionState.report || !resolutionState.action) return;

    try {
      setIsSubmitting(true);

      const updatedReport = await reportModerationService.updateReportStatus(
        resolutionState.report.id,
        resolutionState.action === "resolve" ? "Resolved" : "Dismissed",
        adminNote,
      );

      setReports((prev) =>
        prev.map((report) =>
          report.id === updatedReport.id ? updatedReport : report,
        ),
      );
      setSelectedReport((prev) =>
        prev && prev.id === updatedReport.id ? updatedReport : prev,
      );

      showToast(
        `Report #${updatedReport.id} was ${
          resolutionState.action === "resolve" ? "resolved" : "dismissed"
        }.`,
      );

      closeResolutionModal();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Unable to update report status.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reports-moderation-page">
      <PageHeader
        title="Reports Moderation"
        description="Review submitted reports, inspect reasons, and resolve or dismiss them."
        actionLabel="Refresh Reports"
        onActionClick={() => void loadReports(true)}
      />

      <div className="reports-moderation-summary-grid">
        <StatCard
          title="Total Reports"
          value={String(reports.length)}
          subtitle="Reports currently available in moderation"
        />
        <StatCard
          title="Pending"
          value={String(pendingCount)}
          subtitle="Reports waiting for admin action"
        />
        <StatCard
          title="Resolved"
          value={String(resolvedCount)}
          subtitle="Reports handled and resolved"
        />
        <StatCard
          title="Dismissed"
          value={String(dismissedCount)}
          subtitle="Reports dismissed by moderation"
        />
      </div>

      <SearchToolbar
        placeholder="Search by reason, reporter, post, shop, or code"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
        onFilterClick={() => setShowFilters((prev) => !prev)}
        filterLabel="Filter by status"
        filterSummaryItems={[selectedStatus]}
      />

      {showFilters ? (
        <SectionCard
          title="Report Filters"
          description="Refine the queue by moderation status."
        >
          <div className="reports-moderation-filters">
            <div className="reports-moderation-filters__field">
              <label htmlFor="report-status-filter">Status</label>
              <select
                id="report-status-filter"
                value={selectedStatus}
                onChange={(event) =>
                  setSelectedStatus(event.target.value as StatusFilter)
                }
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Report Queue"
        description="Inspect report metadata and decide whether to resolve or dismiss."
      >
        {isLoading ? (
          <EmptyState
            title="Loading reports"
            description="Fetching reports from the admin moderation API."
          />
        ) : error ? (
          <EmptyState title="Unable to load reports" description={error} />
        ) : filteredReports.length === 0 ? (
          <EmptyState
            title="No reports found"
            description="No reports match the current search or status filter."
          />
        ) : (
          <>
            <div className="reports-moderation-table-wrapper">
              <table className="reports-moderation-table">
                <thead>
                  <tr>
                    <th>Report</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedReports.map((report) => (
                    <tr key={report.id}>
                      <td>
                        <div className="reports-moderation-cell">
                          <strong>#{report.id}</strong>
                          <span>{report.reporterLabel}</span>
                          <small>{report.reporterSecondaryLabel}</small>
                        </div>
                      </td>
                      <td>
                        <div className="reports-moderation-cell">
                          <strong>{report.reasonCode}</strong>
                          <span>{report.reason}</span>
                          <small>
                            {report.postLabel} • {report.shopLabel}
                          </small>
                        </div>
                      </td>
                      <td>
                        <div className="reports-moderation-status">
                          <StatusBadge
                            label={report.status}
                            variant={
                              report.status === "Resolved"
                                ? "active"
                                : report.status === "Dismissed"
                                  ? "locked"
                                  : "processing"
                            }
                          />
                          <small>{report.updatedAt}</small>
                        </div>
                      </td>
                      <td>{report.createdAt}</td>
                      <td>
                        <div className="reports-moderation-actions">
                          <button
                            type="button"
                            className="reports-moderation-actions__view"
                            onClick={() => void openDetailModal(report)}
                          >
                            View
                          </button>
                          {report.status !== "Resolved" ? (
                            <button
                              type="button"
                              className="reports-moderation-actions__resolve"
                              onClick={() =>
                                openResolutionModal(report, "resolve")
                              }
                            >
                              Resolve
                            </button>
                          ) : null}
                          {report.status !== "Dismissed" ? (
                            <button
                              type="button"
                              className="reports-moderation-actions__dismiss"
                              onClick={() =>
                                openResolutionModal(report, "dismiss")
                              }
                            >
                              Dismiss
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="reports-moderation-pagination">
              <span className="reports-moderation-pagination__info">
                Page {page} of {totalPages}
              </span>
              <div className="reports-moderation-pagination__actions">
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
          </>
        )}
      </SectionCard>

      <BaseModal
        isOpen={selectedReport !== null}
        title={`Report ${selectedReport ? `#${selectedReport.id}` : ""}`}
        description="Review full report detail and moderation notes."
        onClose={closeDetailModal}
        maxWidth="760px"
      >
        {isDetailLoading && !selectedReport?.reason ? (
          <div className="reports-moderation-empty-state">
            Loading report details...
          </div>
        ) : selectedReport ? (
          <div className="reports-moderation-detail">
            <div className="reports-moderation-detail__grid">
              <div className="reports-moderation-detail__field">
                <label>Status</label>
                <input type="text" value={selectedReport.status} disabled />
              </div>
              <div className="reports-moderation-detail__field">
                <label>Reporter</label>
                <input type="text" value={selectedReport.reporterLabel} disabled />
              </div>
              <div className="reports-moderation-detail__field">
                <label>Post</label>
                <input type="text" value={selectedReport.postLabel} disabled />
              </div>
              <div className="reports-moderation-detail__field">
                <label>Shop</label>
                <input type="text" value={selectedReport.shopLabel} disabled />
              </div>
            </div>

            <div className="reports-moderation-detail__section">
              <h4>Reported Reason</h4>
              <p>{selectedReport.reason}</p>
            </div>

            <div className="reports-moderation-detail__section">
              <h4>Reporter Note</h4>
              <p>{selectedReport.reporterNote}</p>
            </div>

            <div className="reports-moderation-detail__section">
              <h4>Admin Note</h4>
              <p>{selectedReport.adminNote}</p>
            </div>
          </div>
        ) : null}
      </BaseModal>

      <BaseModal
        isOpen={resolutionState.isOpen}
        title={
          resolutionState.action === "resolve" ? "Resolve Report" : "Dismiss Report"
        }
        description="Record an optional moderation note before finalizing this report."
        onClose={closeResolutionModal}
        maxWidth="520px"
      >
        <div className="reports-moderation-form">
          <p className="reports-moderation-form__target">
            Target: <strong>Report #{resolutionState.report?.id || "Selected"}</strong>
          </p>
          <label htmlFor="report-admin-note">Admin Note</label>
          <textarea
            id="report-admin-note"
            rows={4}
            value={adminNote}
            onChange={(event) => setAdminNote(event.target.value)}
            placeholder="Optional moderation note"
          />

          <div className="reports-moderation-form__actions">
            <button type="button" onClick={closeResolutionModal}>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleResolutionSubmit()}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Confirm"}
            </button>
          </div>
        </div>
      </BaseModal>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default ReportsModerationPage;
