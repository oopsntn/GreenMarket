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
import { exportService } from "../services/exportService";
import type { CustomerSpendingRow } from "../types/customerSpending";
import {
  coerceDateRange,
  DEFAULT_REPORT_FROM_DATE,
  DEFAULT_REPORT_TO_DATE,
  formatDateRangeLabel,
  getTodayDateValue,
} from "../utils/dateRange";
import "./CustomerSpendingPage.css";

const PAGE_SIZE = 5;

const CUSTOMER_SEGMENTS = [
  "All Customers",
  "Top Spenders",
  "Returning Buyers",
  "New Customers",
] as const;

const customerSegmentLabelMap: Record<(typeof CUSTOMER_SEGMENTS)[number], string> = {
  "All Customers": "Tất cả khách hàng",
  "Top Spenders": "Chi tiêu cao nhất",
  "Returning Buyers": "Khách quay lại",
  "New Customers": "Khách mới",
};

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
  const [customerSegment, setCustomerSegment] =
    useState<(typeof CUSTOMER_SEGMENTS)[number]>("All Customers");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const today = getTodayDateValue();
  const dateRangeLabel = formatDateRangeLabel(fromDate, toDate);
  const summaryCards = customerSpendingData.summaryCards;
  const rows = customerSpendingData.rows;

  const handleFromDateChange = (value: string) => {
    const { nextValue, counterpartValue } = coerceDateRange(value, toDate, "from", today);
    setFromDate(nextValue);
    setToDate(counterpartValue);
  };

  const handleToDateChange = (value: string) => {
    const { nextValue, counterpartValue } = coerceDateRange(value, fromDate, "to", today);
    setToDate(nextValue);
    setFromDate(counterpartValue);
  };

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
            : "Không thể tải báo cáo chi tiêu khách hàng.",
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

  const handleExportCustomerReport = async () => {
    try {
      setIsExporting(true);
      await exportService.createFinancialExportHistoryItem(
        "Customer Spending Report",
        fromDate,
        toDate,
        "XLSX",
      );
      showToast(
        `Đã xuất báo cáo chi tiêu khách hàng cho ${dateRangeLabel} • ${customerSegmentLabelMap[customerSegment]}.`,
      );
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Không thể xuất báo cáo chi tiêu khách hàng.",
        "error",
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="customer-spending-page">
      <PageHeader
        title="Chi tiêu khách hàng"
        description="Theo dõi hành vi mua hàng và mức chi tiêu quảng bá của khách hàng."
        actionLabel={isExporting ? "Đang xuất..." : "Xuất báo cáo chi tiêu"}
        onActionClick={() => void handleExportCustomerReport()}
      />

      <SectionCard
        title="Bộ lọc chi tiêu khách hàng"
        description="Thu hẹp khoảng thời gian báo cáo và nhóm khách hàng cần theo dõi."
      >
        <FilterBar
          fields={[
          {
            id: "customer-spending-from-date",
            label: "Từ ngày",
            type: "date",
            value: fromDate,
            max: toDate || today,
            onChange: handleFromDateChange,
          },
          {
            id: "customer-spending-to-date",
            label: "Đến ngày",
            type: "date",
            value: toDate,
            min: fromDate || undefined,
            max: today,
            onChange: handleToDateChange,
          },
            {
              id: "customer-segment",
              label: "Nhóm khách hàng",
              type: "select",
              value: customerSegment,
              onChange: (value) =>
                setCustomerSegment(value as (typeof CUSTOMER_SEGMENTS)[number]),
              options: [...CUSTOMER_SEGMENTS],
              optionLabels: customerSegmentLabelMap,
            },
          ]}
        />
      </SectionCard>

      <SearchToolbar
        placeholder="Tìm theo tên khách hàng hoặc email"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
        filterSummary={`Nhóm hiện tại: ${customerSegmentLabelMap[customerSegment]} • ${dateRangeLabel}`}
      />

      {isLoading ? (
        <SectionCard title="Chỉ số chi tiêu">
          <EmptyState
            title="Đang tải báo cáo chi tiêu"
            description="Hệ thống đang lấy các chỉ số chi tiêu khách hàng từ API quản trị."
          />
        </SectionCard>
      ) : pageError ? (
        <SectionCard title="Chỉ số chi tiêu">
          <EmptyState
            title="Không thể tải báo cáo chi tiêu"
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
        title="Danh sách chi tiêu khách hàng"
        description={`${dateRangeLabel} • ${customerSegmentLabelMap[customerSegment]}`}
      >
        {isLoading ? (
          <EmptyState
            title="Đang tải danh sách khách hàng"
            description="Hệ thống đang lấy dữ liệu chi tiêu chi tiết của khách hàng."
          />
        ) : pageError ? (
          <EmptyState
            title="Không thể tải danh sách khách hàng"
            description={pageError}
          />
        ) : filteredRows.length === 0 ? (
          <EmptyState
            title="Không có dữ liệu chi tiêu phù hợp"
            description="Không có khách hàng nào khớp với nhóm và từ khóa hiện tại."
          />
        ) : (
          <div className="customer-spending-table-section">
            <div className="customer-spending-table-wrapper">
              <table className="customer-spending-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên khách hàng</th>
                    <th>Email</th>
                    <th>Tổng đơn hàng</th>
                    <th>Tổng chi tiêu</th>
                    <th>Giá trị đơn trung bình</th>
                    <th>Lần mua gần nhất</th>
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
                Trang {page} / {totalPages}
              </span>

              <div className="customer-spending-pagination__actions">
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

export default CustomerSpendingPage;
