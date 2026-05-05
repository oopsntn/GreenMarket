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
import { collaboratorAdminService } from "../services/collaboratorAdminService";
import type {
  CollaboratorDetail,
  CollaboratorFilters,
  CollaboratorRelationship,
  CollaboratorRelationshipStatus,
} from "../types/collaboratorAdmin";
import "./CollaboratorsPage.css";

const PAGE_SIZE = 10;

const statusOptions: Array<CollaboratorRelationshipStatus | "all"> = [
  "all",
  "active",
  "pending",
  "rejected",
  "removed",
];

const statusLabels: Record<CollaboratorRelationshipStatus | "all", string> = {
  all: "Tất cả trạng thái",
  active: "Đang hoạt động",
  pending: "Chờ phản hồi",
  rejected: "Đã từ chối",
  removed: "Đã kết thúc",
};

const getStatusVariant = (status: CollaboratorRelationshipStatus) => {
  if (status === "active") return "success" as const;
  if (status === "pending") return "pending" as const;
  return "negative" as const;
};

const createToastId = () => Date.now() + Math.floor(Math.random() * 1000);

function CollaboratorsPage() {
  const [filters, setFilters] = useState<CollaboratorFilters>({
    keyword: "",
    status: "all",
    page: 1,
    limit: PAGE_SIZE,
  });
  const [items, setItems] = useState<CollaboratorRelationship[]>([]);
  const [summary, setSummary] = useState({
    totalRelationships: 0,
    activeRelationships: 0,
    pendingRelationships: 0,
    endedRelationships: 0,
  });
  const [meta, setMeta] = useState({
    page: 1,
    limit: PAGE_SIZE,
    totalItems: 0,
    totalPages: 1,
  });
  const [selectedItem, setSelectedItem] = useState<CollaboratorRelationship | null>(
    null,
  );
  const [detail, setDetail] = useState<CollaboratorDetail | null>(null);
  const [statusDraft, setStatusDraft] =
    useState<CollaboratorRelationshipStatus>("active");
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
      const response = await collaboratorAdminService.getRelationships(filters);
      setItems(response.data);
      setSummary(response.summary);
      setMeta(response.meta);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách cộng tác viên.",
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

  const statCards = useMemo(
    () => [
      {
        title: "Tổng quan hệ cộng tác",
        value: String(summary.totalRelationships),
        subtitle: "Toàn bộ quan hệ shop - cộng tác viên đang được lưu trong hệ thống.",
      },
      {
        title: "Đang hoạt động",
        value: String(summary.activeRelationships),
        subtitle: "Các cộng tác viên đang được shop sử dụng để phối hợp đăng và xử lý bài.",
      },
      {
        title: "Chờ phản hồi",
        value: String(summary.pendingRelationships),
        subtitle: "Lời mời hoặc quan hệ đang chờ xác nhận tiếp theo.",
      },
      {
        title: "Đã kết thúc",
        value: String(summary.endedRelationships),
        subtitle: "Bao gồm lời mời bị từ chối hoặc quan hệ đã bị gỡ khỏi shop.",
      },
    ],
    [summary],
  );

  const openDetail = async (item: CollaboratorRelationship) => {
    setSelectedItem(item);
    setDetail(null);
    setDetailError("");
    setStatusDraft(item.relationshipStatus);
    setStatusNote("");

    try {
      setIsDetailLoading(true);
      const response = await collaboratorAdminService.getRelationshipDetail(
        item.collaboratorId,
        item.shopId,
      );
      setDetail(response);
      setStatusDraft(response.relationshipStatus);
    } catch (error) {
      setDetailError(
        error instanceof Error
          ? error.message
          : "Không thể tải chi tiết quan hệ cộng tác.",
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
      await collaboratorAdminService.updateRelationshipStatus(
        detail.collaboratorId,
        {
          shopId: detail.shopId,
          status: statusDraft,
          note: statusNote,
        },
      );

      const refreshedDetail =
        await collaboratorAdminService.getRelationshipDetail(
          detail.collaboratorId,
          detail.shopId,
        );
      setDetail(refreshedDetail);
      setSelectedItem((current) =>
        current
          ? {
              ...current,
              relationshipStatus: refreshedDetail.relationshipStatus,
              relationshipStatusLabel: refreshedDetail.relationshipStatusLabel,
            }
          : current,
      );
      await loadData();
      pushToast("Đã cập nhật trạng thái cộng tác.");
    } catch (error) {
      pushToast(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật trạng thái cộng tác.",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="collaborators-page">
      <ToastContainer
        toasts={toasts}
        onClose={(id) =>
          setToasts((current) => current.filter((toast) => toast.id !== id))
        }
      />

      <PageHeader
        title="Quản lý cộng tác viên"
        description="Theo dõi quan hệ giữa shop và cộng tác viên, kiểm tra bài đã gửi và cho phép admin can thiệp khi cần khóa hoặc kết thúc cộng tác."
      />

      <div className="collaborators-page__stats">
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
        title="Bộ lọc cộng tác"
        description="Tìm theo shop, cộng tác viên hoặc lọc theo trạng thái quan hệ để rà soát nhanh."
      >
        <div className="collaborators-page__filters">
          <div className="collaborators-page__field collaborators-page__field--wide">
            <label htmlFor="collaborator-keyword">Tìm kiếm</label>
            <input
              id="collaborator-keyword"
              className="collaborators-page__input"
              type="text"
              value={filters.keyword}
              placeholder="Tên shop, tên cộng tác viên, email hoặc số điện thoại"
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  keyword: event.target.value,
                  page: 1,
                }))
              }
            />
          </div>

          <div className="collaborators-page__field">
            <label htmlFor="collaborator-status">Trạng thái</label>
            <select
              id="collaborator-status"
              className="collaborators-page__select"
              value={filters.status}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  status: event.target.value as CollaboratorRelationshipStatus | "all",
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
        </div>
      </SectionCard>

      <SectionCard
        title="Danh sách quan hệ cộng tác"
        description="Mỗi dòng thể hiện một quan hệ giữa shop và cộng tác viên, cùng số bài đã gửi và số bài còn chờ xử lý."
      >
        {pageError ? (
          <p className="collaborators-page__message collaborators-page__message--error">
            {pageError}
          </p>
        ) : null}

        {isLoading ? (
          <p className="collaborators-page__message">Đang tải dữ liệu cộng tác...</p>
        ) : items.length === 0 ? (
          <EmptyState
            title="Chưa có quan hệ cộng tác"
            description="Khi shop gửi lời mời hoặc kích hoạt cộng tác viên, dữ liệu sẽ hiển thị tại đây để admin theo dõi."
          />
        ) : (
          <>
            <div className="collaborators-page__table-wrapper">
              <table className="collaborators-page__table">
                <thead>
                  <tr>
                    <th>Cửa hàng</th>
                    <th>Cộng tác viên</th>
                    <th>Trạng thái</th>
                    <th>Bài đã duyệt</th>
                    <th>Bài chờ xử lý</th>
                    <th>Ngày bắt đầu</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={`${item.shopId}-${item.collaboratorId}`}>
                      <td>
                        <div className="collaborators-page__primary-text">
                          {item.shopName}
                        </div>
                        <div className="collaborators-page__secondary-text">
                          Trạng thái shop: {item.shopStatus || "--"}
                        </div>
                      </td>
                      <td>
                        <div className="collaborators-page__primary-text">
                          {item.collaboratorName}
                        </div>
                        <div className="collaborators-page__secondary-text">
                          {item.collaboratorEmail || item.collaboratorMobile || "--"}
                        </div>
                      </td>
                      <td>
                        <StatusBadge
                          label={item.relationshipStatusLabel}
                          variant={getStatusVariant(item.relationshipStatus)}
                        />
                      </td>
                      <td>{item.publishedPostCount}</td>
                      <td>{item.pendingPostCount}</td>
                      <td>{item.joinedAt}</td>
                      <td>
                        <button
                          type="button"
                          className="collaborators-page__table-action"
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
              <div className="collaborators-page__pagination">
                <button
                  type="button"
                  className="collaborators-page__pagination-button"
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
                  className="collaborators-page__pagination-button"
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
        title="Chi tiết quan hệ cộng tác"
        description="Theo dõi shop, cộng tác viên, thống kê bài gửi và đổi trạng thái quan hệ khi cần can thiệp vận hành."
        onClose={closeDetail}
        maxWidth="920px"
      >
        {isDetailLoading ? (
          <p className="collaborators-page__message">Đang tải chi tiết...</p>
        ) : detailError ? (
          <p className="collaborators-page__message collaborators-page__message--error">
            {detailError}
          </p>
        ) : detail ? (
          <div className="collaborators-page__detail">
            <div className="collaborators-page__detail-grid">
              <article className="collaborators-page__detail-card">
                <h4>Thông tin shop</h4>
                <dl>
                  <div>
                    <dt>Tên shop</dt>
                    <dd>{detail.shopName}</dd>
                  </div>
                  <div>
                    <dt>Trạng thái shop</dt>
                    <dd>{detail.shopStatus || "--"}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{detail.shopEmail || "--"}</dd>
                  </div>
                  <div>
                    <dt>Điện thoại</dt>
                    <dd>{detail.shopPhone || "--"}</dd>
                  </div>
                </dl>
              </article>

              <article className="collaborators-page__detail-card">
                <h4>Thông tin cộng tác viên</h4>
                <dl>
                  <div>
                    <dt>Họ tên</dt>
                    <dd>{detail.collaboratorName}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{detail.collaboratorEmail || "--"}</dd>
                  </div>
                  <div>
                    <dt>Điện thoại</dt>
                    <dd>{detail.collaboratorMobile || "--"}</dd>
                  </div>
                  <div>
                    <dt>Vai trò</dt>
                    <dd>{detail.roleTitle}</dd>
                  </div>
                  <div>
                    <dt>Khu vực</dt>
                    <dd>{detail.collaboratorLocation || "--"}</dd>
                  </div>
                </dl>
              </article>
            </div>

            <div className="collaborators-page__detail-grid">
              <article className="collaborators-page__detail-card">
                <h4>Tình trạng cộng tác</h4>
                <dl>
                  <div>
                    <dt>Trạng thái hiện tại</dt>
                    <dd>{detail.relationshipStatusLabel}</dd>
                  </div>
                  <div>
                    <dt>Ngày bắt đầu</dt>
                    <dd>{detail.joinedAt}</dd>
                  </div>
                  <div>
                    <dt>Tổng bài gửi</dt>
                    <dd>{detail.postSummary.totalPosts}</dd>
                  </div>
                  <div>
                    <dt>Đã duyệt</dt>
                    <dd>{detail.postSummary.approvedPosts}</dd>
                  </div>
                  <div>
                    <dt>Chờ xử lý</dt>
                    <dd>{detail.postSummary.pendingPosts}</dd>
                  </div>
                  <div>
                    <dt>Bị từ chối</dt>
                    <dd>{detail.postSummary.rejectedPosts}</dd>
                  </div>
                </dl>
              </article>

              <article className="collaborators-page__detail-card">
                <h4>Bài gửi gần đây</h4>
                {detail.recentPosts.length === 0 ? (
                  <p className="collaborators-page__secondary-text">
                    Chưa có bài nào được ghi nhận cho quan hệ cộng tác này.
                  </p>
                ) : (
                  <ul className="collaborators-page__list">
                    {detail.recentPosts.map((post) => (
                      <li key={post.postId}>
                        <span>{post.title}</span>
                        <span>
                          {post.statusLabel} · {post.updatedAt}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </div>

            {detail.collaboratorBio ? (
              <div className="collaborators-page__note-card">
                <h4>Giới thiệu cộng tác viên</h4>
                <p>{detail.collaboratorBio}</p>
              </div>
            ) : null}

            <div className="collaborators-page__detail-grid collaborators-page__detail-grid--controls">
              <div className="collaborators-page__field">
                <label htmlFor="relationship-status">Trạng thái mới</label>
                <select
                  id="relationship-status"
                  className="collaborators-page__select"
                  value={statusDraft}
                  onChange={(event) =>
                    setStatusDraft(
                      event.target.value as CollaboratorRelationshipStatus,
                    )
                  }
                >
                  {statusOptions
                    .filter((item) => item !== "all")
                    .map((status) => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                </select>
              </div>

              <div className="collaborators-page__field collaborators-page__field--wide">
                <label htmlFor="relationship-note">Ghi chú quản trị</label>
                <textarea
                  id="relationship-note"
                  className="collaborators-page__textarea"
                  value={statusNote}
                  placeholder="Ghi chú thêm khi khóa, kết thúc hoặc chuyển lại trạng thái cộng tác."
                  onChange={(event) => setStatusNote(event.target.value)}
                />
              </div>
            </div>

            <div className="collaborators-page__modal-actions">
              <button
                type="button"
                className="collaborators-page__button"
                onClick={closeDetail}
                disabled={isSaving}
              >
                Đóng
              </button>
              <button
                type="button"
                className="collaborators-page__button collaborators-page__button--primary"
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

export default CollaboratorsPage;
