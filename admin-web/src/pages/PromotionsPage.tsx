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
import { promotionService } from "../services/promotionService";
import type {
  Promotion,
  PromotionSlot,
  PromotionStatus,
  PromotionSummaryCard,
} from "../types/promotion";
import "./PromotionsPage.css";

type ConfirmAction = "pause" | "resume";

type ConfirmState = {
  isOpen: boolean;
  promotionId: number | null;
  action: ConfirmAction | null;
};

const slotFilterOptions: Array<PromotionSlot | "All"> = [
  "All",
  "Home Top",
  "Category Top",
  "Search Boost",
];

const statusFilterOptions: Array<PromotionStatus | "All"> = [
  "All",
  "Scheduled",
  "Active",
  "Paused",
  "Expired",
];

const PAGE_SIZE = 5;

function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>(
    promotionService.getPromotions(),
  );
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSlotFilter, setSelectedSlotFilter] = useState<
    PromotionSlot | "All"
  >("All");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<
    PromotionStatus | "All"
  >("All");
  const [page, setPage] = useState(1);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    promotionId: null,
    action: null,
  });
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const summaryCards: PromotionSummaryCard[] =
    promotionService.getSummaryCards(promotions);

  const showToast = (message: string, tone: ToastItem["tone"] = "success") => {
    const toastId = Date.now() + Math.random();

    setToasts((prev) => [
      ...prev,
      {
        id: toastId,
        message,
        tone,
      },
    ]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
    }, 2600);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const openViewModal = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedPromotion(null);
    setIsModalOpen(false);
  };

  const openConfirmDialog = (promotionId: number, action: ConfirmAction) => {
    setConfirmState({
      isOpen: true,
      promotionId,
      action,
    });
  };

  const closeConfirmDialog = () => {
    setConfirmState({
      isOpen: false,
      promotionId: null,
      action: null,
    });
  };

  const filteredPromotions = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return promotions.filter((promotion) => {
      const matchesKeyword =
        !keyword ||
        promotion.postTitle.toLowerCase().includes(keyword) ||
        promotion.owner.toLowerCase().includes(keyword) ||
        promotion.packageName.toLowerCase().includes(keyword);

      const matchesSlot =
        selectedSlotFilter === "All" || promotion.slot === selectedSlotFilter;

      const matchesStatus =
        selectedStatusFilter === "All" ||
        promotion.status === selectedStatusFilter;

      return matchesKeyword && matchesSlot && matchesStatus;
    });
  }, [promotions, searchKeyword, selectedSlotFilter, selectedStatusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPromotions.length / PAGE_SIZE),
  );

  const paginatedPromotions = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredPromotions.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredPromotions, page]);

  useEffect(() => {
    setPage(1);
  }, [searchKeyword, selectedSlotFilter, selectedStatusFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const confirmPromotion =
    confirmState.promotionId !== null
      ? (promotions.find((item) => item.id === confirmState.promotionId) ??
        null)
      : null;

  const promotionLabel = confirmPromotion?.postTitle ?? "this promotion";

  const confirmTitleMap: Record<ConfirmAction, string> = {
    pause: "Pause Promotion",
    resume: "Resume Promotion",
  };

  const confirmMessageMap: Record<ConfirmAction, string> = {
    pause: `Are you sure you want to pause ${promotionLabel}? This promotion will stop running until it is resumed.`,
    resume: `Are you sure you want to resume ${promotionLabel}? This promotion will become active again.`,
  };

  const confirmButtonMap: Record<ConfirmAction, string> = {
    pause: "Pause Promotion",
    resume: "Resume Promotion",
  };

  const confirmToneMap: Record<
    ConfirmAction,
    "danger" | "success" | "neutral"
  > = {
    pause: "danger",
    resume: "success",
  };

  const handleActionClick = (promotion: Promotion, action: ConfirmAction) => {
    if (action === "pause") {
      if (!promotionService.canPausePromotion(promotion)) {
        showToast(
          promotionService.getActionBlockedReason(promotion, "pause"),
          "error",
        );
        return;
      }
    }

    if (action === "resume") {
      if (!promotionService.canResumePromotion(promotion)) {
        showToast(
          promotionService.getActionBlockedReason(promotion, "resume"),
          "error",
        );
        return;
      }
    }

    openConfirmDialog(promotion.id, action);
  };

  const handleConfirmAction = () => {
    if (confirmState.promotionId === null || confirmState.action === null)
      return;

    const targetPromotion = promotions.find(
      (item) => item.id === confirmState.promotionId,
    );
    if (!targetPromotion) {
      closeConfirmDialog();
      return;
    }

    if (confirmState.action === "pause") {
      if (!promotionService.canPausePromotion(targetPromotion)) {
        showToast(
          promotionService.getActionBlockedReason(targetPromotion, "pause"),
          "error",
        );
        closeConfirmDialog();
        return;
      }

      setPromotions((prev) =>
        promotionService.updatePromotionStatus(
          prev,
          targetPromotion.id,
          "Paused",
        ),
      );

      showToast(
        `${targetPromotion.postTitle} has been paused successfully.`,
        "info",
      );

      if (selectedPromotion?.id === targetPromotion.id) {
        setSelectedPromotion((prev) =>
          prev
            ? {
                ...prev,
                status: "Paused",
                canPause: false,
                canResume: true,
                pauseBlockedReason: "This promotion is already paused.",
                resumeBlockedReason: undefined,
              }
            : null,
        );
      }
    }

    if (confirmState.action === "resume") {
      if (!promotionService.canResumePromotion(targetPromotion)) {
        showToast(
          promotionService.getActionBlockedReason(targetPromotion, "resume"),
          "error",
        );
        closeConfirmDialog();
        return;
      }

      setPromotions((prev) =>
        promotionService.updatePromotionStatus(
          prev,
          targetPromotion.id,
          "Active",
        ),
      );

      showToast(`${targetPromotion.postTitle} has been resumed successfully.`);

      if (selectedPromotion?.id === targetPromotion.id) {
        setSelectedPromotion((prev) =>
          prev
            ? {
                ...prev,
                status: "Active",
                canPause: true,
                canResume: false,
                pauseBlockedReason: undefined,
                resumeBlockedReason:
                  "This promotion is already active and does not need resume action.",
              }
            : null,
        );
      }
    }

    closeConfirmDialog();
  };

  return (
    <div className="promotions-page">
      <PageHeader
        title="Promotions Management"
        description="Monitor boosted posts, placement slots, package windows, and admin intervention status."
      />

      <div className="promotions-summary-grid">
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
        placeholder="Search by post title, owner, or package"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
        onFilterClick={() => setShowFilters((prev) => !prev)}
      />

      {showFilters && (
        <SectionCard
          title="Promotion Filters"
          description="Refine promotion records by placement slot and runtime status."
        >
          <div className="promotions-filters">
            <div className="promotions-filters__field">
              <label htmlFor="promotion-slot-filter">Placement Slot</label>
              <select
                id="promotion-slot-filter"
                value={selectedSlotFilter}
                onChange={(event) =>
                  setSelectedSlotFilter(
                    event.target.value as PromotionSlot | "All",
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

            <div className="promotions-filters__field">
              <label htmlFor="promotion-status-filter">Status</label>
              <select
                id="promotion-status-filter"
                value={selectedStatusFilter}
                onChange={(event) =>
                  setSelectedStatusFilter(
                    event.target.value as PromotionStatus | "All",
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
      )}

      <SectionCard
        title="Promotion Directory"
        description="Review promoted posts, package details, schedule, and current status."
      >
        {filteredPromotions.length === 0 ? (
          <EmptyState
            title="No promotions found"
            description="No promotions match your current search or filter settings. Try another condition to continue."
          />
        ) : (
          <div className="promotions-directory">
            <div className="promotions-table-wrapper">
              <table className="promotions-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Post Title</th>
                    <th>Owner</th>
                    <th>Placement Slot</th>
                    <th>Package</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedPromotions.map((promotion) => (
                    <tr key={promotion.id}>
                      <td>#{promotion.id}</td>
                      <td>{promotion.postTitle}</td>
                      <td>{promotion.owner}</td>
                      <td>
                        <StatusBadge label={promotion.slot} variant="slot" />
                      </td>
                      <td>{promotion.packageName}</td>
                      <td>{promotion.startDate}</td>
                      <td>{promotion.endDate}</td>
                      <td>
                        <StatusBadge
                          label={promotion.status}
                          variant={
                            promotion.status === "Active"
                              ? "active"
                              : promotion.status === "Paused"
                                ? "paused"
                                : promotion.status === "Scheduled"
                                  ? "pending"
                                  : "expired"
                          }
                        />
                      </td>
                      <td>
                        <div className="promotions-actions">
                          <button
                            type="button"
                            className="promotions-actions__view"
                            onClick={() => openViewModal(promotion)}
                          >
                            View
                          </button>

                          {promotion.status === "Active" ? (
                            <button
                              type="button"
                              className="promotions-actions__pause"
                              onClick={() =>
                                handleActionClick(promotion, "pause")
                              }
                            >
                              Pause
                            </button>
                          ) : promotion.status === "Paused" ? (
                            <button
                              type="button"
                              className="promotions-actions__resume"
                              onClick={() =>
                                handleActionClick(promotion, "resume")
                              }
                            >
                              Resume
                            </button>
                          ) : promotion.status === "Scheduled" ? (
                            <button
                              type="button"
                              className="promotions-actions__disabled"
                              disabled
                              title="Scheduled promotions have not started yet."
                            >
                              Upcoming
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="promotions-actions__disabled"
                              disabled
                              title="Expired promotions are already closed."
                            >
                              Closed
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="promotions-pagination">
              <span className="promotions-pagination__info">
                Page {page} of {totalPages}
              </span>

              <div className="promotions-pagination__actions">
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
          </div>
        )}
      </SectionCard>

      <BaseModal
        isOpen={isModalOpen}
        title="Promotion Details"
        description="Review package setup, placement schedule, and current runtime status."
        onClose={closeModal}
        maxWidth="720px"
      >
        {selectedPromotion ? (
          <div className="promotions-modal__content">
            <div className="promotions-modal__grid">
              <div className="promotions-modal__field">
                <label>Post Title</label>
                <input
                  type="text"
                  value={selectedPromotion.postTitle}
                  disabled
                />
              </div>

              <div className="promotions-modal__field">
                <label>Owner</label>
                <input type="text" value={selectedPromotion.owner} disabled />
              </div>

              <div className="promotions-modal__field">
                <label>Placement Slot</label>
                <input type="text" value={selectedPromotion.slot} disabled />
              </div>

              <div className="promotions-modal__field">
                <label>Package</label>
                <input
                  type="text"
                  value={selectedPromotion.packageName}
                  disabled
                />
              </div>

              <div className="promotions-modal__field">
                <label>Start Date</label>
                <input
                  type="text"
                  value={selectedPromotion.startDate}
                  disabled
                />
              </div>

              <div className="promotions-modal__field">
                <label>End Date</label>
                <input type="text" value={selectedPromotion.endDate} disabled />
              </div>

              <div className="promotions-modal__field">
                <label>Status</label>
                <input type="text" value={selectedPromotion.status} disabled />
              </div>

              <div className="promotions-modal__field">
                <label>Budget</label>
                <input type="text" value={selectedPromotion.budget} disabled />
              </div>
            </div>

            <div className="promotions-modal__field">
              <label>Admin Note</label>
              <textarea value={selectedPromotion.note} rows={4} disabled />
            </div>

            {selectedPromotion.status === "Active" &&
              !promotionService.canPausePromotion(selectedPromotion) && (
                <div className="promotions-modal__notice">
                  {promotionService.getActionBlockedReason(
                    selectedPromotion,
                    "pause",
                  )}
                </div>
              )}

            {selectedPromotion.status === "Paused" &&
              !promotionService.canResumePromotion(selectedPromotion) && (
                <div className="promotions-modal__notice">
                  {promotionService.getActionBlockedReason(
                    selectedPromotion,
                    "resume",
                  )}
                </div>
              )}

            <div className="promotions-modal__actions">
              <button
                type="button"
                className="promotions-modal__close"
                onClick={closeModal}
              >
                Close
              </button>

              {selectedPromotion.status === "Active" ? (
                <button
                  type="button"
                  className="promotions-modal__pause"
                  onClick={() => handleActionClick(selectedPromotion, "pause")}
                  disabled={
                    !promotionService.canPausePromotion(selectedPromotion)
                  }
                  title={
                    !promotionService.canPausePromotion(selectedPromotion)
                      ? promotionService.getActionBlockedReason(
                          selectedPromotion,
                          "pause",
                        )
                      : "Pause this promotion"
                  }
                >
                  Pause Promotion
                </button>
              ) : selectedPromotion.status === "Paused" ? (
                <button
                  type="button"
                  className="promotions-modal__resume"
                  onClick={() => handleActionClick(selectedPromotion, "resume")}
                  disabled={
                    !promotionService.canResumePromotion(selectedPromotion)
                  }
                  title={
                    !promotionService.canResumePromotion(selectedPromotion)
                      ? promotionService.getActionBlockedReason(
                          selectedPromotion,
                          "resume",
                        )
                      : "Resume this promotion"
                  }
                >
                  Resume Promotion
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </BaseModal>

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={
          confirmState.action ? confirmTitleMap[confirmState.action] : "Confirm"
        }
        message={
          confirmState.action
            ? confirmMessageMap[confirmState.action]
            : "Please confirm this action."
        }
        confirmText={
          confirmState.action
            ? confirmButtonMap[confirmState.action]
            : "Confirm"
        }
        cancelText="Cancel"
        tone={
          confirmState.action ? confirmToneMap[confirmState.action] : "neutral"
        }
        onConfirm={handleConfirmAction}
        onCancel={closeConfirmDialog}
      />

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default PromotionsPage;
