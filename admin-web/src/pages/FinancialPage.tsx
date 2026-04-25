import { useEffect, useMemo, useState } from "react";
import BaseModal from "../components/BaseModal";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { financialService } from "../services/financialService";
import type {
  FinancialFilters,
  FinancialPayoutDetail,
  FinancialPayoutRequest,
  FinancialPayoutStatus,
} from "../types/financial";
import "./FinancialPage.css";

const PAGE_SIZE = 10;

const statusLabels: Record<FinancialPayoutStatus | "all", string> = {
  all: "Tất cả trạng thái",
  pending: "Chờ chi trả",
  completed: "Đã chi trả",
};

const getStatusVariant = (status: FinancialPayoutStatus) => {
  if (status === "pending") return "pending" as const;
  return "success" as const;
};

const createToastId = () => Date.now() + Math.floor(Math.random() * 1000);

function FinancialPage() {
  const [filters, setFilters] = useState<FinancialFilters>({
    keyword: "",
    status: "all",
    audience: "host",
    page: 1,
    limit: PAGE_SIZE,
  });
  const [items, setItems] = useState<FinancialPayoutRequest[]>([]);
  const [summary, setSummary] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
    pendingAmount: 0,
    completedAmount: 0,
    pendingAmountLabel: "0 VND",
    completedAmountLabel: "0 VND",
  });
  const [meta, setMeta] = useState({
    page: 1,
    limit: PAGE_SIZE,
    totalItems: 0,
    totalPages: 1,
  });
  const [selectedItem, setSelectedItem] = useState<FinancialPayoutRequest | null>(
    null,
  );
  const [detail, setDetail] = useState<FinancialPayoutDetail | null>(null);
  const [detailNote, setDetailNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pageError, setPageError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = (message: string, tone: ToastItem["tone"] = "success") => {
    const id = createToastId();
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3600);
  };

  const handleToastClose = (id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      setPageError("");
      const response = await financialService.getPayoutRequests(filters);
      setItems(response.data);
      setSummary(response.summary);
      setMeta(response.meta);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Không thể tải dữ liệu chi trả Host.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [filters]);

  const statCards = useMemo(
    () => [
      {
        title: "Đợt chờ chi trả",
        value: String(summary.pendingRequests),
        subtitle: `Tổng tiền đang chờ chi ${summary.pendingAmountLabel}`,
      },
      {
        title: "Đã chuyển khoản",
        value: String(summary.completedRequests),
        subtitle: `Đã chi ${summary.completedAmountLabel}`,
      },
      {
        title: "Tổng đợt chi trả",
        value: String(summary.totalRequests),
        subtitle: "Các đợt chi trả nội bộ cho thu nhập Host.",
      },
    ],
    [summary],
  );

  const openDetail = async (item: FinancialPayoutRequest) => {
    setSelectedItem(item);
    setDetail(null);
    setDetailError("");
    setDetailNote(item.note || "");

    try {
      setIsDetailLoading(true);
      const response = await financialService.getPayoutRequestDetail(
        item.payoutRequestId,
      );
      setDetail(response);
      setDetailNote(response.note || "");
    } catch (error) {
      setDetailError(
        error instanceof Error
          ? error.message
          : "Không thể tải chi tiết chi trả Host.",
      );
    } finally {
      setIsDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedItem(null);
    setDetail(null);
    setDetailError("");
    setDetailNote("");
  };

  const handleProcess = async () => {
    if (!detail) return;

    try {
      setIsProcessing(true);
      await financialService.approvePayoutRequest(detail.payoutRequestId, detailNote);

      await loadData();
      const refreshedDetail = await financialService.getPayoutRequestDetail(
        detail.payoutRequestId,
      );
      setDetail(refreshedDetail);
      setSelectedItem((current) =>
        current
          ? {
              ...current,
              status: refreshedDetail.status,
              statusLabel: refreshedDetail.statusLabel,
              note: refreshedDetail.note,
              processedAt: refreshedDetail.processedAt,
            }
          : current,
      );
      pushToast("Đã xác nhận hoàn tất đợt chi trả cho Host.");
    } catch (error) {
      pushToast(
        error instanceof Error
          ? error.message
          : "Không thể xử lý đợt chi trả.",
        "error",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="financial-page">
      <ToastContainer toasts={toasts} onClose={handleToastClose} />

      <PageHeader
        title="Tài chính / Chi trả Host"
        description="Theo dõi thu nhập Host đã ghi nhận từ bài được duyệt, các đợt chi trả nội bộ và xác nhận khi admin đã chuyển khoản thực tế."
      />

      <div className="financial-page__stats">
        {statCards.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
          />
        ))}
      </div>

      <SectionCard
        title="Bộ lọc đợt chi trả"
        description="Tìm nhanh theo tên Host, email, số điện thoại hoặc mã đợt chi trả."
      >
        <div className="financial-page__filters">
          <div className="financial-page__field financial-page__field--wide">
            <label htmlFor="financial-keyword">Tìm kiếm</label>
            <input
              id="financial-keyword"
              className="financial-page__input"
              type="text"
              value={filters.keyword}
              placeholder="Tên Host, email, số điện thoại hoặc mã đợt chi trả"
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  keyword: event.target.value,
                  page: 1,
                }))
              }
            />
          </div>

          <div className="financial-page__field">
            <label htmlFor="financial-status">Trạng thái</label>
            <select
              id="financial-status"
              className="financial-page__select"
              value={filters.status}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  status: event.target.value as FinancialPayoutStatus | "all",
                  page: 1,
                }))
              }
            >
              {(Object.keys(statusLabels) as Array<FinancialPayoutStatus | "all">).map(
                (status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Danh sách đợt chi trả"
        description="Mỗi dòng là một đợt chi trả nội bộ do hệ thống tổng hợp từ phần thu nhập Host chưa thanh toán."
      >
        {pageError ? (
          <p className="financial-page__message financial-page__message--error">
            {pageError}
          </p>
        ) : null}

        {isLoading ? (
          <p className="financial-page__message">Đang tải dữ liệu chi trả Host...</p>
        ) : items.length === 0 ? (
          <EmptyState
            title="Chưa có đợt chi trả"
            description="Khi có thu nhập Host chưa được thanh toán, hệ thống sẽ tổng hợp và hiển thị tại đây."
          />
        ) : (
          <>
            <div className="financial-page__table-wrapper">
              <table className="financial-page__table">
                <thead>
                  <tr>
                    <th>Mã đợt</th>
                    <th>Host</th>
                    <th>Vai trò</th>
                    <th>Số tiền</th>
                    <th>Phương thức</th>
                    <th>Trạng thái</th>
                    <th>Thời gian tạo</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={`${item.payoutRequestId}-${item.userId}`}>
                      <td>#{item.payoutRequestId}</td>
                      <td>
                        <div className="financial-page__primary-text">
                          {item.userName}
                        </div>
                        <div className="financial-page__secondary-text">
                          {item.userEmail || item.userMobile || "--"}
                        </div>
                      </td>
                      <td>{item.audienceLabel}</td>
                      <td>{item.amountLabel}</td>
                      <td>{item.method}</td>
                      <td>
                        <StatusBadge
                          label={item.statusLabel}
                          variant={getStatusVariant(item.status)}
                        />
                      </td>
                      <td>{item.createdAt}</td>
                      <td>
                        <button
                          type="button"
                          className="financial-page__table-action"
                          onClick={() => void openDetail(item)}
                        >
                          Xem
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {meta.totalPages > 1 ? (
              <div className="financial-page__pagination">
                <button
                  type="button"
                  className="financial-page__pagination-button"
                  disabled={filters.page === 1}
                  onClick={() =>
                    setFilters((current) => ({
                      ...current,
                      page: Math.max(1, current.page - 1),
                    }))
                  }
                >
                  Trước
                </button>
                <span>
                  Trang {meta.page} / {meta.totalPages}
                </span>
                <button
                  type="button"
                  className="financial-page__pagination-button"
                  disabled={filters.page === meta.totalPages}
                  onClick={() =>
                    setFilters((current) => ({
                      ...current,
                      page: Math.min(meta.totalPages, current.page + 1),
                    }))
                  }
                >
                  Sau
                </button>
              </div>
            ) : null}
          </>
        )}
      </SectionCard>

      <BaseModal
        isOpen={Boolean(selectedItem)}
        title="Chi tiết đợt chi trả"
        description="Kiểm tra thu nhập Host đã ghi nhận trước khi xác nhận đợt chuyển khoản thủ công."
        onClose={closeDetail}
        maxWidth="920px"
      >
        {isDetailLoading ? (
          <p className="financial-page__message">Đang tải chi tiết...</p>
        ) : detailError ? (
          <p className="financial-page__message financial-page__message--error">
            {detailError}
          </p>
        ) : detail ? (
          <div className="financial-page__detail">
            <div className="financial-page__notice">
              <strong>Chính sách hiện hành:</strong> {detail.approvalHint}
            </div>

            <div className="financial-page__detail-grid">
              <article className="financial-page__detail-card">
                <h4>Thông tin đợt chi trả</h4>
                <dl>
                  <div>
                    <dt>Mã đợt</dt>
                    <dd>#{detail.payoutRequestId}</dd>
                  </div>
                  <div>
                    <dt>Host</dt>
                    <dd>{detail.userName}</dd>
                  </div>
                  <div>
                    <dt>Vai trò</dt>
                    <dd>{detail.audienceLabel}</dd>
                  </div>
                  <div>
                    <dt>Số tiền chi trả</dt>
                    <dd>{detail.amountLabel}</dd>
                  </div>
                  <div>
                    <dt>Phương thức</dt>
                    <dd>{detail.method}</dd>
                  </div>
                  <div>
                    <dt>Trạng thái</dt>
                    <dd>{detail.statusLabel}</dd>
                  </div>
                  <div>
                    <dt>Tạo lúc</dt>
                    <dd>{detail.createdAt}</dd>
                  </div>
                  <div>
                    <dt>Xử lý lúc</dt>
                    <dd>{detail.processedAt || "--"}</dd>
                  </div>
                </dl>
              </article>

              <article className="financial-page__detail-card">
                <h4>Tóm tắt thu nhập</h4>
                <dl>
                  <div>
                    <dt>Tổng thu nhập đã ghi nhận</dt>
                    <dd>{detail.earningSummary.totalEarnedLabel}</dd>
                  </div>
                  <div>
                    <dt>Đã chi trả</dt>
                    <dd>{detail.earningSummary.paidOutAmountLabel}</dd>
                  </div>
                  <div>
                    <dt>Đang chờ chi trả</dt>
                    <dd>{detail.earningSummary.pendingBalanceLabel}</dd>
                  </div>
                  <div>
                    <dt>Còn phải chi</dt>
                    <dd>{detail.earningSummary.availableBalanceLabel}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd className="financial-page__value-text">
                      {detail.userEmail || "--"}
                    </dd>
                  </div>
                  <div>
                    <dt>Điện thoại</dt>
                    <dd className="financial-page__value-text">
                      {detail.userMobile || "--"}
                    </dd>
                  </div>
                </dl>
              </article>
            </div>

            <div className="financial-page__detail-grid">
              <article className="financial-page__detail-card">
                <h4>Nguồn thu nhập</h4>
                {detail.sourceBreakdown.length === 0 ? (
                  <p className="financial-page__secondary-text">
                    Chưa có dữ liệu nguồn thu nhập.
                  </p>
                ) : (
                  <ul className="financial-page__list">
                    {detail.sourceBreakdown.map((item) => (
                      <li key={`${item.type}-${item.count}`}>
                        <span>{item.typeLabel}</span>
                        <span>{item.amountLabel} · {item.count} phát sinh</span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>

              <article className="financial-page__detail-card">
                <h4>Lịch sử chi trả gần đây</h4>
                {detail.recentRequests.length === 0 ? (
                  <p className="financial-page__secondary-text">
                    Chưa có đợt chi trả nào khác cho Host này.
                  </p>
                ) : (
                  <ul className="financial-page__list">
                    {detail.recentRequests.map((item) => (
                      <li key={item.payoutRequestId}>
                        <span>
                          #{item.payoutRequestId} · {item.amountLabel}
                        </span>
                        <span>
                          {item.statusLabel} · {item.createdAt}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </div>

            <article className="financial-page__detail-card financial-page__detail-card--full">
                <h4>Chi tiết thu nhập đã ghi nhận</h4>
              {detail.sourceDetails.length === 0 ? (
                <p className="financial-page__secondary-text">
                  Chưa có khoản thu nhập chi tiết cho đợt này.
                </p>
              ) : (
                <div className="financial-page__source-list">
                  {detail.sourceDetails.map((item) => (
                    <article
                      key={`${item.earningId}-${item.sourceType}-${item.sourceId ?? "internal"}`}
                      className="financial-page__source-item"
                    >
                      <div className="financial-page__source-header">
                        <div>
                          <div className="financial-page__primary-text">
                            {item.sourceTitle}
                          </div>
                          <div className="financial-page__secondary-text">
                            {item.sourceTypeLabel}
                          </div>
                        </div>
                        <div className="financial-page__source-amount">
                          {item.amountLabel}
                        </div>
                      </div>

                      <dl className="financial-page__source-meta">
                        <div>
                          <dt>Trạng thái bài / khoản ghi nhận</dt>
                          <dd className="financial-page__value-text">
                            {item.sourceStatusLabel}
                          </dd>
                        </div>
                        <div>
                          <dt>Ghi nhận lúc</dt>
                          <dd className="financial-page__value-text">
                            {item.createdAt}
                          </dd>
                        </div>
                        <div>
                          <dt>Đơn vị ghi nhận</dt>
                          <dd className="financial-page__value-text">
                            {item.payerName}
                          </dd>
                        </div>
                        <div>
                          <dt>Ghi chú</dt>
                          <dd className="financial-page__value-text">
                            {item.fundingNote}
                          </dd>
                        </div>
                      </dl>
                    </article>
                  ))}
                </div>
              )}
            </article>

            <div className="financial-page__field">
              <label htmlFor="financial-admin-note">Ghi chú quản trị</label>
              <textarea
                id="financial-admin-note"
                className="financial-page__textarea"
                value={detailNote}
                placeholder="Ghi lại xác nhận chuyển khoản thực tế hoặc ghi chú đối soát nội bộ."
                onChange={(event) => setDetailNote(event.target.value)}
              />
            </div>

            <div className="financial-page__modal-actions">
              <button
                type="button"
                className="financial-page__button"
                onClick={closeDetail}
                disabled={isProcessing}
              >
                Đóng
              </button>
              {detail.status === "pending" ? (
                <button
                  type="button"
                  className="financial-page__button financial-page__button--primary"
                  onClick={() => void handleProcess()}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Đang xử lý..." : "Xác nhận đã chi trả"}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </BaseModal>
    </div>
  );
}

export default FinancialPage;
