import { useEffect, useMemo, useState } from "react";
import BaseModal from "../components/BaseModal";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { accountPackageTrackingService } from "../services/accountPackageTrackingService";
import type {
  AccountPackageTrackingPayload,
  AccountPackageTrackingRow,
  AccountPackageTrackingStatus,
} from "../types/accountPackageTracking";
import "./AccountPackageTrackingPage.css";

type PackageFilter = "All" | "OWNER_LIFETIME" | "PERSONAL_MONTHLY" | "SHOP_VIP";
type StatusFilter = "All" | AccountPackageTrackingStatus;

const PAGE_SIZE = 8;

const getStatusVariant = (status: AccountPackageTrackingStatus) => {
  if (status === "permanent") {
    return "role" as const;
  }

  if (status === "expiring_soon") {
    return "pending" as const;
  }

  return "success" as const;
};

const getLatestPaymentAmountText = (row: AccountPackageTrackingRow) =>
  row.latestPaymentAmountLabel || "Không có lịch sử";

const getLatestPaymentTimeText = (row: AccountPackageTrackingRow) =>
  row.latestPaymentAt || "Kích hoạt từ hệ thống";

function AccountPackageTrackingPage() {
  const [payload, setPayload] = useState<AccountPackageTrackingPayload>({
    summary: {
      totalTracked: 0,
      accountTracked: 0,
      shopTracked: 0,
      expiringSoon: 0,
    },
    rows: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedPackageFilter, setSelectedPackageFilter] =
    useState<PackageFilter>("All");
  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<StatusFilter>("All");
  const [page, setPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState<AccountPackageTrackingRow | null>(
    null,
  );
  const [isDetailOpen, setIsDetailOpen] = useState(false);
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

  useEffect(() => {
    const loadTracking = async () => {
      try {
        setIsLoading(true);
        setPageError("");
        const response = await accountPackageTrackingService.getTracking();
        setPayload(response);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách theo dõi gói tài khoản / shop.";
        setPageError(message);
        showToast(message, "error");
      } finally {
        setIsLoading(false);
      }
    };

    void loadTracking();
  }, []);

  const summaryCards = accountPackageTrackingService.getSummaryCards(
    payload.summary,
  );

  const filteredRows = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return payload.rows.filter((row) => {
      const matchesKeyword =
        !keyword ||
        row.packageTitle.toLowerCase().includes(keyword) ||
        row.holderName.toLowerCase().includes(keyword) ||
        row.accountName?.toLowerCase().includes(keyword) ||
        row.email?.toLowerCase().includes(keyword) ||
        row.phone?.toLowerCase().includes(keyword);

      const matchesPackage =
        selectedPackageFilter === "All" ||
        row.packageCode === selectedPackageFilter;

      const matchesStatus =
        selectedStatusFilter === "All" || row.status === selectedStatusFilter;

      return matchesKeyword && matchesPackage && matchesStatus;
    });
  }, [payload.rows, searchKeyword, selectedPackageFilter, selectedStatusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

  const paginatedRows = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredRows.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredRows, page]);

  useEffect(() => {
    setPage(1);
  }, [searchKeyword, selectedPackageFilter, selectedStatusFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const openDetail = (row: AccountPackageTrackingRow) => {
    setSelectedRow(row);
    setIsDetailOpen(true);
  };

  const closeDetail = () => {
    setSelectedRow(null);
    setIsDetailOpen(false);
  };

  return (
    <div className="account-package-tracking-page">
      <PageHeader
        title="Theo dõi gói tài khoản / shop"
        description="Theo dõi người dùng và shop đang dùng Chủ vườn vĩnh viễn, Cá nhân theo tháng và Nhà vườn VIP. Màn này không hiển thị gói quảng bá bài đẩy."
      />

      <div className="account-package-tracking-summary-grid">
        {summaryCards.map((card) => (
          <div
            key={card.title}
            className="account-package-tracking-summary-card"
          >
            <span className="account-package-tracking-summary-card__label">
              {card.title}
            </span>
            <strong className="account-package-tracking-summary-card__value">
              {card.value}
            </strong>
            <p className="account-package-tracking-summary-card__subtitle">
              {card.subtitle}
            </p>
          </div>
        ))}
      </div>

      <SectionCard
        title="Ý nghĩa dữ liệu theo dõi"
        description="Mỗi dòng đại diện cho một người dùng hoặc shop đang có gói còn hiệu lực. Chủ vườn vĩnh viễn không có ngày hết hạn; Cá nhân theo tháng và Nhà vườn VIP sẽ cảnh báo khi sắp hết hạn."
      >
        <div className="account-package-tracking-explainer">
          <div className="account-package-tracking-explainer__item">
            <strong>Nhóm tài khoản</strong>
            <span>
              Chủ vườn vĩnh viễn và Cá nhân theo tháng ảnh hưởng đến quyền đăng
              bài, mở shop và chính sách vận hành tài khoản.
            </span>
          </div>
          <div className="account-package-tracking-explainer__item">
            <strong>Nhóm shop VIP</strong>
            <span>
              Nhà vườn VIP chỉ ảnh hưởng thứ tự shop trong Danh sách nhà vườn,
              không tác động vào vị trí bài đẩy trên trang chủ.
            </span>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Bộ lọc theo dõi"
        description="Tìm nhanh theo tên gói, người mua, email hoặc số điện thoại để kiểm tra tình trạng sử dụng."
      >
        <div className="account-package-tracking-filters">
          <div className="account-package-tracking-filters__field account-package-tracking-filters__field--search">
            <label htmlFor="account-package-tracking-search">Tìm kiếm</label>
            <input
              id="account-package-tracking-search"
              type="text"
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder="Tìm theo tên gói, người mua, email hoặc số điện thoại"
            />
          </div>

          <div className="account-package-tracking-filters__field">
            <label htmlFor="account-package-tracking-package">Gói</label>
            <select
              id="account-package-tracking-package"
              value={selectedPackageFilter}
              onChange={(event) =>
                setSelectedPackageFilter(event.target.value as PackageFilter)
              }
            >
              <option value="All">Tất cả gói</option>
              <option value="OWNER_LIFETIME">Chủ vườn vĩnh viễn</option>
              <option value="PERSONAL_MONTHLY">Cá nhân theo tháng</option>
              <option value="SHOP_VIP">Nhà vườn VIP</option>
            </select>
          </div>

          <div className="account-package-tracking-filters__field">
            <label htmlFor="account-package-tracking-status">Trạng thái</label>
            <select
              id="account-package-tracking-status"
              value={selectedStatusFilter}
              onChange={(event) =>
                setSelectedStatusFilter(event.target.value as StatusFilter)
              }
            >
              <option value="All">Tất cả trạng thái</option>
              <option value="permanent">Vĩnh viễn</option>
              <option value="active">Đang hiệu lực</option>
              <option value="expiring_soon">Sắp hết hạn</option>
            </select>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Danh sách người đang dùng gói"
        description="Theo dõi trạng thái hiện tại của các gói tài khoản / shop, tách riêng khỏi đơn quảng bá bài đẩy."
      >
        {isLoading ? (
          <EmptyState
            title="Đang tải danh sách theo dõi"
            description="Vui lòng chờ trong khi hệ thống tổng hợp người dùng và shop đang dùng gói."
          />
        ) : pageError ? (
          <EmptyState
            title="Không thể tải dữ liệu theo dõi"
            description={pageError}
          />
        ) : filteredRows.length === 0 ? (
          <EmptyState
            title="Không tìm thấy dữ liệu phù hợp"
            description="Không có người dùng hoặc shop nào khớp với bộ lọc hiện tại."
          />
        ) : (
          <>
            <div className="account-package-tracking-table-wrapper">
              <table className="account-package-tracking-table">
                <thead>
                  <tr>
                    <th>Gói</th>
                    <th>Người đang dùng</th>
                    <th>Loại đối tượng</th>
                    <th>Bắt đầu</th>
                    <th>Hết hạn</th>
                    <th>Thanh toán gần nhất</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedRows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className="account-package-tracking-table__primary">
                          <strong>{row.packageTitle}</strong>
                          <span>
                            {row.packageGroupLabel} • {row.cycleLabel}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="account-package-tracking-table__primary">
                          <strong>{row.holderName}</strong>
                          <span>
                            {row.accountName || "Không có tên tài khoản"} •{" "}
                            {row.email || row.phone || "Chưa có liên hệ"}
                          </span>
                        </div>
                      </td>
                      <td>{row.holderTypeLabel}</td>
                      <td>{row.startedAt || "Chưa ghi nhận"}</td>
                      <td>{row.expiresAt || "Không hết hạn"}</td>
                      <td>
                        <div className="account-package-tracking-table__payment">
                          <strong>{getLatestPaymentAmountText(row)}</strong>
                          <span>{getLatestPaymentTimeText(row)}</span>
                        </div>
                      </td>
                      <td>
                        <StatusBadge
                          label={row.statusLabel}
                          variant={getStatusVariant(row.status)}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="account-package-tracking-table__view"
                          onClick={() => openDetail(row)}
                        >
                          Xem
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="account-package-tracking-pagination">
              <span className="account-package-tracking-pagination__info">
                Trang {page} / {totalPages}
              </span>
              <div className="account-package-tracking-pagination__actions">
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
          </>
        )}
      </SectionCard>

      <BaseModal
        isOpen={isDetailOpen}
        title="Chi tiết người đang dùng gói"
        description="Xem gói đang dùng, dữ liệu liên hệ, thời gian hiệu lực và lịch sử thanh toán gần nhất."
        onClose={closeDetail}
        maxWidth="840px"
      >
        {selectedRow ? (
          <div className="account-package-tracking-modal">
            <div>
              <span>Gói</span>
              <strong>{selectedRow.packageTitle}</strong>
            </div>
            <div>
              <span>Người đang dùng</span>
              <strong>{selectedRow.holderName}</strong>
            </div>
            <div>
              <span>Loại đối tượng</span>
              <strong>{selectedRow.holderTypeLabel}</strong>
            </div>
            <div>
              <span>Phạm vi áp dụng</span>
              <strong>{selectedRow.scopeLabel}</strong>
            </div>
            <div>
              <span>Bắt đầu</span>
              <strong>{selectedRow.startedAt || "Chưa ghi nhận"}</strong>
            </div>
            <div>
              <span>Hết hạn</span>
              <strong>{selectedRow.expiresAt || "Không hết hạn"}</strong>
            </div>
            <div>
              <span>Thanh toán gần nhất</span>
              <strong>{getLatestPaymentAmountText(selectedRow)}</strong>
            </div>
            <div>
              <span>Thời điểm thanh toán</span>
              <strong>{getLatestPaymentTimeText(selectedRow)}</strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{selectedRow.email || "Chưa có"}</strong>
            </div>
            <div>
              <span>Số điện thoại</span>
              <strong>{selectedRow.phone || "Chưa có"}</strong>
            </div>
            <div>
              <span>Trạng thái</span>
              <strong>{selectedRow.statusLabel}</strong>
            </div>
            <div>
              <span>Mã người dùng / shop</span>
              <strong>
                Người dùng #{selectedRow.userId}
                {selectedRow.shopId ? ` • Cửa hàng #${selectedRow.shopId}` : ""}
              </strong>
            </div>
            <div className="account-package-tracking-modal__wide">
              <span>Ghi chú vận hành</span>
              <p>{selectedRow.note}</p>
            </div>
          </div>
        ) : null}
      </BaseModal>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default AccountPackageTrackingPage;
