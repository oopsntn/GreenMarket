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

type ConfirmAction = "pause" | "resume" | "close";

type ConfirmState = {
  isOpen: boolean;
  postId: number | null;
  action: ConfirmAction | null;
};

const slotFilterOptions: Array<BoostedPostSlot | "All"> = [
  "All",
  "Home Top",
  "Category Top",
  "Search Boost",
];

const statusFilterOptions: Array<BoostedPostStatus | "All"> = [
  "All",
  "Scheduled",
  "Active",
  "Paused",
  "Completed",
  "Expired",
  "Closed",
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

const PAGE_SIZE = 5;

const formatCtr = (clicks: number, impressions: number) => {
  if (impressions === 0) {
    return "0.00%";
  }

  return `${((clicks / impressions) * 100).toFixed(2)}%`;
};

const formatQuotaUsage = (usedQuota: number, totalQuota: number) => {
  return `${usedQuota.toLocaleString("en-US")} / ${totalQuota.toLocaleString(
    "en-US",
  )}`;
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
  const [posts, setPosts] = useState<BoostedPost[]>(
    boostedPostService.getBoostedPosts(),
  );
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
        item.ownerName.toLowerCase().includes(keyword) ||
        item.assignedOperator.toLowerCase().includes(keyword);

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

  const handleConfirmAction = () => {
    if (confirmState.postId === null || confirmState.action === null) return;

    const postId = confirmState.postId;
    const targetPost = posts.find((item) => item.id === postId);

    if (!targetPost) {
      closeConfirmDialog();
      return;
    }

    let nextStatus: BoostedPostStatus;

    if (confirmState.action === "pause") {
      nextStatus = "Paused";
    } else if (confirmState.action === "resume") {
      nextStatus = "Active";
    } else {
      nextStatus = "Closed";
    }

    setPosts((prev) =>
      boostedPostService.updateBoostedPostStatus(prev, postId, nextStatus),
    );

    if (selectedPost?.id === postId) {
      setSelectedPost((prev) =>
        prev
          ? {
              ...prev,
              status: nextStatus,
            }
          : null,
      );
    }

    if (confirmState.action === "pause") {
      showToast(
        `${targetPost.campaignCode} has been paused successfully.`,
        "info",
      );
    } else if (confirmState.action === "resume") {
      showToast(`${targetPost.campaignCode} has been resumed successfully.`);
    } else {
      showToast(
        `${targetPost.campaignCode} has been closed successfully.`,
        "info",
      );
    }

    closeConfirmDialog();
  };

  const confirmTitleMap: Record<ConfirmAction, string> = {
    pause: "Pause Boosted Campaign",
    resume: "Resume Boosted Campaign",
    close: "Close Boosted Campaign",
  };

  const confirmMessageMap: Record<ConfirmAction, string> = {
    pause: `Are you sure you want to pause ${
      confirmPost?.campaignCode ?? "this boosted campaign"
    }? Delivery will stop until operations resumes it.`,
    resume: `Are you sure you want to resume ${
      confirmPost?.campaignCode ?? "this boosted campaign"
    }? Delivery will continue using the assigned slot and quota.`,
    close: `Are you sure you want to close ${
      confirmPost?.campaignCode ?? "this boosted campaign"
    }? It will be removed from the delivery queue.`,
  };

  return (
    <div className="boosted-posts-page">
      <PageHeader
        title="Boosted Posts Management"
        description="Operate boosted delivery campaigns, monitor quota usage, review campaign health, and follow up with operations assignments."
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
        placeholder="Search by campaign code, post title, owner, or operator"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
        onFilterClick={() => setShowFilters((prev) => !prev)}
        filterLabel="Filter by slot, status, review, health"
        filterSummaryItems={[
          selectedSlotFilter,
          selectedStatusFilter,
          selectedReviewFilter,
          selectedHealthFilter,
        ]}
      />

      {showFilters && (
        <SectionCard
          title="Campaign Filters"
          description="Refine boosted delivery records by slot, runtime status, review state, and campaign health."
        >
          <div className="boosted-posts-filters">
            <div className="boosted-posts-filters__field">
              <label htmlFor="boosted-post-slot-filter">Slot</label>
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
                    {slot}
                  </option>
                ))}
              </select>
            </div>

            <div className="boosted-posts-filters__field">
              <label htmlFor="boosted-post-status-filter">Campaign Status</label>
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
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="boosted-posts-filters__field">
              <label htmlFor="boosted-post-review-filter">Review Status</label>
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
                    {reviewStatus}
                  </option>
                ))}
              </select>
            </div>

            <div className="boosted-posts-filters__field">
              <label htmlFor="boosted-post-health-filter">Delivery Health</label>
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
                    {health}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </SectionCard>
      )}

      <SectionCard
        title="Boosted Campaign Directory"
        description="Review operational delivery state, quota consumption, assigned operator, and optimization activity."
      >
        {filteredPosts.length === 0 ? (
          <EmptyState
            title="No boosted campaigns found"
            description="No boosted campaigns match the current search or filter settings."
          />
        ) : (
          <>
            <div className="boosted-posts-table-wrapper">
              <table className="boosted-posts-table">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Post</th>
                    <th>Owner</th>
                    <th>Slot</th>
                    <th>Delivery</th>
                    <th>Review</th>
                    <th>CTR</th>
                    <th>Quota Used</th>
                    <th>Operator</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedPosts.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="boosted-posts-cell">
                          <strong>{item.campaignCode}</strong>
                          <span>
                            {item.startDate} to {item.endDate}
                          </span>
                        </div>
                      </td>
                      <td>{item.postTitle}</td>
                      <td>{item.ownerName}</td>
                      <td>
                        <StatusBadge label={item.slot} variant="slot" />
                      </td>
                      <td>
                        <div className="boosted-posts-cell">
                          <StatusBadge
                            label={item.deliveryHealth}
                            variant={getHealthVariant(item.deliveryHealth)}
                          />
                          <span>{item.status}</span>
                        </div>
                      </td>
                      <td>
                        <StatusBadge
                          label={item.reviewStatus}
                          variant={getReviewVariant(item.reviewStatus)}
                        />
                      </td>
                      <td>{formatCtr(item.clicks, item.impressions)}</td>
                      <td>{formatQuotaUsage(item.usedQuota, item.totalQuota)}</td>
                      <td>
                        <div className="boosted-posts-cell">
                          <strong>{item.assignedOperator}</strong>
                          <span>{item.lastOptimizedAt}</span>
                        </div>
                      </td>
                      <td>
                        <div className="boosted-posts-actions">
                          <button
                            type="button"
                            className="boosted-posts-actions__view"
                            onClick={() => openViewModal(item)}
                          >
                            View
                          </button>

                          {item.status === "Active" && (
                            <button
                              type="button"
                              className="boosted-posts-actions__pause"
                              onClick={() => openConfirmDialog(item.id, "pause")}
                            >
                              Pause
                            </button>
                          )}

                          {item.status === "Paused" && (
                            <button
                              type="button"
                              className="boosted-posts-actions__resume"
                              onClick={() => openConfirmDialog(item.id, "resume")}
                            >
                              Resume
                            </button>
                          )}

                          {(item.status === "Scheduled" ||
                            item.status === "Active" ||
                            item.status === "Paused") && (
                            <button
                              type="button"
                              className="boosted-posts-actions__close"
                              onClick={() => openConfirmDialog(item.id, "close")}
                            >
                              Close
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
                Page {page} of {totalPages}
              </span>

              <div className="boosted-posts-pagination__actions">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </SectionCard>

      <BaseModal
        isOpen={isViewModalOpen}
        title="Boosted Campaign Details"
        description="Review operational delivery metrics, optimization ownership, and campaign notes."
        onClose={closeViewModal}
        maxWidth="760px"
      >
        {selectedPost ? (
          <div className="boosted-posts-modal__content">
            <div className="boosted-posts-modal__grid">
              <div className="boosted-posts-modal__field">
                <label>Campaign Code</label>
                <input type="text" value={selectedPost.campaignCode} disabled />
              </div>

              <div className="boosted-posts-modal__field">
                <label>Post Title</label>
                <input type="text" value={selectedPost.postTitle} disabled />
              </div>

              <div className="boosted-posts-modal__field">
                <label>Owner</label>
                <input type="text" value={selectedPost.ownerName} disabled />
              </div>

              <div className="boosted-posts-modal__field">
                <label>Assigned Operator</label>
                <input
                  type="text"
                  value={selectedPost.assignedOperator}
                  disabled
                />
              </div>

              <div className="boosted-posts-modal__field">
                <label>Placement Slot</label>
                <input type="text" value={selectedPost.slot} disabled />
              </div>

              <div className="boosted-posts-modal__field">
                <label>Campaign Status</label>
                <input type="text" value={selectedPost.status} disabled />
              </div>

              <div className="boosted-posts-modal__field">
                <label>Delivery Health</label>
                <input
                  type="text"
                  value={selectedPost.deliveryHealth}
                  disabled
                />
              </div>

              <div className="boosted-posts-modal__field">
                <label>Review Status</label>
                <input
                  type="text"
                  value={selectedPost.reviewStatus}
                  disabled
                />
              </div>

              <div className="boosted-posts-modal__field">
                <label>Package Context</label>
                <input type="text" value={selectedPost.packageName} disabled />
              </div>

              <div className="boosted-posts-modal__field">
                <label>Delivery Window</label>
                <input
                  type="text"
                  value={`${selectedPost.startDate} to ${selectedPost.endDate}`}
                  disabled
                />
              </div>

              <div className="boosted-posts-modal__field">
                <label>Quota Used</label>
                <input
                  type="text"
                  value={formatQuotaUsage(
                    selectedPost.usedQuota,
                    selectedPost.totalQuota,
                  )}
                  disabled
                />
              </div>

              <div className="boosted-posts-modal__field">
                <label>CTR</label>
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
                <label>Impressions</label>
                <input
                  type="text"
                  value={selectedPost.impressions.toLocaleString("en-US")}
                  disabled
                />
              </div>

              <div className="boosted-posts-modal__field">
                <label>Clicks</label>
                <input
                  type="text"
                  value={selectedPost.clicks.toLocaleString("en-US")}
                  disabled
                />
              </div>

              <div className="boosted-posts-modal__field boosted-posts-modal__field--full">
                <label>Last Optimized</label>
                <input
                  type="text"
                  value={selectedPost.lastOptimizedAt}
                  disabled
                />
              </div>
            </div>

            <div className="boosted-posts-modal__field">
              <label>Notes</label>
              <textarea value={selectedPost.notes} rows={4} disabled />
            </div>

            <div className="boosted-posts-modal__actions">
              <button
                type="button"
                className="boosted-posts-modal__close"
                onClick={closeViewModal}
              >
                Close
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
            : "Confirm Action"
        }
        message={
          confirmState.action
            ? confirmMessageMap[confirmState.action]
            : "Please confirm this action."
        }
        confirmText={
          confirmState.action === "pause"
            ? "Pause Campaign"
            : confirmState.action === "resume"
              ? "Resume Campaign"
              : "Close Campaign"
        }
        cancelText="Cancel"
        tone={
          confirmState.action === "resume"
            ? "success"
            : confirmState.action === "pause"
              ? "neutral"
              : "danger"
        }
        onConfirm={handleConfirmAction}
        onCancel={closeConfirmDialog}
      />

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default BoostedPostsPage;
