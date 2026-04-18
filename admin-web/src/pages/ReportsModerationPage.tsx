import { useCallback, useEffect, useMemo, useState } from "react";
import BaseModal from "../components/BaseModal";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { reportModerationService } from "../services/reportModerationService";
import { templateService } from "../services/templateService";
import type {
  ReportModerationItem,
  ReportModerationStatus,
} from "../types/reportModeration";
import type { Template } from "../types/template";
import "./ReportsModerationPage.css";

const PAGE_SIZE = 6;

type StatusFilter = ReportModerationStatus | "All";

type ResolutionState = {
  isOpen: boolean;
  action: "resolve" | "dismiss" | null;
  report: ReportModerationItem | null;
};

const statusOptions: StatusFilter[] = [
  "All",
  "Pending",
  "Resolved",
  "Dismissed",
];

const getStatusLabel = (status: StatusFilter) => {
  switch (status) {
    case "Pending":
      return "Chờ xử lý";
    case "Resolved":
      return "Đã xử lý";
    case "Dismissed":
      return "Đã bỏ qua";
    default:
      return "Tất cả";
  }
};

const getTemplateTypeLabel = (type: string) => {
  switch (type) {
    case "Report Reason":
      return "Lý do báo cáo";
    case "Notification":
      return "Thông báo";
    case "Rejection Reason":
      return "Lý do từ chối";
    default:
      return type;
  }
};

function ReportsModerationPage() {
  const [reports, setReports] = useState<ReportModerationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("All");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedReport, setSelectedReport] =
    useState<ReportModerationItem | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [resolutionState, setResolutionState] = useState<ResolutionState>({
    isOpen: false,
    action: null,
    report: null,
  });
  const [adminNote, setAdminNote] = useState("");
  const [reportTemplates, setReportTemplates] = useState<Template[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
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

  const loadReports = useCallback(async (showSuccessToast = false) => {
    try {
      setIsLoading(true);
      setError("");

      const nextReports = await reportModerationService.fetchReports();
      setReports(nextReports);

      if (showSuccessToast) {
        showToast("Đã làm mới danh sách báo cáo.");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Không thể tải danh sách báo cáo.";
      setError(message);
      showToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadReportTemplates = useCallback(async () => {
    try {
      setIsLoadingTemplates(true);
      const [reasonTemplates, notificationTemplates] = await Promise.all([
        templateService.getTemplates({
          type: "Report Reason",
          status: "Active",
          page: 1,
          pageSize: 100,
        }),
        templateService.getTemplates({
          type: "Notification",
          status: "Active",
          page: 1,
          pageSize: 100,
        }),
      ]);

      setReportTemplates([
        ...reasonTemplates.data,
        ...notificationTemplates.data,
      ]);
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : "Không thể tải danh sách mẫu nội dung cho báo cáo.",
        "error",
      );
    } finally {
      setIsLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    void loadReports();
    void loadReportTemplates();
  }, [loadReports, loadReportTemplates]);

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

  const selectedTemplate = useMemo(
    () =>
      reportTemplates.find((template) => String(template.id) === selectedTemplateId) ??
      null,
    [reportTemplates, selectedTemplateId],
  );
  const reportReasonTemplateCount = reportTemplates.filter(
    (template) => template.type === "Report Reason",
  ).length;
  const notificationTemplateCount = reportTemplates.filter(
    (template) => template.type === "Notification",
  ).length;

  useEffect(() => {
    setPage(1);
  }, [searchKeyword, selectedStatus]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pendingCount = reports.filter((report) => report.status === "Pending")
    .length;
  const resolvedCount = reports.filter((report) => report.status === "Resolved")
    .length;
  const dismissedCount = reports.filter(
    (report) => report.status === "Dismissed",
  ).length;

  const openDetailModal = async (report: ReportModerationItem) => {
    setSelectedReport(report);
    setIsDetailLoading(true);

    try {
      const detail = await reportModerationService.fetchReportById(report.id);
      setSelectedReport(detail);
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : "Không thể tải chi tiết báo cáo.",
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
    setSelectedTemplateId("");
    setAdminNote(
      report.adminNote === "Chưa có ghi chú từ quản trị viên"
        ? ""
        : report.adminNote,
    );
  };

  const closeResolutionModal = () => {
    setResolutionState({
      isOpen: false,
      action: null,
      report: null,
    });
    setSelectedTemplateId("");
    setAdminNote("");
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);

    const template = reportTemplates.find(
      (item) => String(item.id) === templateId,
    );

    if (template) {
      setAdminNote(template.content);
    }
  };

  const handleResolutionSubmit = async () => {
    if (!resolutionState.report || !resolutionState.action) return;

    try {
      setIsSubmitting(true);

      const updatedReport = await reportModerationService.updateReportStatus(
        resolutionState.report.id,
        resolutionState.action === "resolve" ? "Resolved" : "Dismissed",
        adminNote,
        selectedTemplate ? selectedTemplate.id : undefined,
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
        resolutionState.action === "resolve"
          ? `Đã xử lý báo cáo #${updatedReport.id}.`
          : `Đã bỏ qua báo cáo #${updatedReport.id}.`,
      );

      closeResolutionModal();
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : "Không thể cập nhật trạng thái báo cáo.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reports-moderation-page">
      <PageHeader
        title="Kiểm duyệt báo cáo"
        description="Xem báo cáo do người dùng gửi lên, kiểm tra lý do và quyết định xử lý hoặc bỏ qua."
        actionLabel="Làm mới báo cáo"
        onActionClick={() => void loadReports(true)}
      />

      <div className="reports-moderation-summary-grid">
        <StatCard
          title="Tổng báo cáo"
          value={String(reports.length)}
          subtitle="Tất cả báo cáo hiện có trong hàng chờ kiểm duyệt"
        />
        <StatCard
          title="Chờ xử lý"
          value={String(pendingCount)}
          subtitle="Báo cáo đang chờ quản trị viên xử lý"
        />
        <StatCard
          title="Đã xử lý"
          value={String(resolvedCount)}
          subtitle="Báo cáo đã được chấp nhận và xử lý"
        />
        <StatCard
          title="Đã bỏ qua"
          value={String(dismissedCount)}
          subtitle="Báo cáo đã được xác nhận là không cần xử lý"
        />
      </div>

      <SearchToolbar
        placeholder="Tìm theo lý do, người báo cáo, bài đăng, cửa hàng hoặc mã lý do"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
        onFilterClick={() => setShowFilters((prev) => !prev)}
        filterLabel="Lọc theo trạng thái"
        filterSummaryItems={[getStatusLabel(selectedStatus)]}
      />

      {showFilters ? (
        <SectionCard
          title="Bộ lọc báo cáo"
          description="Thu hẹp danh sách theo trạng thái xử lý hiện tại."
        >
          <div className="reports-moderation-filters">
            <div className="reports-moderation-filters__field">
              <label htmlFor="report-status-filter">Trạng thái</label>
              <select
                id="report-status-filter"
                value={selectedStatus}
                onChange={(event) =>
                  setSelectedStatus(event.target.value as StatusFilter)
                }
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {getStatusLabel(option)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Hàng chờ báo cáo"
        description="Kiểm tra thông tin báo cáo và ra quyết định xử lý cuối cùng."
      >
        {isLoading ? (
          <EmptyState
            title="Đang tải báo cáo"
            description="Đang lấy dữ liệu báo cáo từ API quản trị."
          />
        ) : error ? (
          <EmptyState title="Không thể tải báo cáo" description={error} />
        ) : filteredReports.length === 0 ? (
          <EmptyState
            title="Không có báo cáo phù hợp"
            description="Không có báo cáo nào khớp với bộ lọc hoặc từ khóa hiện tại."
          />
        ) : (
          <>
            <div className="reports-moderation-table-wrapper">
              <table className="reports-moderation-table">
                <thead>
                  <tr>
                    <th>Báo cáo</th>
                    <th>Lý do</th>
                    <th>Trạng thái</th>
                    <th>Thời gian tạo</th>
                    <th>Thao tác</th>
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
                            label={getStatusLabel(report.status)}
                            variant={
                              report.status === "Resolved"
                                ? "active"
                                : report.status === "Dismissed"
                                  ? "locked"
                                  : "processing"
                            }
                          />
                          <small>Cập nhật: {report.updatedAt}</small>
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
                            Xem
                          </button>
                          {report.status !== "Resolved" ? (
                            <button
                              type="button"
                              className="reports-moderation-actions__resolve"
                              onClick={() =>
                                openResolutionModal(report, "resolve")
                              }
                            >
                              Xử lý
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
                              Bỏ qua
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
                Trang {page} / {totalPages}
              </span>
              <div className="reports-moderation-pagination__actions">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                >
                  Trước
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={page === totalPages}
                >
                  Sau
                </button>
              </div>
            </div>
          </>
        )}
      </SectionCard>

      <BaseModal
        isOpen={selectedReport !== null}
        title={
          selectedReport
            ? `Chi tiết báo cáo #${selectedReport.id}`
            : "Chi tiết báo cáo"
        }
        description="Xem đầy đủ thông tin báo cáo, nội dung người gửi và ghi chú quản trị."
        onClose={closeDetailModal}
        maxWidth="760px"
      >
        {isDetailLoading && !selectedReport?.reason ? (
          <div className="reports-moderation-empty-state">
            Đang tải chi tiết báo cáo...
          </div>
        ) : selectedReport ? (
          <div className="reports-moderation-detail">
            <div className="reports-moderation-detail__grid">
              <div className="reports-moderation-detail__field">
                <label>Trạng thái</label>
                <input
                  type="text"
                  value={getStatusLabel(selectedReport.status)}
                  disabled
                />
              </div>
              <div className="reports-moderation-detail__field">
                <label>Người báo cáo</label>
                <input type="text" value={selectedReport.reporterLabel} disabled />
              </div>
              <div className="reports-moderation-detail__field">
                <label>Bài đăng</label>
                <input type="text" value={selectedReport.postLabel} disabled />
              </div>
              <div className="reports-moderation-detail__field">
                <label>Cửa hàng</label>
                <input type="text" value={selectedReport.shopLabel} disabled />
              </div>
            </div>

            <div className="reports-moderation-detail__section">
              <h4>Lý do báo cáo</h4>
              <p>{selectedReport.reason}</p>
            </div>

            <div className="reports-moderation-detail__section">
              <h4>Ghi chú người báo cáo</h4>
              <p>{selectedReport.reporterNote}</p>
            </div>

            <div className="reports-moderation-detail__section">
              <h4>Ghi chú quản trị</h4>
              <p>{selectedReport.adminNote}</p>
            </div>

            <div className="reports-moderation-detail__section">
              <h4>Mẫu nội dung đã dùng</h4>
              {selectedReport.templateAudit?.templateName ? (
                <ul className="reports-moderation-detail__list">
                  <li>Tên mẫu: {selectedReport.templateAudit.templateName}</li>
                  <li>
                    Loại mẫu:{" "}
                    {selectedReport.templateAudit.templateType ||
                      "Không xác định"}
                  </li>
                  <li>
                    Nội dung cuối cùng:{" "}
                    {selectedReport.templateAudit.finalMessage ||
                      "Không có nội dung được lưu"}
                  </li>
                </ul>
              ) : (
                <p>Chưa dùng mẫu nội dung trong lần xử lý gần nhất.</p>
              )}
            </div>

            <div className="reports-moderation-detail__section">
              <h4>Evidence đính kèm</h4>
              {selectedReport.evidenceUrls.length === 0 ? (
                <p>Người báo cáo chưa đính kèm evidence.</p>
              ) : (
                <div className="reports-moderation-detail__evidence-grid">
                  {selectedReport.evidenceUrls.map((evidenceUrl) => (
                    <a
                      key={evidenceUrl}
                      href={evidenceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="reports-moderation-detail__evidence-item"
                    >
                      <img src={evidenceUrl} alt="Evidence báo cáo" />
                      <span>Mở evidence</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </BaseModal>

      <BaseModal
        isOpen={resolutionState.isOpen}
        title={
          resolutionState.action === "resolve"
            ? "Xử lý báo cáo"
            : "Bỏ qua báo cáo"
        }
        description="Chọn mẫu nội dung nếu cần, sau đó chỉnh lại ghi chú quản trị trước khi xác nhận thao tác."
        onClose={closeResolutionModal}
        maxWidth="520px"
      >
        <div className="reports-moderation-form">
          <p className="reports-moderation-form__target">
            Báo cáo mục tiêu:{" "}
            <strong>#{resolutionState.report?.id || "Đã chọn"}</strong>
          </p>

          <label htmlFor="report-template">Chọn mẫu nội dung</label>
          <div className="reports-moderation-form__picker-meta">
            <span>
              Đang hiển thị {reportTemplates.length} mẫu phù hợp cho xử lý báo cáo.
            </span>
            <small>
              Gồm {reportReasonTemplateCount} mẫu Lý do báo cáo và{" "}
              {notificationTemplateCount} mẫu Thông báo đang hoạt động.
            </small>
            <small>
              Thư viện hiện có 7 mẫu đang hoạt động, nhưng màn này chỉ lấy 2
              nhóm dùng đúng cho xử lý báo cáo nên bạn sẽ thấy 5 mẫu để chọn.
            </small>
          </div>
          <div
            id="report-template"
            className="reports-moderation-form__template-list"
          >
            {isLoadingTemplates ? (
              <div className="reports-moderation-form__template-empty">
                Đang tải mẫu nội dung...
              </div>
            ) : reportTemplates.length === 0 ? (
              <div className="reports-moderation-form__template-empty">
                Chưa có mẫu phù hợp cho màn xử lý báo cáo.
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className={`reports-moderation-form__template-card ${
                    selectedTemplateId === ""
                      ? "reports-moderation-form__template-card--selected"
                      : ""
                  }`}
                  onClick={() => {
                    setSelectedTemplateId("");
                    setAdminNote("");
                  }}
                >
                  <div className="reports-moderation-form__template-card-header">
                    <strong>Tự nhập ghi chú</strong>
                    <span>Thủ công</span>
                  </div>
                  <p>
                    Không dùng mẫu có sẵn, admin tự nhập ghi chú xử lý theo tình
                    huống.
                  </p>
                </button>
                {reportTemplates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    className={`reports-moderation-form__template-card ${
                      String(template.id) === selectedTemplateId
                        ? "reports-moderation-form__template-card--selected"
                        : ""
                    }`}
                    onClick={() => handleTemplateChange(String(template.id))}
                  >
                    <div className="reports-moderation-form__template-card-header">
                      <strong>{template.name}</strong>
                      <span>{getTemplateTypeLabel(template.type)}</span>
                    </div>
                    <p>{template.previewText}</p>
                    <small>{template.usageNote}</small>
                  </button>
                ))}
              </>
            )}
          </div>

          <small className="reports-moderation-form__hint">
            Chọn mẫu để điền nhanh nội dung, sau đó vẫn có thể chỉnh sửa thủ
            công trước khi xác nhận.
          </small>

          {selectedTemplate ? (
            <div className="reports-moderation-form__template-preview">
              <div className="reports-moderation-form__template-header">
                <strong>{selectedTemplate.name}</strong>
                <span>{getTemplateTypeLabel(selectedTemplate.type)}</span>
              </div>
              <p>{selectedTemplate.previewText}</p>
              <small>{selectedTemplate.usageNote}</small>
            </div>
          ) : null}

          <label htmlFor="report-admin-note">Ghi chú quản trị</label>
          <textarea
            id="report-admin-note"
            rows={4}
            value={adminNote}
            onChange={(event) => setAdminNote(event.target.value)}
            placeholder="Nhập ghi chú xử lý nếu cần"
          />

          <div className="reports-moderation-form__actions">
            <button type="button" onClick={closeResolutionModal}>
              Hủy
            </button>
            <button
              type="button"
              onClick={() => void handleResolutionSubmit()}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang lưu..." : "Xác nhận"}
            </button>
          </div>
        </div>
      </BaseModal>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default ReportsModerationPage;
