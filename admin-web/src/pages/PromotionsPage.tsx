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
import { promotionPackageService } from "../services/promotionPackageService";
import { promotionService } from "../services/promotionService";
import type {
  Promotion,
  PromotionPackageActionPayload,
  PromotionPaymentStatus,
  PromotionSlot,
  PromotionStatus,
  PromotionSummaryCard,
} from "../types/promotion";
import "./PromotionsPage.css";

type ConfirmAction = "pause" | "resume";
type ActionModalMode = "change" | "reopen";

type ConfirmState = {
  isOpen: boolean;
  promotionId: number | null;
  action: ConfirmAction | null;
};

type PackageActionFormState = {
  slot: PromotionSlot;
  packageId: string;
  startDate: string;
  endDate: string;
  paymentStatus: PromotionPaymentStatus;
  adminNote: string;
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

const DEFAULT_REOPEN_START_DATE = "2026-04-01";
const PAGE_SIZE = 5;

const formatDateInput = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const calculateEndDate = (startDate: string, durationDays: number) => {
  if (!startDate) return "";

  const date = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return startDate;

  date.setDate(date.getDate() + Math.max(durationDays - 1, 0));
  return formatDateInput(date);
};

function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>(
    promotionService.getPromotions(),
  );
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionModalMode, setActionModalMode] = useState<ActionModalMode | null>(
    null,
  );
  const [actionPromotionId, setActionPromotionId] = useState<number | null>(
    null,
  );
  const [actionFormData, setActionFormData] = useState<PackageActionFormState>({
    slot: "Home Top",
    packageId: "",
    startDate: "",
    endDate: "",
    paymentStatus: "Paid",
    adminNote: "",
  });
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
  const activePackages = promotionPackageService.getActivePromotionPackages();

  const summaryCards: PromotionSummaryCard[] =
    promotionService.getSummaryCards(promotions);
  const actionTargetPromotion =
    actionPromotionId !== null
      ? (promotions.find((item) => item.id === actionPromotionId) ?? null)
      : null;
  const availablePackages = useMemo(() => {
    return activePackages.filter((item) => item.slot === actionFormData.slot);
  }, [actionFormData.slot, activePackages]);
  const selectedActionPackage =
    availablePackages.find(
      (item) => item.id === Number(actionFormData.packageId),
    ) ?? null;

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

  const getPreferredPackage = (promotion: Promotion) => {
    return (
      activePackages.find((item) => item.id === promotion.packageId) ??
      activePackages.find((item) => item.slot === promotion.slot) ??
      activePackages[0] ??
      null
    );
  };

  const openChangePackageModal = (promotion: Promotion) => {
    const preferredPackage = getPreferredPackage(promotion);
    if (!preferredPackage) {
      showToast("No active promotion packages are available right now.", "error");
      return;
    }

    setActionPromotionId(promotion.id);
    setActionModalMode("change");
    setActionFormData({
      slot: preferredPackage.slot,
      packageId: String(preferredPackage.id),
      startDate: promotion.startDate,
      endDate: promotion.endDate,
      paymentStatus: promotion.paymentStatus,
      adminNote: promotion.note,
    });
    setIsActionModalOpen(true);
  };

  const openReopenModal = (promotion: Promotion) => {
    if (!promotionService.canReopenPromotion(promotion)) {
      showToast(
        promotionService.getActionBlockedReason(promotion, "reopen"),
        "error",
      );
      return;
    }

    const preferredPackage = getPreferredPackage(promotion);
    if (!preferredPackage) {
      showToast("No active promotion packages are available right now.", "error");
      return;
    }

    setActionPromotionId(promotion.id);
    setActionModalMode("reopen");
    setActionFormData({
      slot: preferredPackage.slot,
      packageId: String(preferredPackage.id),
      startDate: DEFAULT_REOPEN_START_DATE,
      endDate: calculateEndDate(
        DEFAULT_REOPEN_START_DATE,
        preferredPackage.durationDays,
      ),
      paymentStatus: "Paid",
      adminNote: `Admin reopened package after confirming payment from ${promotion.owner}.`,
    });
    setIsActionModalOpen(true);
  };

  const closeActionModal = () => {
    setActionPromotionId(null);
    setActionModalMode(null);
    setIsActionModalOpen(false);
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

      const nextPromotions = promotionService.updatePromotionStatus(
        promotions,
        targetPromotion.id,
        "Paused",
      );

      setPromotions(nextPromotions);

      showToast(
        `${targetPromotion.postTitle} has been paused successfully.`,
        "info",
      );

      if (selectedPromotion?.id === targetPromotion.id) {
        setSelectedPromotion(
          nextPromotions.find((item) => item.id === targetPromotion.id) ?? null,
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

      const nextPromotions = promotionService.updatePromotionStatus(
        promotions,
        targetPromotion.id,
        "Active",
      );

      setPromotions(nextPromotions);

      showToast(`${targetPromotion.postTitle} has been resumed successfully.`);

      if (selectedPromotion?.id === targetPromotion.id) {
        setSelectedPromotion(
          nextPromotions.find((item) => item.id === targetPromotion.id) ?? null,
        );
      }
    }

    closeConfirmDialog();
  };

  const handlePackageActionChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = event.target;

    setActionFormData((prev) => {
      if (name === "slot") {
        const nextSlot = value as PromotionSlot;
        const nextPackage = activePackages.find((item) => item.slot === nextSlot);

        return {
          ...prev,
          slot: nextSlot,
          packageId: nextPackage ? String(nextPackage.id) : "",
          endDate: nextPackage
            ? calculateEndDate(prev.startDate, nextPackage.durationDays)
            : prev.endDate,
        };
      }

      if (name === "packageId") {
        const nextPackage = activePackages.find(
          (item) => item.id === Number(value),
        );

        return {
          ...prev,
          packageId: value,
          slot: nextPackage?.slot ?? prev.slot,
          endDate: nextPackage
            ? calculateEndDate(prev.startDate, nextPackage.durationDays)
            : prev.endDate,
        };
      }

      if (name === "startDate") {
        return {
          ...prev,
          startDate: value,
          endDate: selectedActionPackage
            ? calculateEndDate(value, selectedActionPackage.durationDays)
            : prev.endDate,
        };
      }

      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handlePackageActionSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!actionTargetPromotion || !selectedActionPackage) {
      showToast("Please choose a valid package before continuing.", "error");
      return;
    }

    if (actionModalMode === "reopen" && actionFormData.paymentStatus !== "Paid") {
      showToast(
        "Admin can reopen an expired package only after payment is confirmed.",
        "error",
      );
      return;
    }

    const payload: PromotionPackageActionPayload = {
      packageId: selectedActionPackage.id,
      packageName: selectedActionPackage.name,
      slot: selectedActionPackage.slot,
      startDate: actionFormData.startDate,
      endDate: actionFormData.endDate,
      budget: selectedActionPackage.price,
      paymentStatus: actionFormData.paymentStatus,
      adminNote: actionFormData.adminNote,
    };

    const nextPromotions =
      actionModalMode === "reopen"
        ? promotionService.reopenPromotion(
            promotions,
            actionTargetPromotion.id,
            payload,
          )
        : promotionService.changePromotionPackage(
            promotions,
            actionTargetPromotion.id,
            payload,
          );

    setPromotions(nextPromotions);

    if (selectedPromotion?.id === actionTargetPromotion.id) {
      setSelectedPromotion(
        nextPromotions.find((item) => item.id === actionTargetPromotion.id) ??
          null,
      );
    }

    showToast(
      actionModalMode === "reopen"
        ? `${actionTargetPromotion.postTitle} has been reopened by admin.`
        : `${actionTargetPromotion.postTitle} has been moved to ${selectedActionPackage.name}.`,
    );

    closeActionModal();
  };


  return (
    <div className="promotions-page">
      <PageHeader
        title="Promotions Management"
        description="Manage purchased promotion packages, verify payment state, handle package changes, and reopen expired packages when admin confirms customer payment."
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
        filterLabel="Filter by slot & status"
        filterSummary={`Current filters: ${selectedSlotFilter} • ${selectedStatusFilter}`}
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
        description="Review billing state, package window, admin handling, and status for each purchased promotion."
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
                    <th>Billing</th>
                    <th>Delivery Window</th>
                    <th>Handled By</th>
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
                      <td>
                        <div className="promotions-cell">
                          <StatusBadge
                            label={promotion.paymentStatus}
                            variant={
                              promotion.paymentStatus === "Paid"
                                ? "success"
                                : "processing"
                            }
                          />
                          <span>{promotion.budget}</span>
                        </div>
                      </td>
                      <td>
                        <div className="promotions-cell">
                          <strong>{promotion.startDate}</strong>
                          <span>{promotion.endDate}</span>
                        </div>
                      </td>
                      <td>{promotion.handledBy}</td>
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
                            <>
                              <button
                                type="button"
                                className="promotions-actions__pause"
                                onClick={() =>
                                  handleActionClick(promotion, "pause")
                                }
                              >
                                Pause
                              </button>
                              <button
                                type="button"
                                className="promotions-actions__change"
                                onClick={() => openChangePackageModal(promotion)}
                              >
                                Change Package
                              </button>
                            </>
                          ) : promotion.status === "Paused" ? (
                            <>
                              <button
                                type="button"
                                className="promotions-actions__resume"
                                onClick={() =>
                                  handleActionClick(promotion, "resume")
                                }
                              >
                                Resume
                              </button>
                              <button
                                type="button"
                                className="promotions-actions__change"
                                onClick={() => openChangePackageModal(promotion)}
                              >
                                Change Package
                              </button>
                            </>
                          ) : promotion.status === "Scheduled" ? (
                            <>
                              <button
                                type="button"
                                className="promotions-actions__change"
                                onClick={() => openChangePackageModal(promotion)}
                              >
                                Change Package
                              </button>
                              <button
                                type="button"
                                className="promotions-actions__disabled"
                                disabled
                                title="Scheduled promotions have not started yet."
                              >
                                Upcoming
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className={
                                promotionService.canReopenPromotion(promotion)
                                  ? "promotions-actions__reopen"
                                  : "promotions-actions__disabled"
                              }
                              onClick={() => openReopenModal(promotion)}
                              disabled={
                                !promotionService.canReopenPromotion(promotion)
                              }
                              title={
                                !promotionService.canReopenPromotion(promotion)
                                  ? promotionService.getActionBlockedReason(
                                      promotion,
                                      "reopen",
                                    )
                                  : "Reopen this expired promotion"
                              }
                            >
                              Reopen
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
        description="Review package setup, placement schedule, payment confirmation, and current runtime status."
        onClose={closeModal}
        maxWidth="820px"
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
                <label>Payment Status</label>
                <input
                  type="text"
                  value={selectedPromotion.paymentStatus}
                  disabled
                />
              </div>

              <div className="promotions-modal__field">
                <label>Handled By</label>
                <input type="text" value={selectedPromotion.handledBy} disabled />
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

            {selectedPromotion.status === "Expired" &&
              !promotionService.canReopenPromotion(selectedPromotion) && (
                <div className="promotions-modal__notice">
                  {promotionService.getActionBlockedReason(
                    selectedPromotion,
                    "reopen",
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
                <>
                  <button
                    type="button"
                    className="promotions-modal__change"
                    onClick={() => openChangePackageModal(selectedPromotion)}
                  >
                    Change Package
                  </button>
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
                </>
              ) : selectedPromotion.status === "Paused" ? (
                <>
                  <button
                    type="button"
                    className="promotions-modal__change"
                    onClick={() => openChangePackageModal(selectedPromotion)}
                  >
                    Change Package
                  </button>
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
                </>
              ) : selectedPromotion.status === "Scheduled" ? (
                <button
                  type="button"
                  className="promotions-modal__change"
                  onClick={() => openChangePackageModal(selectedPromotion)}
                >
                  Change Package
                </button>
              ) : (
                <button
                  type="button"
                  className="promotions-modal__reopen"
                  onClick={() => openReopenModal(selectedPromotion)}
                  disabled={
                    !promotionService.canReopenPromotion(selectedPromotion)
                  }
                  title={
                    !promotionService.canReopenPromotion(selectedPromotion)
                      ? promotionService.getActionBlockedReason(
                          selectedPromotion,
                          "reopen",
                        )
                      : "Reopen this expired promotion"
                  }
                >
                  Reopen Package
                </button>
              )}
            </div>
          </div>
        ) : null}
      </BaseModal>

      <BaseModal
        isOpen={isActionModalOpen}
        title={
          actionModalMode === "reopen"
            ? "Reopen Expired Package"
            : "Change Promotion Package"
        }
        description={
          actionModalMode === "reopen"
            ? "Confirm payment, choose the replacement package, and reopen the campaign as admin."
            : "Move the customer to another package and update the delivery schedule from admin."
        }
        onClose={closeActionModal}
        maxWidth="760px"
      >
        {actionTargetPromotion ? (
          <form
            className="promotions-package-form"
            onSubmit={handlePackageActionSubmit}
          >
            <div className="promotions-modal__grid">
              <div className="promotions-modal__field">
                <label htmlFor="slot">Placement Slot</label>
                <select
                  id="slot"
                  name="slot"
                  value={actionFormData.slot}
                  onChange={handlePackageActionChange}
                >
                  <option value="Home Top">Home Top</option>
                  <option value="Category Top">Category Top</option>
                  <option value="Search Boost">Search Boost</option>
                </select>
              </div>

              <div className="promotions-modal__field">
                <label htmlFor="packageId">Package</label>
                <select
                  id="packageId"
                  name="packageId"
                  value={actionFormData.packageId}
                  onChange={handlePackageActionChange}
                >
                  {availablePackages.map((item) => (
                    <option key={item.id} value={String(item.id)}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="promotions-modal__field">
                <label htmlFor="startDate">From Date</label>
                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={actionFormData.startDate}
                  onChange={handlePackageActionChange}
                />
              </div>

              <div className="promotions-modal__field">
                <label htmlFor="endDate">To Date</label>
                <input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={actionFormData.endDate}
                  onChange={handlePackageActionChange}
                />
              </div>

              <div className="promotions-modal__field">
                <label htmlFor="paymentStatus">Payment Status</label>
                <select
                  id="paymentStatus"
                  name="paymentStatus"
                  value={actionFormData.paymentStatus}
                  onChange={handlePackageActionChange}
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending Verification">
                    Pending Verification
                  </option>
                </select>
              </div>

              <div className="promotions-modal__field">
                <label>Updated Budget</label>
                <input
                  type="text"
                  value={selectedActionPackage?.price ?? ""}
                  disabled
                />
              </div>
            </div>

            <div className="promotions-modal__field">
              <label htmlFor="adminNote">Admin Note</label>
              <textarea
                id="adminNote"
                name="adminNote"
                rows={4}
                value={actionFormData.adminNote}
                onChange={handlePackageActionChange}
                placeholder="Explain why the package was changed or reopened"
              />
            </div>

            <div className="promotions-modal__actions">
              <button
                type="button"
                className="promotions-modal__close"
                onClick={closeActionModal}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={
                  actionModalMode === "reopen"
                    ? "promotions-modal__reopen"
                    : "promotions-modal__change"
                }
              >
                {actionModalMode === "reopen"
                  ? "Reopen Package"
                  : "Save Package Change"}
              </button>
            </div>
          </form>
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
