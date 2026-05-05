import { useCallback, useEffect, useMemo, useState } from "react";
import BaseModal from "../components/BaseModal";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, {
  type ToastItem,
} from "../components/ToastContainer";
import { hostContentAdminService } from "../services/hostContentAdminService";
import type {
  HostContentAdminDetail,
  HostContentAdminFilters,
  HostContentAdminItem,
  HostContentStatus,
} from "../types/hostContentAdmin";
import "./HostContentsPage.css";

const PAGE_SIZE = 10;

const statusOptions: Array<HostContentStatus | "all"> = [
  "all",
  "pending_admin",
  "published",
  "rejected",
];

const statusLabels: Record<HostContentStatus | "all", string> = {
  all: "Tất cả trạng thái",
  pending_admin: "Chờ duyệt",
  published: "Đã xuất bản",
  rejected: "Đã từ chối",
};

const getStatusVariant = (status: HostContentStatus) => {
  if (status === "pending_admin") return "pending" as const;
  if (status === "published") return "success" as const;
  return "negative" as const;
};

const createToastId = () => Date.now() + Math.floor(Math.random() * 1000);

function HostContentsPage() {
  const [filters, setFilters] = useState<HostContentAdminFilters>({
    keyword: "",
    status: "all",
    category: "",
    page: 1,
    limit: PAGE_SIZE,
  });
  const [items, setItems] = useState<HostContentAdminItem[]>([]);
  const [summary, setSummary] = useState({
    totalContents: 0,
    pendingContents: 0,
    publishedContents: 0,
    rejectedContents: 0,
    totalPayout: 0,
    totalPayoutLabel: "0 VND",
  });
  const [meta, setMeta] = useState({
    page: 1,
    limit: PAGE_SIZE,
    totalItems: 0,
    totalPages: 1,
  });
  const [selectedItem, setSelectedItem] = useState<HostContentAdminItem | null>(
    null,
  );
  const [detail, setDetail] = useState<HostContentAdminDetail | null>(null);
  const [statusDraft, setStatusDraft] = useState<HostContentStatus>(
    "pending_admin",
  );
  const [statusNote, setStatusNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setPageError("");
      const response = await hostContentAdminService.getHostContents(filters);
      setItems(response.data);
      setSummary(response.summary);
      setMeta(response.meta);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách nội dung Host.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const pushToast = (message: string, tone: ToastItem["tone"] = "success") => {
    const id = createToastId();
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3600);
  };

  const categories = useMemo(
    () =>
      Array.from(new Set(items.map((item) => item.category)))
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right, "vi")),
    [items],
  );

  const statCards = useMemo(
    () => [
      {
        title: "Nội dung chờ duyệt",
        value: String(summary.pendingContents),
        subtitle: "Các bài Host cần admin kiểm tra trước khi công khai.",
      },
      {
        title: "Đã xuất bản",
        value: String(summary.publishedContents),
        subtitle: "Nguồn nội dung hiện đang đổ sang phần Tin tức của user web.",
      },
      {
        title: "Đã từ chối",
        value: String(summary.rejectedContents),
        subtitle: "Các nội dung không đạt yêu cầu hoặc đã bị thu hồi.",
      },
      {
        title: "Tổng nhuận bút dự kiến",
        value: summary.totalPayoutLabel,
        subtitle: "Tổng nhuận bút gắn trên toàn bộ nội dung Host trong phạm vi hiện tại.",
      },
    ],
    [summary],
  );

  const openDetail = async (item: HostContentAdminItem) => {
    setSelectedItem(item);
    setDetail(null);
    setDetailError("");
    setStatusDraft(item.status);
    setStatusNote("");

    try {
      setIsDetailLoading(true);
      const response = await hostContentAdminService.getHostContentDetail(
        item.hostContentId,
      );
      setDetail(response);
      setStatusDraft(response.status);
    } catch (error) {
      setDetailError(
        error instanceof Error
          ? error.message
          : "Không thể tải chi tiết nội dung Host.",
      );
    } finally {
      setIsDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedItem(null);
    setDetail(null);
    setDetailError("");
    setStatusNote("");
  };

  const handleUpdateStatus = async () => {
    if (!detail) return;

    try {
      setIsSaving(true);
      await hostContentAdminService.updateHostContentStatus(detail.hostContentId, {
        status: statusDraft,
        note: statusNote,
      });

      const refreshedDetail = await hostContentAdminService.getHostContentDetail(
        detail.hostContentId,
      );
      setDetail(refreshedDetail);
      setSelectedItem((current) =>
        current
          ? {
              ...current,
              status: refreshedDetail.status,
              statusLabel: refreshedDetail.statusLabel,
            }
          : current,
      );
      await loadData();
      pushToast("Đã cập nhật trạng thái nội dung Host.");
    } catch (error) {
      pushToast(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật trạng thái nội dung Host.",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="host-contents-page">
      <ToastContainer
        toasts={toasts}
        onClose={(id) =>
          setToasts((current) => current.filter((toast) => toast.id !== id))
        }
      />

      <PageHeader
        title="Quản lý nội dung Host / Tin tức"
        description="Kiểm tra bài nội dung Host, nhuận bút đi kèm và quyết định trạng thái xuất bản để đảm bảo phần Tin tức hiển thị đúng định hướng vận hành."
      />

      <div className="host-contents-page__stats">
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
        title="Bộ lọc nội dung Host"
        description="Tìm theo tiêu đề, tác giả hoặc lọc theo trạng thái và danh mục nội dung để kiểm tra nhanh nguồn Tin tức."
      >
        <div className="host-contents-page__filters">
          <div className="host-contents-page__field host-contents-page__field--wide">
            <label htmlFor="host-content-keyword">Tìm kiếm</label>
            <input
              id="host-content-keyword"
              className="host-contents-page__input"
              type="text"
              value={filters.keyword}
              placeholder="Tiêu đề, mô tả, tên tác giả hoặc email"
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  keyword: event.target.value,
                  page: 1,
                }))
              }
            />
          </div>

          <div className="host-contents-page__field">
            <label htmlFor="host-content-status">Trạng thái</label>
            <select
              id="host-content-status"
              className="host-contents-page__select"
              value={filters.status}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  status: event.target.value as HostContentStatus | "all",
                  page: 1,
                }))
              }
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </div>

          <div className="host-contents-page__field">
            <label htmlFor="host-content-category">Danh mục</label>
            <select
              id="host-content-category"
              className="host-contents-page__select"
              value={filters.category}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  category: event.target.value,
                  page: 1,
                }))
              }
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Danh sách nội dung Host"
        description="Theo dõi toàn bộ bài nội dung đang nuôi phần Tin tức, kiểm tra nhuận bút và kiểm soát trạng thái xuất bản."
      >
        {pageError ? (
          <p className="host-contents-page__message host-contents-page__message--error">
            {pageError}
          </p>
        ) : null}

        {isLoading ? (
          <p className="host-contents-page__message">Đang tải danh sách nội dung...</p>
        ) : items.length === 0 ? (
          <EmptyState
            title="Chưa có nội dung Host"
            description="Khi Host tạo bài nội dung hoặc Tin tức, chúng sẽ xuất hiện tại đây để admin theo dõi và kiểm soát."
          />
        ) : (
          <>
            <div className="host-contents-page__table-wrapper">
              <table className="host-contents-page__table">
                <thead>
                  <tr>
                    <th>Tiêu đề</th>
                    <th>Tác giả</th>
                    <th>Danh mục</th>
                    <th>Nhuận bút</th>
                    <th>Trạng thái</th>
                    <th>Lượt xem</th>
                    <th>Cập nhật gần nhất</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.hostContentId}>
                      <td>
                        <div className="host-contents-page__primary-text">
                          {item.title}
                        </div>
                        <div className="host-contents-page__secondary-text">
                          {item.description || "Chưa có mô tả ngắn"}
                        </div>
                      </td>
                      <td>
                        <div className="host-contents-page__primary-text">
                          {item.authorName}
                        </div>
                        <div className="host-contents-page__secondary-text">
                          {item.authorEmail || "--"}
                        </div>
                      </td>
                      <td>{item.category}</td>
                      <td>{item.payoutAmountLabel}</td>
                      <td>
                        <StatusBadge
                          label={item.statusLabel}
                          variant={getStatusVariant(item.status)}
                        />
                      </td>
                      <td>{item.viewCount.toLocaleString("vi-VN")}</td>
                      <td>{item.updatedAt}</td>
                      <td>
                        <button
                          type="button"
                          className="host-contents-page__table-action"
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
              <div className="host-contents-page__pagination">
                <button
                  type="button"
                  className="host-contents-page__pagination-button"
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
                  className="host-contents-page__pagination-button"
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
        title="Chi tiết nội dung Host"
        description="Kiểm tra đầy đủ nội dung, media, nhuận bút và trạng thái để quyết định duyệt, từ chối hoặc đưa bài về chờ xử lý."
        onClose={closeDetail}
        maxWidth="980px"
      >
        {isDetailLoading ? (
          <p className="host-contents-page__message">Đang tải chi tiết...</p>
        ) : detailError ? (
          <p className="host-contents-page__message host-contents-page__message--error">
            {detailError}
          </p>
        ) : detail ? (
          <div className="host-contents-page__detail">
            <div className="host-contents-page__detail-grid">
              <article className="host-contents-page__detail-card">
                <h4>Thông tin nội dung</h4>
                <dl>
                  <div>
                    <dt>Tiêu đề</dt>
                    <dd>{detail.title}</dd>
                  </div>
                  <div>
                    <dt>Danh mục</dt>
                    <dd>{detail.category}</dd>
                  </div>
                  <div>
                    <dt>Trạng thái</dt>
                    <dd>{detail.statusLabel}</dd>
                  </div>
                  <div>
                    <dt>Nhuận bút</dt>
                    <dd>{detail.payoutAmountLabel}</dd>
                  </div>
                  <div>
                    <dt>Lượt xem</dt>
                    <dd>{detail.viewCount.toLocaleString("vi-VN")}</dd>
                  </div>
                  <div>
                    <dt>Tạo lúc</dt>
                    <dd>{detail.createdAt}</dd>
                  </div>
                  <div>
                    <dt>Cập nhật</dt>
                    <dd>{detail.updatedAt}</dd>
                  </div>
                </dl>
              </article>

              <article className="host-contents-page__detail-card">
                <h4>Tác giả / Host</h4>
                <dl>
                  <div>
                    <dt>Tên hiển thị</dt>
                    <dd>{detail.authorName}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{detail.authorEmail || "--"}</dd>
                  </div>
                  <div>
                    <dt>Điện thoại</dt>
                    <dd>{detail.authorMobile || "--"}</dd>
                  </div>
                  <div>
                    <dt>Khu vực</dt>
                    <dd>{detail.authorLocation || "--"}</dd>
                  </div>
                </dl>
              </article>
            </div>

            <div className="host-contents-page__note-card">
              <h4>Mô tả ngắn</h4>
              <p>{detail.description || "Chưa có mô tả ngắn."}</p>
            </div>

            <div className="host-contents-page__note-card">
              <h4>Nội dung đầy đủ</h4>
              <div className="host-contents-page__body">
                {detail.body || "Chưa có nội dung chi tiết."}
              </div>
            </div>

            <div className="host-contents-page__detail-card">
              <h4>Media đính kèm</h4>
              {detail.mediaUrls.length === 0 ? (
                <p className="host-contents-page__secondary-text">
                  Nội dung này chưa có media đính kèm.
                </p>
              ) : (
                <div className="host-contents-page__media-grid">
                  {detail.mediaUrls.map((url) => (
                    <img
                      key={url}
                      src={url}
                      alt={detail.title}
                      className="host-contents-page__media"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="host-contents-page__detail-grid host-contents-page__detail-grid--controls">
              <div className="host-contents-page__field">
                <label htmlFor="host-content-status">Trạng thái mới</label>
                <select
                  id="host-content-status"
                  className="host-contents-page__select"
                  value={statusDraft}
                  onChange={(event) =>
                    setStatusDraft(event.target.value as HostContentStatus)
                  }
                >
                  {statusOptions
                    .filter((status) => status !== "all")
                    .map((status) => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                </select>
              </div>

              <div className="host-contents-page__field host-contents-page__field--wide">
                <label htmlFor="host-content-note">Ghi chú xử lý</label>
                <textarea
                  id="host-content-note"
                  className="host-contents-page__textarea"
                  value={statusNote}
                  placeholder="Ghi chú thêm cho host khi bạn thay đổi trạng thái bài nội dung."
                  onChange={(event) => setStatusNote(event.target.value)}
                />
              </div>
            </div>

            <div className="host-contents-page__modal-actions">
              <button
                type="button"
                className="host-contents-page__button"
                onClick={closeDetail}
                disabled={isSaving}
              >
                Đóng
              </button>
              <button
                type="button"
                className="host-contents-page__button host-contents-page__button--primary"
                onClick={() => void handleUpdateStatus()}
                disabled={isSaving}
              >
                {isSaving ? "Đang lưu..." : "Cập nhật trạng thái"}
              </button>
            </div>
          </div>
        ) : null}
      </BaseModal>
    </div>
  );
}

export default HostContentsPage;
