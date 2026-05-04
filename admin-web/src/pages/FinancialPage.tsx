import { useCallback, useEffect, useMemo, useState } from "react";
import BaseModal from "../components/BaseModal";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { financialService } from "../services/financialService";
import type {
  CreateFinancialPayoutPayload,
  FinancialFilters,
  FinancialHostPayoutCandidate,
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

const methodLabels: Record<string, string> = {
  bank_transfer: "Chuyển khoản ngân hàng",
  cash: "Tiền mặt",
  other: "Khác",
};

const getStatusVariant = (status: FinancialPayoutStatus) => {
  if (status === "pending") return "pending" as const;
  return "success" as const;
};

const createToastId = () => Date.now() + Math.floor(Math.random() * 1000);

const initialCreateForm = {
  userId: "",
  amount: "",
  method: "bank_transfer",
  note: "",
  markAsPaid: false,
};

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
  const [hostOptions, setHostOptions] = useState<FinancialHostPayoutCandidate[]>([]);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [hostSearch, setHostSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingHosts, setIsLoadingHosts] = useState(false);
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
  const [createError, setCreateError] = useState("");
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const selectedHost = useMemo(
    () => hostOptions.find((host) => String(host.userId) === createForm.userId) || null,
    [createForm.userId, hostOptions],
  );

  const filteredHostOptions = useMemo(() => {
    const keyword = hostSearch.trim().toLowerCase();
    const sortedHosts = [...hostOptions].sort(
      (left, right) => right.availableBalance - left.availableBalance,
    );

    if (!keyword) {
      return sortedHosts;
    }

    return sortedHosts.filter((host) =>
      [host.userName, host.userEmail, host.userMobile]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(keyword)),
    );
  }, [hostOptions, hostSearch]);

  const payableHostCount = useMemo(
    () => hostOptions.filter((host) => host.availableBalance > 0).length,
    [hostOptions],
  );

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

  const loadData = useCallback(async () => {
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
  }, [filters]);

  const loadHostOptions = async () => {
    try {
      setIsLoadingHosts(true);
      setCreateError("");
      const hosts = await financialService.getHostPayoutCandidates();
      setHostOptions(hosts);
    } catch (error) {
      setCreateError(
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách Host để tạo chi trả.",
      );
    } finally {
      setIsLoadingHosts(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const statCards = useMemo(
    () => [
      {
        title: "Khoản chờ chi trả",
        value: String(summary.pendingRequests),
        subtitle: `Tổng tiền chưa đánh dấu đã chi ${summary.pendingAmountLabel}`,
      },
      {
        title: "Đã xác nhận chi trả",
        value: String(summary.completedRequests),
        subtitle: `Đã chi ${summary.completedAmountLabel}`,
      },
      {
        title: "Tổng khoản chi trả",
        value: String(summary.totalRequests),
        subtitle: "Các khoản chi trả Host do admin tạo.",
      },
    ],
    [summary],
  );

  const openCreateModal = async () => {
    setCreateForm(initialCreateForm);
    setHostSearch("");
    setCreateError("");
    setIsCreateOpen(true);
    await loadHostOptions();
  };

  const closeCreateModal = () => {
    if (isCreating) return;
    setIsCreateOpen(false);
    setCreateForm(initialCreateForm);
    setHostSearch("");
    setCreateError("");
  };

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

  const handleCreatePayout = async () => {
    const amount = Number(createForm.amount);
    const userId = Number(createForm.userId);

    if (!userId) {
      setCreateError("Vui lòng chọn Host cần chi trả.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setCreateError("Số tiền chi trả phải lớn hơn 0 VND.");
      return;
    }

    if (selectedHost && selectedHost.availableBalance <= 0) {
      setCreateError("Host này chưa có số dư khả dụng để tạo khoản chi trả.");
      return;
    }

    if (selectedHost && amount > selectedHost.availableBalance) {
      setCreateError(
        `Số tiền chi trả không được vượt quá số dư khả dụng ${selectedHost.availableBalanceLabel}.`,
      );
      return;
    }

    const payload: CreateFinancialPayoutPayload = {
      userId,
      amount,
      method: createForm.method,
      note: createForm.note.trim(),
      markAsPaid: createForm.markAsPaid,
    };

    try {
      setIsCreating(true);
      setCreateError("");
      await financialService.createPayoutRequest(payload);
      await loadData();
      await loadHostOptions();
      setIsCreateOpen(false);
      setCreateForm(initialCreateForm);
      pushToast(
        createForm.markAsPaid
          ? "Đã tạo khoản chi trả và đánh dấu đã chi trả."
          : "Đã tạo khoản chi trả ở trạng thái chờ chi trả.",
      );
    } catch (error) {
      setCreateError(
        error instanceof Error
          ? error.message
          : "Không thể tạo khoản chi trả Host.",
      );
    } finally {
      setIsCreating(false);
    }
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
      pushToast("Đã xác nhận khoản chi trả này đã được chuyển khoản.");
    } catch (error) {
      pushToast(
        error instanceof Error
          ? error.message
          : "Không thể xử lý khoản chi trả.",
        "error",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const currentBatchScopeHint = detail
    ? `Khi xác nhận, hệ thống chỉ chốt khoản chi trả #${detail.payoutRequestId} với số tiền ${detail.amountLabel}. Các khoản thu nhập còn lại hoặc phát sinh sau đó sẽ do admin tạo khoản chi trả mới.`
    : "";

  return (
    <div className="financial-page">
      <ToastContainer toasts={toasts} onClose={handleToastClose} />

      <PageHeader
        title="Tài chính / Chi trả Host"
        description="Admin chủ động tạo khoản chi trả cho Host, chuyển khoản ngoài hệ thống và đánh dấu trạng thái đã chi trả hoặc chờ chi trả."
      />

      <div className="financial-page__top-actions">
        <button
          type="button"
          className="financial-page__button financial-page__button--primary"
          onClick={() => void openCreateModal()}
        >
          + Tạo khoản chi trả
        </button>
      </div>

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
        title="Bộ lọc khoản chi trả"
        description="Tìm nhanh theo tên Host, email, số điện thoại hoặc mã khoản chi trả."
      >
        <div className="financial-page__filters">
          <div className="financial-page__field financial-page__field--wide">
            <label htmlFor="financial-keyword">Tìm kiếm</label>
            <input
              id="financial-keyword"
              className="financial-page__input"
              type="text"
              value={filters.keyword}
              placeholder="Tên Host, email, số điện thoại hoặc mã khoản chi trả"
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
        title="Danh sách khoản chi trả"
        description="Mỗi dòng là một khoản chi trả do admin tạo. Sau khi chuyển khoản ngoài hệ thống, admin đánh dấu lại là đã chi trả."
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
            title="Chưa có khoản chi trả"
            description="Admin có thể tạo khoản chi trả mới sau khi đối chiếu thu nhập khả dụng của Host."
          />
        ) : (
          <>
            <div className="financial-page__table-wrapper">
              <table className="financial-page__table">
                <thead>
                  <tr>
                    <th>Mã chi trả</th>
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
        isOpen={isCreateOpen}
        title="Tạo khoản chi trả Host"
        description="Admin tự nhập thông tin chi trả. Tiền vẫn được chuyển ngoài hệ thống, trang này chỉ lưu trạng thái đối soát."
        onClose={closeCreateModal}
        maxWidth="1040px"
      >
        <div className="financial-page__detail">
          {createError ? (
            <p className="financial-page__message financial-page__message--error">
              {createError}
            </p>
          ) : null}

          <div className="financial-page__create-layout">
            <section className="financial-page__create-panel">
              <div className="financial-page__create-panel-header">
                <div>
                  <h4>Chọn Host</h4>
                  <p>Chọn đúng Host trước khi nhập số tiền chi trả.</p>
                </div>
                <span>
                  {payableHostCount}/{hostOptions.length} Host có thể chi trả
                </span>
              </div>

              <input
                className="financial-page__input financial-page__host-search"
                type="text"
                value={hostSearch}
                placeholder="Tìm theo tên, email hoặc số điện thoại"
                disabled={isLoadingHosts || isCreating}
                onChange={(event) => setHostSearch(event.target.value)}
              />

              <div className="financial-page__host-list">
                {isLoadingHosts ? (
                  <div className="financial-page__host-empty">Đang tải danh sách Host...</div>
                ) : filteredHostOptions.length === 0 ? (
                  <div className="financial-page__host-empty">Không có Host phù hợp.</div>
                ) : (
                  filteredHostOptions.map((host) => {
                    const isSelected = String(host.userId) === createForm.userId;
                    const canCreatePayout = host.availableBalance > 0;
                    return (
                      <button
                        key={host.userId}
                        type="button"
                        className={`financial-page__host-option${isSelected ? " financial-page__host-option--selected" : ""}${!canCreatePayout ? " financial-page__host-option--disabled" : ""}`}
                        disabled={isCreating || !canCreatePayout}
                        onClick={() =>
                          setCreateForm((current) => ({
                            ...current,
                            userId: String(host.userId),
                            amount: String(host.availableBalance),
                          }))
                        }
                      >
                        <span>
                          <strong>{host.userName}</strong>
                          <small>{host.userEmail || host.userMobile || `Host #${host.userId}`}</small>
                          {!canCreatePayout ? (
                            <em>Chưa có số dư khả dụng</em>
                          ) : null}
                        </span>
                        <b>{host.availableBalanceLabel}</b>
                      </button>
                    );
                  })
                )}
              </div>
            </section>

            <section className="financial-page__create-panel financial-page__create-panel--payment">
              <div className="financial-page__create-panel-header">
                <div>
                  <h4>Thông tin chi trả</h4>
                  <p>Ghi lại khoản tiền đã hoặc sẽ chuyển ngoài hệ thống.</p>
                </div>
              </div>

              {selectedHost ? (
                <div className="financial-page__balance-strip">
                  <div>
                    <span>Khả dụng</span>
                    <strong>{selectedHost.availableBalanceLabel}</strong>
                  </div>
                  <div>
                    <span>Đã chi</span>
                    <strong>{selectedHost.paidOutAmountLabel}</strong>
                  </div>
                  <div>
                    <span>Chờ chi</span>
                    <strong>{selectedHost.pendingAmountLabel}</strong>
                  </div>
                </div>
              ) : (
                <div className="financial-page__balance-placeholder">
                  Chọn Host để xem số dư và nhập khoản chi trả.
                </div>
              )}

              <div className="financial-page__create-fields">
                <div className="financial-page__field">
                  <label htmlFor="financial-create-amount">Số tiền chi trả</label>
                  <input
                    id="financial-create-amount"
                    className="financial-page__input"
                    type="number"
                    min="0"
                    value={createForm.amount}
                    disabled={isCreating}
                    placeholder="Nhập số tiền"
                    onChange={(event) =>
                      setCreateForm((current) => ({
                        ...current,
                        amount: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="financial-page__field">
                  <label htmlFor="financial-create-method">Phương thức</label>
                  <select
                    id="financial-create-method"
                    className="financial-page__select"
                    value={createForm.method}
                    disabled={isCreating}
                    onChange={(event) =>
                      setCreateForm((current) => ({
                        ...current,
                        method: event.target.value,
                      }))
                    }
                  >
                    {Object.entries(methodLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="financial-page__field">
                <label htmlFor="financial-create-note">Ghi chú</label>
                <textarea
                  id="financial-create-note"
                  className="financial-page__textarea financial-page__textarea--compact"
                  value={createForm.note}
                  disabled={isCreating}
                  placeholder="Ví dụ: chi trả nhuận bút Host kỳ tháng 5, đã đối chiếu ngoài hệ thống."
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      note: event.target.value,
                    }))
                  }
                />
              </div>

              <label className="financial-page__checkbox">
                <input
                  type="checkbox"
                  checked={createForm.markAsPaid}
                  disabled={isCreating}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      markAsPaid: event.target.checked,
                    }))
                  }
                />
                <span>Đánh dấu đã chi trả ngay sau khi tạo</span>
              </label>
            </section>
          </div>

          <div className="financial-page__modal-actions">
            <button
              type="button"
              className="financial-page__button"
              onClick={closeCreateModal}
              disabled={isCreating}
            >
              Đóng
            </button>
            <button
              type="button"
              className="financial-page__button financial-page__button--primary"
              onClick={() => void handleCreatePayout()}
              disabled={isCreating || isLoadingHosts}
            >
              {isCreating ? "Đang tạo..." : "Tạo khoản chi trả"}
            </button>
          </div>
        </div>
      </BaseModal>

      <BaseModal
        isOpen={Boolean(selectedItem)}
        title="Chi tiết khoản chi trả Host"
        description="Đối chiếu khoản chi trả do admin tạo. Nếu đã chuyển khoản ngoài hệ thống, đánh dấu là đã chi trả."
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

            <section className="financial-page__detail-hero">
              <div>
                <div className="financial-page__detail-eyebrow">
                  Khoản chi trả #{detail.payoutRequestId}
                </div>
                <div className="financial-page__detail-amount">
                  {detail.amountLabel}
                </div>
                <p className="financial-page__secondary-text financial-page__secondary-text--hero">
                  Đây là số tiền admin đã tạo để chi trả cho Host. GreenMarket không chuyển tiền trong hệ thống, admin chỉ xác nhận lại sau khi đã chuyển khoản thực tế.
                </p>
              </div>

              <StatusBadge
                label={detail.statusLabel}
                variant={getStatusVariant(detail.status)}
              />
            </section>

            <div className="financial-page__detail-grid">
              <article className="financial-page__detail-card">
                <h4>Thông tin cần xem</h4>
                <dl>
                  <div>
                    <dt>Host</dt>
                    <dd>{detail.userName}</dd>
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
                <h4>Nhắc trước khi xác nhận</h4>
                <ul className="financial-page__checklist">
                  <li>Chỉ bấm xác nhận sau khi đã chuyển khoản ngoài hệ thống cho Host.</li>
                  <li>{currentBatchScopeHint}</li>
                  <li>
                    Nếu cần, ghi chú lại mã giao dịch ngân hàng hoặc nội dung đối
                    soát để tiện kiểm tra sau này.
                  </li>
                </ul>

                <div className="financial-page__inline-summary">
                  <div className="financial-page__inline-summary-item">
                    <span>Tổng đã ghi nhận</span>
                    <strong>{detail.earningSummary.totalEarnedLabel}</strong>
                  </div>
                  <div className="financial-page__inline-summary-item">
                    <span>Đã chi trước đó</span>
                    <strong>{detail.earningSummary.paidOutAmountLabel}</strong>
                  </div>
                </div>
              </article>
            </div>

            <div className="financial-page__field">
              <label htmlFor="financial-admin-note">Ghi chú xác nhận</label>
              <textarea
                id="financial-admin-note"
                className="financial-page__textarea"
                value={detailNote}
                placeholder="Ví dụ: đã chuyển khoản ngoài thực tế lúc 10:30, ngân hàng MB, nội dung CK khoản chi trả #24."
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
                  {isProcessing
                    ? "Đang xử lý..."
                    : "Xác nhận đã chuyển khoản"}
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
