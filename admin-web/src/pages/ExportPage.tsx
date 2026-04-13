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

const GENERAL_MODULE_OPTIONS: GeneralExportModule[] = [
  "Users",
  "Categories",
  "Attributes",
  "Templates",
  "Promotions",
  "Analytics",
];

const FINANCIAL_REPORT_OPTIONS: FinancialReportType[] = [
  "Revenue Summary",
  "Customer Spending Report",
  "Promotion Performance",
];

const HISTORY_STATUS_OPTIONS = ["All Statuses", "Completed", "In Progress"] as const;

const generalModuleLabelMap: Record<GeneralExportModule, string> = {
  Users: "Người dùng",
  Categories: "Danh mục",
  Attributes: "Thuộc tính",
  Templates: "Mẫu nội dung",
  Promotions: "Khuyến mãi",
  Analytics: "Phân tích",
};

const financialReportLabelMap: Record<FinancialReportType, string> = {
  "Revenue Summary": "Tổng quan doanh thu",
  "Customer Spending Report": "Báo cáo chi tiêu khách hàng",
  "Promotion Performance": "Hiệu quả khuyến mãi",
};

const historyStatusLabelMap: Record<(typeof HISTORY_STATUS_OPTIONS)[number], string> = {
  "All Statuses": "Tất cả trạng thái",
  Completed: "Hoàn tất",
  "In Progress": "Đang xử lý",
};

function ExportPage() {
  const [historyItems, setHistoryItems] = useState<ExportHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [isGeneralExporting, setIsGeneralExporting] = useState(false);
  const [isFinancialExporting, setIsFinancialExporting] = useState(false);
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
  const [historyStatusFilter, setHistoryStatusFilter] =
    useState<(typeof HISTORY_STATUS_OPTIONS)[number]>("All Statuses");
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

  useEffect(() => {
    const loadExportHistory = async () => {
      try {
        setIsLoading(true);
        setPageError("");
        const nextHistory = await exportService.getExportHistory();
        setHistoryItems(nextHistory);
      } catch (error) {
        setPageError(
          error instanceof Error
            ? error.message
            : "Không thể tải lịch sử xuất dữ liệu.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadExportHistory();
  }, []);

  const handleExportGeneralData = async () => {
    try {
      setIsGeneralExporting(true);
      const newHistoryItem = await exportService.createGeneralExportHistoryItem(
        generalModule,
        generalFromDate,
        generalToDate,
        generalFormat,
      );

      setHistoryItems((prev) => [newHistoryItem, ...prev]);
      setPage(1);

      showToast(
        `Đã bắt đầu xuất dữ liệu ${generalModuleLabelMap[generalModule]} cho ${generalDateRangeLabel} dưới định dạng ${generalFormat}.`,
      );
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Không thể xuất dữ liệu vận hành.",
        "error",
      );
    } finally {
      setIsGeneralExporting(false);
    }
  };

  const handleExportFinancialReport = async () => {
    try {
      setIsFinancialExporting(true);
      const newHistoryItem =
        await exportService.createFinancialExportHistoryItem(
          financialReportType,
          financialFromDate,
          financialToDate,
          financialFormat,
        );

      setHistoryItems((prev) => [newHistoryItem, ...prev]);
      setPage(1);

      showToast(
        `Đã bắt đầu xuất ${financialReportLabelMap[financialReportType]} cho ${financialDateRangeLabel} dưới định dạng ${financialFormat}.`,
      );
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Không thể xuất báo cáo tài chính.",
        "error",
      );
    } finally {
      setIsFinancialExporting(false);
    }
  };

  return (
    <div className="export-page">
      <PageHeader
        title="Xuất dữ liệu"
        description="Xuất báo cáo vận hành và tài chính phục vụ quản trị GreenMarket."
      />

      <div className="export-grid">
        <SectionCard
          title="Xuất dữ liệu vận hành"
          description="Tạo tệp xuất dữ liệu từ các phân hệ quản trị."
        >
          <div className="export-form export-form--padded">
            <FilterBar
              fields={[
                {
                  id: "general-module",
                  label: "Phân hệ",
                  type: "select",
                  value: generalModule,
                  onChange: (value) =>
                    setGeneralModule(value as GeneralExportModule),
                  options: GENERAL_MODULE_OPTIONS,
                  optionLabels: generalModuleLabelMap,
                },
                {
                  id: "general-from-date",
                  label: "Từ ngày",
                  type: "date",
                  value: generalFromDate,
                  onChange: setGeneralFromDate,
                },
                {
                  id: "general-to-date",
                  label: "Đến ngày",
                  type: "date",
                  value: generalToDate,
                  onChange: setGeneralToDate,
                },
                {
                  id: "general-format",
                  label: "Định dạng tệp",
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
              disabled={isGeneralExporting}
            >
              {isGeneralExporting ? "Đang xuất..." : "Xuất dữ liệu vận hành"}
            </button>
          </div>
        </SectionCard>

        <SectionCard
          title="Xuất báo cáo tài chính"
          description="Tạo báo cáo doanh thu và chi tiêu khách hàng theo khoảng thời gian."
        >
          <div className="export-form export-form--padded">
            <FilterBar
              fields={[
                {
                  id: "financial-report-type",
                  label: "Loại báo cáo",
                  type: "select",
                  value: financialReportType,
                  onChange: (value) =>
                    setFinancialReportType(value as FinancialReportType),
                  options: FINANCIAL_REPORT_OPTIONS,
                  optionLabels: financialReportLabelMap,
                },
                {
                  id: "financial-from-date",
                  label: "Từ ngày",
                  type: "date",
                  value: financialFromDate,
                  onChange: setFinancialFromDate,
                },
                {
                  id: "financial-to-date",
                  label: "Đến ngày",
                  type: "date",
                  value: financialToDate,
                  onChange: setFinancialToDate,
                },
                {
                  id: "financial-format",
                  label: "Định dạng tệp",
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
              disabled={isFinancialExporting}
            >
              {isFinancialExporting ? "Đang xuất..." : "Xuất báo cáo tài chính"}
            </button>
          </div>
        </SectionCard>
      </div>

      <SearchToolbar
        placeholder="Tìm theo tên báo cáo, loại báo cáo hoặc người tạo"
        searchValue={historySearchKeyword}
        onSearchChange={setHistorySearchKeyword}
        onFilterClick={() => setShowHistoryFilters((prev) => !prev)}
        filterLabel="Lọc theo trạng thái xuất dữ liệu"
        filterSummary={`Đang hiển thị ${filteredHistory.length} bản ghi lịch sử`}
      />

      {showHistoryFilters ? (
        <SectionCard
          title="Bộ lọc lịch sử xuất dữ liệu"
          description="Thu hẹp danh sách theo trạng thái xử lý của tệp xuất."
        >
          <FilterBar
            fields={[
              {
                id: "export-history-status",
                label: "Trạng thái",
                type: "select",
                value: historyStatusFilter,
                onChange: (value) =>
                  setHistoryStatusFilter(
                    value as (typeof HISTORY_STATUS_OPTIONS)[number],
                  ),
                options: [...HISTORY_STATUS_OPTIONS],
                optionLabels: historyStatusLabelMap,
              },
            ]}
          />
        </SectionCard>
      ) : null}

      <SectionCard
        title="Lịch sử xuất dữ liệu gần đây"
        description={`Theo dõi các tệp vừa tạo • ${historyStatusLabelMap[historyStatusFilter]}`}
      >
        {isLoading ? (
          <EmptyState
            title="Đang tải lịch sử xuất dữ liệu"
            description="Hệ thống đang lấy lịch sử xuất dữ liệu từ API quản trị."
          />
        ) : pageError ? (
          <EmptyState
            title="Không thể tải lịch sử xuất dữ liệu"
            description={pageError}
          />
        ) : filteredHistory.length === 0 ? (
          <EmptyState
            title="Chưa có lịch sử xuất dữ liệu"
            description="Các lần xuất dữ liệu gần đây sẽ xuất hiện tại đây sau khi bạn tạo báo cáo."
          />
        ) : (
          <div className="export-history-section">
            <div className="export-history-table-wrapper">
              <table className="export-history-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên báo cáo</th>
                    <th>Loại</th>
                    <th>Định dạng</th>
                    <th>Người tạo</th>
                    <th>Ngày tạo</th>
                    <th>Trạng thái</th>
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
                          label={historyStatusLabelMap[item.status]}
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
                Trang {page} / {totalPages}
              </span>

              <div className="export-pagination__actions">
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
                  Tiếp
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
