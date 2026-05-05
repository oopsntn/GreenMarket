import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/EmptyState";
import FilterBar from "../components/FilterBar";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { exportService } from "../services/exportService";
import { revenueService } from "../services/revenueService";
import {
  coerceDateRange,
  DEFAULT_REPORT_FROM_DATE,
  DEFAULT_REPORT_TO_DATE,
  formatDateRangeLabel,
  getTodayDateValue,
} from "../utils/dateRange";
import "./RevenuePage.css";

const PAGE_SIZE = 5;
const ALL_SLOTS_FILTER = "Tất cả vị trí";

function RevenuePage() {
  const [revenueData, setRevenueData] = useState(
    revenueService.getEmptyRevenue(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [fromDate, setFromDate] = useState(DEFAULT_REPORT_FROM_DATE);
  const [toDate, setToDate] = useState(DEFAULT_REPORT_TO_DATE);
  const [slotFilter, setSlotFilter] = useState(ALL_SLOTS_FILTER);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const today = getTodayDateValue();

  const dateRangeLabel = formatDateRangeLabel(fromDate, toDate);
  const slotCatalog = revenueData.slotCatalog;

  const handleFromDateChange = (value: string) => {
    const { nextValue, counterpartValue } = coerceDateRange(
      value,
      toDate,
      "from",
      today,
    );
    setFromDate(nextValue);
    setToDate(counterpartValue);
  };

  const handleToDateChange = (value: string) => {
    const { nextValue, counterpartValue } = coerceDateRange(
      value,
      fromDate,
      "to",
      today,
    );
    setToDate(nextValue);
    setFromDate(counterpartValue);
  };

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
            : "Không thể tải báo cáo doanh thu.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadRevenue();
  }, [fromDate, toDate]);

  const slotFilterOptions = useMemo(() => {
    const slotLabels = [
      ...slotCatalog.map((item) => item.label),
      ...revenueData.rows.map((item) => item.slot),
    ];

    return [ALL_SLOTS_FILTER, ...new Set(slotLabels)];
  }, [revenueData.rows, slotCatalog]);

  useEffect(() => {
    if (!slotFilterOptions.includes(slotFilter)) {
      setSlotFilter(ALL_SLOTS_FILTER);
    }
  }, [slotFilter, slotFilterOptions]);

  const filteredRows = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return revenueData.rows.filter((row) => {
      const matchesSlot =
        slotFilter === ALL_SLOTS_FILTER || row.slot === slotFilter;
      const matchesKeyword =
        !keyword ||
        row.packageName.toLowerCase().includes(keyword) ||
        row.slot.toLowerCase().includes(keyword);

      return matchesSlot && matchesKeyword;
    });
  }, [revenueData.rows, searchKeyword, slotFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

  const paginatedRows = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredRows.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredRows, page]);

  useEffect(() => {
    setPage(1);
  }, [fromDate, toDate, slotFilter, searchKeyword]);

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

  const handleExportRevenueReport = async () => {
    try {
      setIsExporting(true);
      await exportService.createFinancialExportHistoryItem(
        "Revenue Summary",
        fromDate,
        toDate,
        "XLSX",
      );
      showToast(`Đã xuất báo cáo doanh thu cho ${dateRangeLabel}.`);
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Không thể xuất báo cáo doanh thu.",
        "error",
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="revenue-page">
      <PageHeader
        title="Doanh thu"
        description="Theo dõi doanh thu từ gói quảng bá, gói tài khoản / shop và phần chi phí chi trả Host / Tin tức trong cùng kỳ dữ liệu."
        actionLabel={isExporting ? "Đang xuất..." : "Xuất báo cáo doanh thu"}
        onActionClick={() => void handleExportRevenueReport()}
      />

      <SectionCard
        title="Bộ lọc doanh thu"
        description="Thu hẹp khoảng thời gian báo cáo và phạm vi vị trí hiển thị cần xem."
      >
        <FilterBar
          fields={[
            {
              id: "revenue-from-date",
              label: "Từ ngày",
              type: "date",
              value: fromDate,
              max: toDate || today,
              onChange: handleFromDateChange,
            },
            {
              id: "revenue-to-date",
              label: "Đến ngày",
              type: "date",
              value: toDate,
              min: fromDate || undefined,
              max: today,
              onChange: handleToDateChange,
            },
            {
              id: "revenue-slot-filter",
              label: "Vị trí hiển thị",
              type: "select",
              value: slotFilter,
              onChange: setSlotFilter,
              options: slotFilterOptions,
            },
          ]}
        />
      </SectionCard>

      <SearchToolbar
        placeholder="Tìm theo tên gói hoặc phạm vi hiển thị"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
        filterSummary={`Bộ lọc hiện tại: ${slotFilter} • ${dateRangeLabel} • ${slotCatalog.length} nhóm hiển thị đã cấu hình`}
      />

      {isLoading ? (
        <SectionCard title="Chỉ số doanh thu">
          <EmptyState
            title="Đang tải doanh thu"
            description="Đang lấy các chỉ số doanh thu từ hệ thống quản trị."
          />
        </SectionCard>
      ) : pageError ? (
        <SectionCard title="Chỉ số doanh thu">
          <EmptyState title="Không thể tải doanh thu" description={pageError} />
        </SectionCard>
      ) : (
        <div className="revenue-cards">
          {revenueData.summaryCards.map((card) => (
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
        title="Doanh thu theo gói"
        description={`${dateRangeLabel} • ${slotFilter}`}
      >
        {isLoading ? (
          <EmptyState
            title="Đang tải danh sách doanh thu"
            description="Đang lấy dữ liệu doanh thu chi tiết từ hệ thống quản trị."
          />
        ) : pageError ? (
          <EmptyState
            title="Không thể tải danh sách doanh thu"
            description={pageError}
          />
        ) : filteredRows.length === 0 ? (
          <EmptyState
            title="Không có dòng doanh thu phù hợp"
            description="Không có dữ liệu doanh thu nào khớp với bộ lọc hiện tại."
          />
        ) : (
          <div className="revenue-table-section">
            <div className="revenue-table-wrapper">
              <table className="revenue-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên gói</th>
                    <th>Phạm vi hiển thị</th>
                    <th>Đơn hàng</th>
                    <th>Doanh thu</th>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="revenue-pagination">
              <span className="revenue-pagination__info">
                Trang {page} / {totalPages}
              </span>

              <div className="revenue-pagination__actions">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                >
                  Trước
                </button>
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
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

export default RevenuePage;
