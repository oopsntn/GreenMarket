import { useMemo, useState } from "react";
import BaseModal from "../components/BaseModal";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { boostedPostService } from "../services/boostedPostService";
import type {
  BoostedPost,
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

function BoostedPostsPage() {
  const [posts, setPosts] = useState<BoostedPost[]>(
    boostedPostService.getBoostedPosts(),
  );
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedSlotFilter, setSelectedSlotFilter] = useState<
    BoostedPostSlot | "All"
  >("All");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<
    BoostedPostStatus | "All"
  >("All");

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
        item.postTitle.toLowerCase().includes(keyword) ||
        item.ownerName.toLowerCase().includes(keyword) ||
        item.packageName.toLowerCase().includes(keyword);

      const matchesSlot =
        selectedSlotFilter === "All" || item.slot === selectedSlotFilter;

      const matchesStatus =
        selectedStatusFilter === "All" || item.status === selectedStatusFilter;

      return matchesKeyword && matchesSlot && matchesStatus;
    });
  }, [posts, searchKeyword, selectedSlotFilter, selectedStatusFilter]);

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
        `${targetPost.postTitle} has been paused successfully.`,
        "info",
      );
    } else if (confirmState.action === "resume") {
      showToast(`${targetPost.postTitle} has been resumed successfully.`);
    } else {
      showToast(
        `${targetPost.postTitle} has been closed successfully.`,
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
      confirmPost?.postTitle ?? "this boosted post"
    }? Delivery will stop until the campaign is resumed.`,
    resume: `Are you sure you want to resume ${
      confirmPost?.postTitle ?? "this boosted post"
    }? The campaign will continue using the assigned package and slot.`,
    close: `Are you sure you want to close ${
      confirmPost?.postTitle ?? "this boosted post"
    }? This campaign will be marked as closed and no longer run.`,
  };

  const renderStatusVariant = (status: BoostedPostStatus) => {
    if (status === "Active") return "active";
    if (status === "Scheduled") return "pending";
    if (status === "Paused") return "paused";
    return "expired";
  };

  return (
    <div className="boosted-posts-page">
      <PageHeader
        title="Boosted Posts Management"
        description="Monitor scheduled, active, paused, and completed boosted post campaigns across all promotion slots."
      />

      <div className="boosted-posts-summary-grid">
        {summaryCards.map((card) => (
          <div key={card.title} className="boosted-posts-summary-card">
            <span className="boosted-posts-summary-card__label">
              {card.title}
            </span>
            <strong className="boosted-posts-summary-card__value">
              {card.value}
            </strong>
            <p className="boosted-posts-summary-card__subtitle">
              {card.subtitle}
            </p>
          </div>
        ))}
      </div>

      <SectionCard
        title="Campaign Filters"
        description="Search and refine boosted campaigns by slot and delivery status."
      >
        <div className="boosted-posts-filters">
          <div className="boosted-posts-filters__field boosted-posts-filters__field--search">
            <label htmlFor="boosted-post-search">Search</label>
            <input
              id="boosted-post-search"
              type="text"
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder="Search by post title, owner, or package"
            />
          </div>

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
            <label htmlFor="boosted-post-status-filter">Status</label>
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
        </div>
      </SectionCard>

      <SectionCard
        title="Boosted Campaign Directory"
        description="Review campaign owner, slot assignment, package coverage, delivery status, and quota usage."
      >
        {filteredPosts.length === 0 ? (
          <EmptyState
            title="No boosted campaigns found"
            description="No boosted campaigns match the current search or filter settings."
          />
        ) : (
          <div className="boosted-posts-table-wrapper">
            <table className="boosted-posts-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Post Title</th>
                  <th>Owner</th>
                  <th>Slot</th>
                  <th>Package</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Remaining Quota</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredPosts.map((item) => (
                  <tr key={item.id}>
                    <td>#{item.id}</td>
                    <td>{item.postTitle}</td>
                    <td>{item.ownerName}</td>
                    <td>
                      <StatusBadge label={item.slot} variant="slot" />
                    </td>
                    <td>{item.packageName}</td>
                    <td>{item.startDate}</td>
                    <td>{item.endDate}</td>
                    <td>
                      <StatusBadge
                        label={item.status}
                        variant={renderStatusVariant(item.status)}
                      />
                    </td>
                    <td>{item.remainingQuota.toLocaleString("en-US")}</td>
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
        )}
      </SectionCard>

      <BaseModal
        isOpen={isViewModalOpen}
        title="Boosted Campaign Details"
        description="Review package assignment, slot placement, delivery metrics, and campaign notes."
        onClose={closeViewModal}
        maxWidth="760px"
      >
        {selectedPost ? (
          <div className="boosted-posts-modal__content">
            <div className="boosted-posts-modal__grid">
              <div className="boosted-posts-modal__field">
                <label>Post Title</label>
                <input type="text" value={selectedPost.postTitle} disabled />
              </div>

              <div className="boosted-posts-modal__field">
                <label>Owner</label>
                <input type="text" value={selectedPost.ownerName} disabled />
              </div>

              <div className="boosted-posts-modal__field">
                <label>Slot</label>
                <input type="text" value={selectedPost.slot} disabled />
              </div>

              <div className="boosted-posts-modal__field">
                <label>Package</label>
                <input type="text" value={selectedPost.packageName} disabled />
              </div>

              <div className="boosted-posts-modal__field">
                <label>Start Date</label>
                <input type="text" value={selectedPost.startDate} disabled />
              </div>

              <div className="boosted-posts-modal__field">
                <label>End Date</label>
                <input type="text" value={selectedPost.endDate} disabled />
              </div>

              <div className="boosted-posts-modal__field">
                <label>Status</label>
                <input type="text" value={selectedPost.status} disabled />
              </div>

              <div className="boosted-posts-modal__field">
                <label>Remaining Quota</label>
                <input
                  type="text"
                  value={selectedPost.remainingQuota.toLocaleString("en-US")}
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
