import { useEffect, useMemo, useState } from "react";
import BaseModal from "../components/BaseModal";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, {
  type ToastItem,
} from "../components/ToastContainer";
import { financialService } from "../services/financialService";
import type {
  FinancialAudienceFilter,
  FinancialFilters,
  FinancialPayoutDetail,
  FinancialPayoutRequest,
  FinancialPayoutStatus,
} from "../types/financial";
import "./FinancialPage.css";

const PAGE_SIZE = 10;

const audienceLabels: Record<FinancialAudienceFilter, string> = {
  all: "Tất cả đối tượng",
  host: "Host",
  collaborator: "Cộng tác viên",
};

const statusLabels: Record<FinancialPayoutStatus | "all", string> = {
  all: "Tất cả trạng thái",
  pending: "Chờ duyệt",
  completed: "Hoàn thành",
  rejected: "Từ chối",
};

const getStatusVariant = (status: FinancialPayoutStatus) => {
  if (status === "pending") return "pending" as const;
  if (status === "completed") return "success" as const;
  return "negative" as const;
};

const createToastId = () => Date.now() + Math.floor(Math.random() * 1000);

function FinancialPage() {
  const [filters, setFilters] = useState<FinancialFilters>({
    keyword: "",
    status: "all",
    audience: "all",
    page: 1,
    limit: PAGE_SIZE,
  });
  const [items, setItems] = useState<FinancialPayoutRequest[]>([]);
  const [summary, setSummary] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
    rejectedRequests: 0,
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
          : "Không thể tải dữ liệu tài chính.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [filters]);

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

  const statCards = useMemo(
    () => [
      {
        title: "Yêu cầu chờ duyệt",
        value: String(summary.pendingRequests),
        subtitle: `Tổng tiền chờ chi ${summary.pendingAmountLabel}`,
      },
      {
        title: "Đã hoàn thành",
        value: String(summary.completedRequests),
        subtitle: `Đã chi ${summary.completedAmountLabel}`,
      },
      {
        title: "Bị từ chối",
        value: String(summary.rejectedRequests),
        subtitle: "Các yêu cầu không đủ điều kiện chi trả.",
      },
      {
        title: "Tổng yêu cầu",
        value: String(summary.totalRequests),
        subtitle: "Bao gồm Host và cộng tác viên gửi về hệ thống.",
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
          : "Không thể tải chi tiết chi trả.",
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

  const handleProcess = async (action: "approve" | "reject") => {
    if (!detail) return;

    try {
      setIsProcessing(true);

      if (action === "approve") {
        await financialService.approvePayoutRequest(
          detail.payoutRequestId,
          detailNote,
        );
      } else {
        await financialService.rejectPayoutRequest(
          detail.payoutRequestId,
          detailNote,
        );
      }

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
      pushToast(
        action === "approve"
          ? "Đã xác nhận hoàn thành yêu cầu chi trả."
          : "Đã từ chối yêu cầu chi trả.",
      );
    } catch (error) {
      pushToast(
        error instanceof Error
          ? error.message
          : "Không thể xử lý yêu cầu chi trả.",
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
        title="Tài chính / Chi trả"
        description="Theo dõi yêu cầu rút tiền của Host và cộng tác viên, kiểm tra lịch sử thu nhập và xác nhận khi admin đã chuyển khoản thủ công ngoài đời thực."
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
        title="Bộ lọc yêu cầu chi trả"
        description="Lọc theo đối tượng, trạng thái hoặc tìm nhanh theo tên, email, số điện thoại và mã yêu cầu."
      >
        <div className="financial-page__filters">
          <div className="financial-page__field financial-page__field--wide">
            <label htmlFor="financial-keyword">Tìm kiếm</label>
            <input
              id="financial-keyword"
              className="financial-page__input"
              type="text"
              value={filters.keyword}
              placeholder="Tên người nhận, email, số điện thoại hoặc mã yêu cầu"
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
            <label htmlFor="financial-audience">Đối tượng</label>
            <select
              id="financial-audience"
              className="financial-page__select"
              value={filters.audience}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  audience: event.target.value as FinancialAudienceFilter,
                  page: 1,
                }))
              }
            >
              {(Object.keys(audienceLabels) as FinancialAudienceFilter[]).map(
                (audience) => (
                  <option key={audience} value={audience}>
                    {audienceLabels[audience]}
                  </option>
                ),
              )}
            </select>
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
        title="Danh sách yêu cầu chi trả"
        description="Theo dõi toàn bộ yêu cầu rút tiền của Host và cộng tác viên để quyết định duyệt hoàn thành hoặc từ chối."
      >
        {pageError ? (
          <p className="financial-page__message financial-page__message--error">
            {pageError}
          </p>
        ) : null}

        {isLoading ? (
          <p className="financial-page__message">Đang tải dữ liệu tài chính...</p>
        ) : items.length === 0 ? (
          <EmptyState
            title="Chưa có yêu cầu chi trả"
            description="Khi Host hoặc cộng tác viên gửi yêu cầu rút tiền, danh sách sẽ xuất hiện tại đây để admin kiểm tra."
          />
        ) : (
          <>
            <div className="financial-page__table-wrapper">
              <table className="financial-page__table">
                <thead>
                  <tr>
                    <th>Mã yêu cầu</th>
                    <th>Người yêu cầu</th>
                    <th>Đối tượng</th>
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
        title="Chi tiết yêu cầu chi trả"
        description="Kiểm tra người yêu cầu, số dư khả dụng và lịch sử gần đây trước khi xác nhận hoàn thành hoặc từ chối."
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
            <div className="financial-page__detail-grid">
              <article className="financial-page__detail-card">
                <h4>Thông tin yêu cầu</h4>
                <dl>
                  <div>
                    <dt>Mã yêu cầu</dt>
                    <dd>#{detail.payoutRequestId}</dd>
                  </div>
                  <div>
                    <dt>Người yêu cầu</dt>
                    <dd>{detail.userName}</dd>
                  </div>
                  <div>
                    <dt>Đối tượng</dt>
                    <dd>{detail.audienceLabel}</dd>
                  </div>
                  <div>
                    <dt>Số tiền</dt>
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
                    <dt>Tổng đã ghi nhận</dt>
                    <dd>{detail.earningSummary.totalEarnedLabel}</dd>
                  </div>
                  <div>
                    <dt>Số dư khả dụng</dt>
                    <dd>{detail.earningSummary.availableBalanceLabel}</dd>
                  </div>
                  <div>
                    <dt>Số dư chờ duyệt</dt>
                    <dd>{detail.earningSummary.pendingBalanceLabel}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{detail.userEmail || "--"}</dd>
                  </div>
                  <div>
                    <dt>Điện thoại</dt>
                    <dd>{detail.userMobile || "--"}</dd>
                  </div>
                </dl>
              </article>
            </div>

            <div className="financial-page__detail-grid">
              <article className="financial-page__detail-card">
                <h4>Nguồn phát sinh thu nhập</h4>
                {detail.sourceBreakdown.length === 0 ? (
                  <p className="financial-page__secondary-text">
                    Chưa có dữ liệu nguồn thu chi tiết.
                  </p>
                ) : (
                  <ul className="financial-page__list">
                    {detail.sourceBreakdown.map((item) => (
                      <li key={`${item.type}-${item.count}`}>
                        <span>{item.type}</span>
                        <span>
                          {item.amountLabel} · {item.count} phát sinh
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>

              <article className="financial-page__detail-card">
                <h4>Lịch sử yêu cầu gần đây</h4>
                {detail.recentRequests.length === 0 ? (
                  <p className="financial-page__secondary-text">
                    Chưa có yêu cầu nào khác của người dùng này.
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

            <div className="financial-page__field">
              <label htmlFor="financial-admin-note">Ghi chú quản trị</label>
              <textarea
                id="financial-admin-note"
                className="financial-page__textarea"
                value={detailNote}
                placeholder="Ghi lại lý do duyệt / từ chối để hỗ trợ đối soát và gửi thông báo cho người nhận."
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
                <>
                  <button
                    type="button"
                    className="financial-page__button financial-page__button--danger"
                    onClick={() => void handleProcess("reject")}
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Đang xử lý..." : "Từ chối"}
                  </button>
                  <button
                    type="button"
                    className="financial-page__button financial-page__button--primary"
                    onClick={() => void handleProcess("approve")}
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Đang xử lý..." : "Duyệt hoàn thành"}
                  </button>
                </>
              ) : null}
            </div>
          </div>
        ) : null}
      </BaseModal>
    </div>
  );
}

export default FinancialPage;
