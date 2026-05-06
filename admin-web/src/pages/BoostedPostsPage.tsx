import { useEffect, useMemo, useState } from "react";
import BaseModal from "../components/BaseModal";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { boostedPostService } from "../services/boostedPostService";
import type {
  BoostedPost,
  BoostedPostDeliveryHealth,
  BoostedPostReviewStatus,
  BoostedPostSlot,
  BoostedPostStatus,
} from "../types/boostedPost";
import "./BoostedPostsPage.css";

type ConfirmAction = "pause" | "resume";

type ConfirmState = {
  isOpen: boolean;
  postId: number | null;
  action: ConfirmAction | null;
};

const statusFilterOptions: Array<BoostedPostStatus | "All"> = [
  "All",
  "Scheduled",
  "Active",
  "Paused",
  "Completed",
  "Expired",
  "Closed",
  "Inactive",
];

const reviewFilterOptions: Array<BoostedPostReviewStatus | "All"> = [
  "All",
  "Approved",
  "Needs Update",
  "Escalated",
];

const healthFilterOptions: Array<BoostedPostDeliveryHealth | "All"> = [
  "All",
  "Healthy",
  "Watch",
  "At Risk",
];

const getSlotLabel = (slot: BoostedPostSlot | "All") => {
  if (slot === "All") return "Tất cả";
  if (slot === "Home Top") return "Vị trí 1 trang chủ";
  if (slot === "Category Top") return "Vị trí 2 trang chủ";
  if (slot === "Search Boost") return "Vị trí 3 trang chủ";
  return slot;
};

const statusLabelMap: Record<BoostedPostStatus | "All", string> = {
  All: "Tất cả",
  Scheduled: "Đã lên lịch",
  Active: "Đang chạy",
  Paused: "Tạm dừng",
  Completed: "Hoàn tất",
  Expired: "Hết hạn",
  Closed: "Đã đóng",
  Inactive: "Ngừng hoạt động",
};

const reviewLabelMap: Record<BoostedPostReviewStatus | "All", string> = {
  All: "Tất cả",
  Approved: "Đã duyệt",
  "Needs Update": "Cần cập nhật",
  Escalated: "Cần xử lý",
};

const healthLabelMap: Record<BoostedPostDeliveryHealth | "All", string> = {
  All: "Tất cả",
  Healthy: "Ổn định",
  Watch: "Theo dõi",
  "At Risk": "Có rủi ro",
};

const PAGE_SIZE = 5;

const formatCtr = (clicks: number, impressions: number) => {
  if (impressions === 0) {
    return "0.00%";
  }

  return `${((clicks / impressions) * 100).toFixed(2)}%`;
};

const getHealthVariant = (health: BoostedPostDeliveryHealth) => {
  if (health === "Healthy") return "active";
  if (health === "Watch") return "processing";
  return "negative";
};

const getReviewVariant = (reviewStatus: BoostedPostReviewStatus) => {
  if (reviewStatus === "Approved") return "success";
  if (reviewStatus === "Needs Update") return "pending";
  return "negative";
};

function BoostedPostsPage() {
  const [posts, setPosts] = useState<BoostedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [isStatusUpdating, setIsStatusUpdating] = useState<number | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSlotFilter, setSelectedSlotFilter] = useState<
    BoostedPostSlot | "All"
  >("All");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<
    BoostedPostStatus | "All"
  >("All");
  const [selectedReviewFilter, setSelectedReviewFilter] = useState<
    BoostedPostReviewStatus | "All"
  >("All");
  const [selectedHealthFilter, setSelectedHealthFilter] = useState<
    BoostedPostDeliveryHealth | "All"
  >("All");
  const [page, setPage] = useState(1);
  const [selectedPost, setSelectedPost] = useState<BoostedPost | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    postId: null,
    action: null,
  });
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const summaryCards = boostedPostService.getSummaryCards(posts);
  const slotFilterOptions = useMemo<Array<BoostedPostSlot | "All">>(() => {
    const dynamicSlots = Array.from(new Set(posts.map((item) => item.slot)));
    return ["All", ...dynamicSlots];
  }, [posts]);

  useEffect(() => {
    const loadBoostedPosts = async () => {
      try {
        setIsLoading(true);
        setPageError("");
        const nextPosts = await boostedPostService.getBoostedPosts();
        setPosts(nextPosts);
      } catch (error) {
        setPageError(
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách quảng bá.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadBoostedPosts();
  }, []);

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

  const filteredPosts = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return posts.filter((item) => {
      const matchesKeyword =
        !keyword ||
        item.campaignCode.toLowerCase().includes(keyword) ||
        item.postTitle.toLowerCase().includes(keyword) ||
        item.ownerName.toLowerCase().includes(keyword);

      const matchesSlot =
        selectedSlotFilter === "All" || item.slot === selectedSlotFilter;

      const matchesStatus =
        selectedStatusFilter === "All" || item.status === selectedStatusFilter;

      const matchesReview =
        selectedReviewFilter === "All" ||
        item.reviewStatus === selectedReviewFilter;

      const matchesHealth =
        selectedHealthFilter === "All" ||
        item.deliveryHealth === selectedHealthFilter;

      return (
        matchesKeyword &&
        matchesSlot &&
        matchesStatus &&
        matchesReview &&
        matchesHealth
      );
    });
  }, [
    posts,
    searchKeyword,
    selectedSlotFilter,
    selectedStatusFilter,
    selectedReviewFilter,
    selectedHealthFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE));

  const paginatedPosts = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredPosts.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredPosts, page]);

  useEffect(() => {
    setPage(1);
  }, [
    searchKeyword,
    selectedSlotFilter,
    selectedStatusFilter,
    selectedReviewFilter,
    selectedHealthFilter,
  ]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const openViewModal = (item: BoostedPost) => {
    setSelectedPost(item);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setSelectedPost(null);
    setIsViewModalOpen(false);
  };

  const openConfirmDialog = (postId: number, action: ConfirmAction) => {
    setConfirmState({
      isOpen: true,
      postId,
      action,
    });
  };

  const closeConfirmDialog = () => {
    setConfirmState({
      isOpen: false,
      postId: null,
      action: null,
    });
  };

  const confirmPost =
    confirmState.postId !== null
      ? (posts.find((item) => item.id === confirmState.postId) ?? null)
      : null;

  const handleConfirmAction = async () => {
    if (confirmState.postId === null || confirmState.action === null) return;

    const postId = confirmState.postId;
    const targetPost = posts.find((item) => item.id === postId);

    if (!targetPost) {
      closeConfirmDialog();
      return;
    }

    const nextStatus: BoostedPostStatus =
      confirmState.action === "pause" ? "Paused" : "Active";

    try {
      setIsStatusUpdating(postId);
      const nextPosts = await boostedPostService.updateBoostedPostStatus(
        posts,
        postId,
        nextStatus,
      );

      setPosts(nextPosts);

      if (selectedPost?.id === postId) {
        setSelectedPost(
          nextPosts.find((item) => item.id === postId) ?? selectedPost,
        );
      }

      if (confirmState.action === "pause") {
        showToast(`${targetPost.campaignCode} đã được tạm dừng.`, "info");
      } else {
        showToast(`${targetPost.campaignCode} đã được tiếp tục.`);
      }

      closeConfirmDialog();
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật trạng thái bài đang quảng bá.",
        "error",
      );
    } finally {
      setIsStatusUpdating(null);
    }
  };

  const confirmTitleMap: Record<ConfirmAction, string> = {
    pause: "Tạm dừng quảng bá",
    resume: "Tiếp tục quảng bá",
  };

  const confirmMessageMap: Record<ConfirmAction, string> = {
    pause: `Bạn chắc chắn muốn tạm dừng ${
      confirmPost?.campaignCode ?? "bài này"
    }? Việc phân phối sẽ dừng cho đến khi được mở lại.`,
    resume: `Bạn chắc chắn muốn tiếp tục ${
      confirmPost?.campaignCode ?? "bài này"
    }? Bài sẽ chạy lại theo vị trí hiển thị hiện tại.`,
  };

  return (
    <div className="boosted-posts-page">
      <PageHeader
        title="Theo dõi quảng bá"
        description="Theo dõi mã quảng bá, trạng thái chạy và CTR của từng lượt quảng bá. Việc đóng hẳn chỉ được xử lý ở luồng báo cáo."
      />

      <div className="boosted-posts-summary-grid">
        {summaryCards.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
          />
        ))}
      </div>

      <SearchToolbar
        placeholder="Tìm theo mã quảng bá, tên cây hoặc chủ sở hữu"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
        onFilterClick={() => setShowFilters((prev) => !prev)}
        filterLabel="Lọc theo vị trí hiển thị, trạng thái chạy, duyệt và mức đánh giá"
        filterSummaryItems={[
          getSlotLabel(selectedSlotFilter),
          statusLabelMap[selectedStatusFilter],
          reviewLabelMap[selectedReviewFilter],
          healthLabelMap[selectedHealthFilter],
        ]}
      />

      {showFilters && (
        <SectionCard
          title="Bộ lọc quảng bá"
          description="Lọc theo vị trí hiển thị, trạng thái chạy, trạng thái duyệt và mức đánh giá."
        >
          <div className="boosted-posts-filters">
            <div className="boosted-posts-filters__field">
              <label htmlFor="boosted-post-slot-filter">Vị trí hiển thị</label>
              <select
                id="boosted-post-slot-filter"
                value={selectedSlotFilter}
                onChange={(event) =>
                  setSelectedSlotFilter(
                    event.target.value as BoostedPostSlot | "All",
                  )
                }
              >
                {slotFilterOptions.map((slot) => (
                  <option key={slot} value={slot}>
                    {getSlotLabel(slot)}
                  </option>
                ))}
              </select>
            </div>

            <div className="boosted-posts-filters__field">
              <label htmlFor="boosted-post-status-filter">Trạng thái chạy</label>
              <select
                id="boosted-post-status-filter"
                value={selectedStatusFilter}
                onChange={(event) =>
                  setSelectedStatusFilter(
                    event.target.value as BoostedPostStatus | "All",
                  )
                }
              >
                {statusFilterOptions.map((status) => (
                  <option key={status} value={status}>
                    {statusLabelMap[status]}
                  </option>
                ))}
              </select>
            </div>

            <div className="boosted-posts-filters__field">
              <label htmlFor="boosted-post-review-filter">Trạng thái duyệt</label>
              <select
                id="boosted-post-review-filter"
                value={selectedReviewFilter}
                onChange={(event) =>
                  setSelectedReviewFilter(
                    event.target.value as BoostedPostReviewStatus | "All",
                  )
                }
              >
                {reviewFilterOptions.map((reviewStatus) => (
                  <option key={reviewStatus} value={reviewStatus}>
                    {reviewLabelMap[reviewStatus]}
                  </option>
                ))}
              </select>
            </div>

            <div className="boosted-posts-filters__field">
              <label htmlFor="boosted-post-health-filter">Đánh giá</label>
              <select
                id="boosted-post-health-filter"
                value={selectedHealthFilter}
                onChange={(event) =>
                  setSelectedHealthFilter(
                    event.target.value as BoostedPostDeliveryHealth | "All",
                  )
                }
              >
                {healthFilterOptions.map((health) => (
                  <option key={health} value={health}>
                    {healthLabelMap[health]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </SectionCard>
      )}

      <SectionCard
        title="Danh sách quảng bá"
        description="Theo dõi CTR và mức độ thu hút của từng lượt quảng bá."
      >
        {isLoading ? (
          <EmptyState
            title="Đang tải danh sách quảng bá"
            description="Đang lấy dữ liệu quảng bá từ hệ thống quản trị."
          />
        ) : pageError ? (
          <EmptyState
            title="Không thể tải danh sách quảng bá"
            description={pageError}
          />
        ) : filteredPosts.length === 0 ? (
          <EmptyState
            title="Không có quảng bá phù hợp"
            description="Không có lượt quảng bá nào khớp với bộ lọc hiện tại."
          />
        ) : (
          <>
            <div className="boosted-posts-table-wrapper">
              <table className="boosted-posts-table">
                <thead>
                  <tr>
                    <th>Mã quảng bá</th>
                    <th>Bài đăng</th>
                    <th>Chủ sở hữu</th>
                    <th>Vị trí</th>
                    <th>Đánh giá</th>
                    <th>Duyệt</th>
                    <th>CTR</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedPosts.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="boosted-posts-cell">
                          <strong>{item.campaignCode}</strong>
                          <span>
                            {item.startDate} đến {item.endDate}
                          </span>
                        </div>
                      </td>
                      <td>{item.postTitle}</td>
                      <td>{item.ownerName}</td>
                      <td>
                        <StatusBadge label={getSlotLabel(item.slot)} variant="slot" />
                      </td>
                      <td>
                        <div className="boosted-posts-cell">
                          <StatusBadge
                            label={healthLabelMap[item.deliveryHealth]}
                            variant={getHealthVariant(item.deliveryHealth)}
                          />
                          <span>{statusLabelMap[item.status]}</span>
                        </div>
                      </td>
                      <td>
                        <StatusBadge
                          label={reviewLabelMap[item.reviewStatus]}
                          variant={getReviewVariant(item.reviewStatus)}
                        />
                      </td>
                      <td>{formatCtr(item.clicks, item.impressions)}</td>
                      <td>
                        <div className="boosted-posts-actions">
                          <button
                            type="button"
                            className="boosted-posts-actions__view"
                            onClick={() => openViewModal(item)}
                          >
                            Xem
                          </button>

                          {item.status === "Active" && (
                            <button
                              type="button"
                              className="boosted-posts-actions__pause"
                              onClick={() => openConfirmDialog(item.id, "pause")}
                              disabled={isStatusUpdating === item.id}
                            >
                              Tạm dừng
                            </button>
                          )}

                          {item.status === "Paused" && (
                            <button
                              type="button"
                              className="boosted-posts-actions__resume"
                              onClick={() => openConfirmDialog(item.id, "resume")}
                              disabled={isStatusUpdating === item.id}
                            >
                              Tiếp tục
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="boosted-posts-pagination">
              <span className="boosted-posts-pagination__info">
                Trang {page} / {totalPages}
              </span>

              <div className="boosted-posts-pagination__actions">
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
          </>
        )}
      </SectionCard>

      <BaseModal
        isOpen={isViewModalOpen}
        title="Chi tiết quảng bá"
        description="Theo dõi chỉ số chạy, trạng thái duyệt và ghi chú vận hành của lượt quảng bá."
        onClose={closeViewModal}
        maxWidth="760px"
      >
        {selectedPost ? (
          <div className="boosted-posts-modal__content">
            <div className="boosted-posts-modal__grid">
              <div className="boosted-posts-modal__field">
                <label>Mã quảng bá</label>
                <input type="text" value={selectedPost.campaignCode} disabled />
              </div>

              <div className="boosted-posts-modal__field">
                <label>Tiêu đề bài đăng</label>
                <input type="text" value={selectedPost.postTitle} disabled />
              </div>

              <div className="boosted-posts-modal__field">
                <label>Chủ sở hữu</label>
                <input type="text" value={selectedPost.ownerName} disabled />
              </div>

              <div className="boosted-posts-modal__field">
                <label>Vị trí hiển thị</label>
                <input type="text" value={getSlotLabel(selectedPost.slot)} disabled />
              </div>

              <div className="boosted-posts-modal__field">
                <label>Trạng thái chạy</label>
                <input type="text" value={statusLabelMap[selectedPost.status]} disabled />
              </div>

              <div className="boosted-posts-modal__field">
                <label>Đánh giá</label>
                <input
                  type="text"
                  value={healthLabelMap[selectedPost.deliveryHealth]}
                  disabled
                />
              </div>

              <div className="boosted-posts-modal__field">
                <label>Trạng thái duyệt</label>
                <input
                  type="text"
                  value={reviewLabelMap[selectedPost.reviewStatus]}
                  disabled
                />
              </div>

              <div className="boosted-posts-modal__field">
                <label>Gói áp dụng</label>
                <input type="text" value={selectedPost.packageName} disabled />
              </div>

              <div className="boosted-posts-modal__field">
                <label>Khoảng chạy</label>
                <input
                  type="text"
                  value={`${selectedPost.startDate} đến ${selectedPost.endDate}`}
                  disabled
                />
              </div>

              <div className="boosted-posts-modal__field">
                <label>Tỷ lệ nhấp (CTR)</label>
                <input
                  type="text"
                  value={formatCtr(
                    selectedPost.clicks,
                    selectedPost.impressions,
                  )}
                  disabled
                />
              </div>

              <div className="boosted-posts-modal__field">
                <label>Lượt hiển thị</label>
                <input
                  type="text"
                  value={selectedPost.impressions.toLocaleString("en-US")}
                  disabled
                />
              </div>

              <div className="boosted-posts-modal__field">
                <label>Lượt nhấp thực tế</label>
                <input
                  type="text"
                  value={selectedPost.clicks.toLocaleString("en-US")}
                  disabled
                />
              </div>

              <div className="boosted-posts-modal__field boosted-posts-modal__field--full">
                <label>Lần tối ưu gần nhất</label>
                <input
                  type="text"
                  value={selectedPost.lastOptimizedAt}
                  disabled
                />
              </div>
            </div>

            <div className="boosted-posts-modal__field">
              <label>Ghi chú</label>
              <textarea value={selectedPost.notes} rows={4} disabled />
            </div>

            <div className="boosted-posts-modal__actions">
              <button
                type="button"
                className="boosted-posts-modal__close"
                onClick={closeViewModal}
              >
                Đóng
              </button>
            </div>
          </div>
        ) : null}
      </BaseModal>

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={
          confirmState.action
            ? confirmTitleMap[confirmState.action]
            : "Xác nhận thao tác"
        }
        message={
          confirmState.action
            ? confirmMessageMap[confirmState.action]
            : "Vui lòng xác nhận thao tác này."
        }
        confirmText={
          confirmState.action === "pause"
            ? "Tạm dừng quảng bá"
            : "Tiếp tục quảng bá"
        }
        cancelText="Hủy"
        tone={
          confirmState.action === "resume"
            ? "success"
            : "neutral"
        }
        onConfirm={handleConfirmAction}
        onCancel={closeConfirmDialog}
      />

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default BoostedPostsPage;
