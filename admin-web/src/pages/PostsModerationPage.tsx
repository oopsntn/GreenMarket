import { useCallback, useEffect, useMemo, useState } from "react";
import BaseModal from "../components/BaseModal";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { postModerationService } from "../services/postModerationService";
import type {
  PostModerationItem,
  PostModerationStatus,
} from "../types/postModeration";
import "./PostsModerationPage.css";

const PAGE_SIZE = 5;

type StatusFilter = PostModerationStatus | "All";
type ModerationAction = "approve" | "reject" | "hide";

type ModerationState = {
  isOpen: boolean;
  action: ModerationAction | null;
  post: PostModerationItem | null;
};

const statusFilterOptions: StatusFilter[] = [
  "All",
  "Pending",
  "Approved",
  "Rejected",
  "Hidden",
  "Draft",
];

const getStatusLabel = (status: StatusFilter) => {
  switch (status) {
    case "All":
      return "Tất cả";
    case "Pending":
      return "Chờ duyệt";
    case "Approved":
      return "Đã duyệt";
    case "Rejected":
      return "Từ chối";
    case "Hidden":
      return "Đã ẩn";
    case "Draft":
      return "Nháp";
    default:
      return status;
  }
};

const getActionLabel = (action: ModerationAction) => {
  switch (action) {
    case "approve":
      return "Duyệt bài";
    case "reject":
      return "Từ chối bài";
    case "hide":
      return "Ẩn bài";
    default:
      return "Cập nhật";
  }
};

function PostsModerationPage() {
  const [posts, setPosts] = useState<PostModerationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<StatusFilter>("All");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedPost, setSelectedPost] = useState<PostModerationItem | null>(
    null,
  );
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [moderationState, setModerationState] = useState<ModerationState>({
    isOpen: false,
    action: null,
    post: null,
  });
  const [moderationReason, setModerationReason] = useState("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
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

  const loadPosts = useCallback(async (showSuccessToast = false) => {
    try {
      setIsLoading(true);
      setError("");

      const nextPosts = await postModerationService.fetchPosts();
      setPosts(nextPosts);

      if (showSuccessToast) {
        showToast("Đã làm mới hàng chờ kiểm duyệt bài đăng.");
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Không thể tải danh sách bài đăng kiểm duyệt.";
      setError(message);
      showToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const filteredPosts = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return posts.filter((post) => {
      const matchesKeyword =
        !keyword ||
        post.title.toLowerCase().includes(keyword) ||
        post.authorLabel.toLowerCase().includes(keyword) ||
        post.shopLabel.toLowerCase().includes(keyword) ||
        post.categoryLabel.toLowerCase().includes(keyword) ||
        post.location.toLowerCase().includes(keyword);

      const matchesStatus =
        selectedStatusFilter === "All" || post.status === selectedStatusFilter;

      return matchesKeyword && matchesStatus;
    });
  }, [posts, searchKeyword, selectedStatusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE));

  const paginatedPosts = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredPosts.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredPosts, page]);

  useEffect(() => {
    setPage(1);
  }, [searchKeyword, selectedStatusFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pendingCount = posts.filter((post) => post.status === "Pending").length;
  const rejectedCount = posts.filter(
    (post) => post.status === "Rejected",
  ).length;
  const hiddenCount = posts.filter((post) => post.status === "Hidden").length;

  const openDetailModal = async (post: PostModerationItem) => {
    setSelectedPost(post);
    setIsDetailLoading(true);

    try {
      const detail = await postModerationService.fetchPostById(post.id);
      setSelectedPost(detail);
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : "Không thể tải chi tiết bài đăng.",
        "error",
      );
    } finally {
      setIsDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setSelectedPost(null);
  };

  const openModerationModal = (
    post: PostModerationItem,
    action: ModerationAction,
  ) => {
    setModerationState({
      isOpen: true,
      action,
      post,
    });
    setModerationReason("");
  };

  const closeModerationModal = () => {
    setModerationState({
      isOpen: false,
      action: null,
      post: null,
    });
    setModerationReason("");
  };

  const handleModerationSubmit = async () => {
    if (!moderationState.post || !moderationState.action) return;

    try {
      setIsSubmittingAction(true);

      const updatedPost =
        moderationState.action === "approve"
          ? await postModerationService.updatePostStatus(
              moderationState.post.id,
              "Approved",
            )
          : moderationState.action === "reject"
            ? await postModerationService.updatePostStatus(
                moderationState.post.id,
                "Rejected",
                moderationReason,
              )
            : await postModerationService.hidePost(
                moderationState.post.id,
                moderationReason,
              );

      setPosts((prev) =>
        prev.map((post) => (post.id === updatedPost.id ? updatedPost : post)),
      );
      setSelectedPost((prev) =>
        prev && prev.id === updatedPost.id ? updatedPost : prev,
      );

      showToast(
        `${getActionLabel(moderationState.action)} thành công: "${updatedPost.title}".`,
      );

      closeModerationModal();
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : "Không thể cập nhật trạng thái kiểm duyệt.",
        "error",
      );
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const moderationTitle =
    moderationState.action === "approve"
      ? "Duyệt bài đăng"
      : moderationState.action === "reject"
        ? "Từ chối bài đăng"
        : "Ẩn bài đăng";

  const moderationDescription =
    moderationState.action === "approve"
      ? "Bài đăng sẽ được chuyển sang trạng thái đã duyệt để tiếp tục hiển thị trên hệ thống."
      : moderationState.action === "reject"
        ? "Nhập lý do nếu cần để lưu lại quyết định từ chối."
        : "Bài đăng sẽ bị ẩn khỏi hệ thống. Có thể nhập ghi chú vận hành nếu cần.";

  return (
    <div className="posts-moderation-page">
      <PageHeader
        title="Kiểm duyệt bài đăng"
        description="Rà soát bài đăng trên sàn, xem chi tiết kiểm duyệt và thực hiện duyệt hoặc từ chối."
        actionLabel="Làm mới hàng chờ"
        onActionClick={() => void loadPosts(true)}
      />

      <div className="posts-moderation-summary-grid">
        <StatCard
          title="Tổng bài đăng"
          value={String(posts.length)}
          subtitle="Bài đăng hiện có trong hàng chờ quản trị"
        />
        <StatCard
          title="Chờ duyệt"
          value={String(pendingCount)}
          subtitle="Bài đăng đang chờ quản trị xử lý"
        />
        <StatCard
          title="Đã từ chối"
          value={String(rejectedCount)}
          subtitle="Bài đăng đã bị từ chối"
        />
        <StatCard
          title="Đã ẩn"
          value={String(hiddenCount)}
          subtitle="Bài đăng bị quản trị ẩn thủ công"
        />
      </div>

      <SearchToolbar
        placeholder="Tìm theo tiêu đề, chủ bài đăng, cửa hàng, danh mục hoặc địa điểm"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
        onFilterClick={() => setShowFilters((prev) => !prev)}
        filterLabel="Lọc theo trạng thái"
        filterSummaryItems={[getStatusLabel(selectedStatusFilter)]}
      />

      {showFilters ? (
        <SectionCard
          title="Bộ lọc kiểm duyệt"
          description="Thu hẹp danh sách theo trạng thái kiểm duyệt."
        >
          <div className="posts-moderation-filters">
            <div className="posts-moderation-filters__field">
              <label htmlFor="post-status-filter">Trạng thái</label>
              <select
                id="post-status-filter"
                value={selectedStatusFilter}
                onChange={(event) =>
                  setSelectedStatusFilter(event.target.value as StatusFilter)
                }
              >
                {statusFilterOptions.map((option) => (
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
        title="Danh sách bài đăng chờ xử lý"
        description="Kiểm tra thông tin bài đăng, trạng thái hiện tại và thao tác kiểm duyệt."
      >
        {isLoading ? (
          <EmptyState
            title="Đang tải hàng chờ kiểm duyệt"
            description="Hệ thống đang lấy danh sách bài đăng từ API quản trị."
          />
        ) : error ? (
          <EmptyState title="Không thể tải bài đăng" description={error} />
        ) : filteredPosts.length === 0 ? (
          <EmptyState
            title="Không có bài đăng phù hợp"
            description="Không có bài đăng nào khớp với từ khóa tìm kiếm hoặc bộ lọc hiện tại."
          />
        ) : (
          <>
            <div className="posts-moderation-table-wrapper">
              <table className="posts-moderation-table">
                <thead>
                  <tr>
                    <th>Bài đăng</th>
                    <th>Chủ bài đăng</th>
                    <th>Trạng thái</th>
                    <th>Tương tác</th>
                    <th>Thời gian</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPosts.map((post) => (
                    <tr key={post.id}>
                      <td>
                        <div className="posts-moderation-cell">
                          <strong>{post.title}</strong>
                          <span>{post.categoryLabel}</span>
                          <small>{post.location}</small>
                        </div>
                      </td>
                      <td>
                        <div className="posts-moderation-cell">
                          <strong>{post.authorLabel}</strong>
                          <span>{post.shopLabel}</span>
                          <small>{post.contactPhone}</small>
                        </div>
                      </td>
                      <td>
                        <div className="posts-moderation-status">
                          <StatusBadge
                            label={getStatusLabel(post.status)}
                            variant={
                              post.status === "Approved"
                                ? "active"
                                : post.status === "Rejected"
                                  ? "locked"
                                  : post.status === "Hidden"
                                    ? "type"
                                    : "processing"
                            }
                          />
                          <small>{post.publishedLabel}</small>
                        </div>
                      </td>
                      <td>
                        <div className="posts-moderation-metrics">
                          <strong>
                            {post.views.toLocaleString("vi-VN")} lượt xem
                          </strong>
                          <span>
                            {post.contacts.toLocaleString("vi-VN")} liên hệ
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="posts-moderation-cell">
                          <strong>Gửi: {post.submittedAt}</strong>
                          <small>Duyệt: {post.moderatedAt}</small>
                        </div>
                      </td>
                      <td>
                        <div className="posts-moderation-actions">
                          <button
                            type="button"
                            className="posts-moderation-actions__view"
                            onClick={() => void openDetailModal(post)}
                          >
                            Xem
                          </button>

                          {post.status !== "Approved" ? (
                            <button
                              type="button"
                              className="posts-moderation-actions__approve"
                              onClick={() => openModerationModal(post, "approve")}
                            >
                              Duyệt
                            </button>
                          ) : null}

                          {post.status !== "Rejected" ? (
                            <button
                              type="button"
                              className="posts-moderation-actions__reject"
                              onClick={() => openModerationModal(post, "reject")}
                            >
                              Từ chối
                            </button>
                          ) : null}

                          {post.status !== "Hidden" ? (
                            <button
                              type="button"
                              className="posts-moderation-actions__hide"
                              onClick={() => openModerationModal(post, "hide")}
                            >
                              Ẩn
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="posts-moderation-pagination">
              <span className="posts-moderation-pagination__info">
                Trang {page} / {totalPages}
              </span>

              <div className="posts-moderation-pagination__actions">
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
        isOpen={selectedPost !== null}
        title={selectedPost?.title || "Chi tiết bài đăng"}
        description="Xem thông tin kiểm duyệt, nội dung và dữ liệu hỗ trợ của bài đăng."
        onClose={closeDetailModal}
        maxWidth="920px"
      >
        {isDetailLoading ? (
          <div className="posts-moderation-empty-state">
            Đang tải chi tiết bài đăng...
          </div>
        ) : selectedPost ? (
          <div className="posts-moderation-detail">
            <div className="posts-moderation-detail__grid">
              <div className="posts-moderation-detail__field">
                <label>Trạng thái</label>
                <input
                  type="text"
                  value={getStatusLabel(selectedPost.status)}
                  disabled
                />
              </div>
              <div className="posts-moderation-detail__field">
                <label>Slug</label>
                <input type="text" value={selectedPost.slug} disabled />
              </div>
              <div className="posts-moderation-detail__field">
                <label>Người đăng</label>
                <input type="text" value={selectedPost.authorLabel} disabled />
              </div>
              <div className="posts-moderation-detail__field">
                <label>Cửa hàng</label>
                <input type="text" value={selectedPost.shopLabel} disabled />
              </div>
              <div className="posts-moderation-detail__field">
                <label>Danh mục</label>
                <input type="text" value={selectedPost.categoryLabel} disabled />
              </div>
              <div className="posts-moderation-detail__field">
                <label>Giá</label>
                <input type="text" value={selectedPost.priceLabel} disabled />
              </div>
            </div>

            <div className="posts-moderation-detail__section">
              <h4>Ghi chú kiểm duyệt</h4>
              <p>{selectedPost.rejectedReason}</p>
            </div>

            <div className="posts-moderation-detail__section">
              <h4>Ảnh liên quan</h4>
              {selectedPost.images.length === 0 ? (
                <p>Chưa có dữ liệu ảnh trả về từ API.</p>
              ) : (
                <ul className="posts-moderation-detail__list">
                  {selectedPost.images.map((imageUrl) => (
                    <li key={imageUrl}>{imageUrl}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="posts-moderation-detail__section">
              <h4>Thuộc tính bài đăng</h4>
              {selectedPost.attributes.length === 0 ? (
                <p>Chưa có thuộc tính nào được trả về.</p>
              ) : (
                <ul className="posts-moderation-detail__list">
                  {selectedPost.attributes.map((attribute) => (
                    <li key={`${attribute.id}-${attribute.value}`}>
                      Thuộc tính #{attribute.id}: {attribute.value}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </BaseModal>

      <BaseModal
        isOpen={moderationState.isOpen}
        title={moderationTitle}
        description={moderationDescription}
        onClose={closeModerationModal}
        maxWidth="520px"
      >
        <div className="posts-moderation-form">
          <p className="posts-moderation-form__target">
            Đối tượng:{" "}
            <strong>{moderationState.post?.title || "Bài đăng đã chọn"}</strong>
          </p>

          <label htmlFor="posts-moderation-reason">Lý do / ghi chú</label>
          <textarea
            id="posts-moderation-reason"
            value={moderationReason}
            onChange={(event) => setModerationReason(event.target.value)}
            placeholder="Nhập ghi chú kiểm duyệt nếu cần"
            rows={4}
          />

          <div className="posts-moderation-form__actions">
            <button type="button" onClick={closeModerationModal}>
              Hủy
            </button>
            <button
              type="button"
              onClick={() => void handleModerationSubmit()}
              disabled={isSubmittingAction}
            >
              {isSubmittingAction ? "Đang lưu..." : "Xác nhận"}
            </button>
          </div>
        </div>
      </BaseModal>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default PostsModerationPage;
