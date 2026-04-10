import { useEffect, useMemo, useState } from "react";
import BaseModal from "../components/BaseModal";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { placementSlotService } from "../services/placementSlotService";
import type {
  PlacementSlot,
  PlacementSlotFormState,
  PlacementSlotScope,
  PlacementSlotStatus,
} from "../types/placementSlot";
import "./PlacementSlotsPage.css";

type ConfirmAction = "disable" | "enable";

type ConfirmState = {
  isOpen: boolean;
  slotId: number | null;
  action: ConfirmAction | null;
};

const scopeFilterOptions: Array<PlacementSlotScope | "All"> = [
  "All",
  "Homepage",
  "Category",
  "Search",
];

const statusFilterOptions: Array<PlacementSlotStatus | "All"> = [
  "All",
  "Active",
  "Disabled",
];

const PAGE_SIZE = 5;

function PlacementSlotsPage() {
  const [slots, setSlots] = useState<PlacementSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState<number | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedScopeFilter, setSelectedScopeFilter] = useState<
    PlacementSlotScope | "All"
  >("All");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<
    PlacementSlotStatus | "All"
  >("All");
  const [page, setPage] = useState(1);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedSlot, setSelectedSlot] = useState<PlacementSlot | null>(null);
  const [formData, setFormData] = useState<PlacementSlotFormState>(
    placementSlotService.getEmptyForm(),
  );
  const [formError, setFormError] = useState("");

  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    slotId: null,
    action: null,
  });

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const summaryCards = placementSlotService.getSummaryCards(slots);

  useEffect(() => {
    const loadPlacementSlots = async () => {
      try {
        setIsLoading(true);
        setPageError("");
        const nextSlots = await placementSlotService.getPlacementSlots();
        setSlots(nextSlots);
      } catch (error) {
        setPageError(
          error instanceof Error
            ? error.message
            : "Failed to load placement slots.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadPlacementSlots();
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

  const filteredSlots = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return slots.filter((slot) => {
      const matchesKeyword =
        !keyword ||
        slot.name.toLowerCase().includes(keyword) ||
        slot.positionCode.toLowerCase().includes(keyword) ||
        slot.displayRule.toLowerCase().includes(keyword);

      const matchesScope =
        selectedScopeFilter === "All" || slot.scope === selectedScopeFilter;

      const matchesStatus =
        selectedStatusFilter === "All" || slot.status === selectedStatusFilter;

      return matchesKeyword && matchesScope && matchesStatus;
    });
  }, [slots, searchKeyword, selectedScopeFilter, selectedStatusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredSlots.length / PAGE_SIZE));

  const paginatedSlots = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredSlots.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredSlots, page]);

  useEffect(() => {
    setPage(1);
  }, [searchKeyword, selectedScopeFilter, selectedStatusFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const openViewModal = (slot: PlacementSlot) => {
    setSelectedSlot(slot);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setSelectedSlot(null);
    setIsViewModalOpen(false);
  };

  const openAddModal = () => {
    setModalMode("add");
    setSelectedSlot(null);
    setFormData(placementSlotService.getEmptyForm());
    setFormError("");
    setIsFormModalOpen(true);
  };

  const openEditModal = (slot: PlacementSlot) => {
    setModalMode("edit");
    setSelectedSlot(slot);
    setFormData({
      name: slot.name,
      scope: slot.scope,
      positionCode: slot.positionCode,
      capacity: slot.capacity,
      displayRule: slot.displayRule,
      priority: slot.priority,
      notes: slot.notes,
    });
    setFormError("");
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setSelectedSlot(null);
    setFormError("");
    setIsFormModalOpen(false);
  };

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "capacity" || name === "priority" ? Number(value) : value,
    }));

    if (formError) {
      setFormError("");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      if (modalMode === "add") {
        const nextSlots = await placementSlotService.createPlacementSlot(
          slots,
          formData,
        );
        setSlots(nextSlots);
        showToast("Placement slot added successfully.");
      }

      if (modalMode === "edit" && selectedSlot) {
        const nextSlots = await placementSlotService.updatePlacementSlot(
          slots,
          selectedSlot.id,
          formData,
        );
        setSlots(nextSlots);
        showToast("Placement slot updated successfully.");
      }

      closeFormModal();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to save placement slot.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openConfirmDialog = (slotId: number, action: ConfirmAction) => {
    setConfirmState({
      isOpen: true,
      slotId,
      action,
    });
  };

  const closeConfirmDialog = () => {
    setConfirmState({
      isOpen: false,
      slotId: null,
      action: null,
    });
  };

  const confirmSlot =
    confirmState.slotId !== null
      ? (slots.find((slot) => slot.id === confirmState.slotId) ?? null)
      : null;

  const handleConfirmAction = async () => {
    if (confirmState.slotId === null || confirmState.action === null) return;

    const slotId = confirmState.slotId;

    const targetSlot = slots.find((slot) => slot.id === slotId);
    if (!targetSlot) {
      closeConfirmDialog();
      return;
    }

    const nextStatus: PlacementSlotStatus =
      confirmState.action === "disable" ? "Disabled" : "Active";

    try {
      setIsStatusUpdating(slotId);
      const nextSlots = await placementSlotService.updatePlacementSlotStatus(
        slots,
        slotId,
        nextStatus,
      );
      setSlots(nextSlots);

      if (selectedSlot?.id === slotId) {
        setSelectedSlot(
          nextSlots.find((item) => item.id === slotId) ?? selectedSlot,
        );
      }

      if (confirmState.action === "disable") {
        showToast(`${targetSlot.name} has been disabled successfully.`, "info");
      } else {
        showToast(`${targetSlot.name} has been enabled successfully.`);
      }

      closeConfirmDialog();
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Failed to update placement slot status.",
        "error",
      );
    } finally {
      setIsStatusUpdating(null);
    }
  };

  const confirmTitle =
    confirmState.action === "disable"
      ? "Disable Placement Slot"
      : "Enable Placement Slot";

  const confirmMessage =
    confirmState.action === "disable"
      ? `Are you sure you want to disable ${
          confirmSlot?.name ?? "this placement slot"
        }? It will no longer be available for boosted post allocation.`
      : `Are you sure you want to enable ${
          confirmSlot?.name ?? "this placement slot"
        }? It will become available again for package allocation.`;

  return (
    <div className="placement-slots-page">
      <PageHeader
        title="Placement Slot Management"
        description="Manage premium display positions used for boosted posts across homepage, category, and search experiences."
        actionLabel="+ Add Slot"
        onActionClick={openAddModal}
      />

      <div className="placement-slots-summary-grid">
        {summaryCards.map((card) => (
          <div key={card.title} className="placement-slots-summary-card">
            <span className="placement-slots-summary-card__label">
              {card.title}
            </span>
            <strong className="placement-slots-summary-card__value">
              {card.value}
            </strong>
            <p className="placement-slots-summary-card__subtitle">
              {card.subtitle}
            </p>
          </div>
        ))}
      </div>

      <SectionCard
        title="Slot Filters"
        description="Search and refine slots by scope and availability status."
      >
        <div className="placement-slots-filters">
          <div className="placement-slots-filters__field placement-slots-filters__field--search">
            <label htmlFor="placement-slot-search">Search</label>
            <input
              id="placement-slot-search"
              type="text"
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder="Search by slot name, code, or display rule"
            />
          </div>

          <div className="placement-slots-filters__field">
            <label htmlFor="slot-scope-filter">Scope</label>
            <select
              id="slot-scope-filter"
              value={selectedScopeFilter}
              onChange={(event) =>
                setSelectedScopeFilter(
                  event.target.value as PlacementSlotScope | "All",
                )
              }
            >
              {scopeFilterOptions.map((scope) => (
                <option key={scope} value={scope}>
                  {scope}
                </option>
              ))}
            </select>
          </div>

          <div className="placement-slots-filters__field">
            <label htmlFor="slot-status-filter">Status</label>
            <select
              id="slot-status-filter"
              value={selectedStatusFilter}
              onChange={(event) =>
                setSelectedStatusFilter(
                  event.target.value as PlacementSlotStatus | "All",
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
        title="Field Guide"
        description="These meanings help you read slot data consistently across packages, promotions, and analytics."
      >
        <div className="placement-slot-guide">
          <div className="placement-slot-guide__item">
            <strong>Scope</strong>
            <span>Where the placement appears: homepage, category pages, or search results.</span>
          </div>
          <div className="placement-slot-guide__item">
            <strong>Position Code</strong>
            <span>The unique technical key used by promotion packages, admin APIs, and analytics mappings.</span>
          </div>
          <div className="placement-slot-guide__item">
            <strong>Capacity</strong>
            <span>How many campaigns or boosted posts can share this slot at the same time.</span>
          </div>
          <div className="placement-slot-guide__item">
            <strong>Display Rule</strong>
            <span>The ordering logic used when multiple eligible campaigns compete inside the same slot.</span>
          </div>
          <div className="placement-slot-guide__item">
            <strong>Priority</strong>
            <span>The ranking weight used when the rule depends on manual ordering or priority scoring.</span>
          </div>
          <div className="placement-slot-guide__item">
            <strong>Notes</strong>
            <span>Internal operational notes for admins, exceptions, or campaign handling reminders.</span>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Placement Slot Directory"
        description="Review slot scope, capacity, display rule, priority, and current status. Analytics only charts the slots that actually generated traffic in the selected date range."
      >
        {isLoading ? (
          <EmptyState
            title="Loading placement slots"
            description="Fetching placement slot records from the admin API."
          />
        ) : pageError ? (
          <EmptyState title="Unable to load placement slots" description={pageError} />
        ) : filteredSlots.length === 0 ? (
          <EmptyState
            title="No placement slots found"
            description="No placement slots match the current search or filter settings."
          />
        ) : (
          <>
            <div className="placement-slots-table-wrapper">
              <table className="placement-slots-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Slot Name</th>
                    <th>Scope</th>
                    <th>Position Code</th>
                    <th>Capacity</th>
                    <th>Display Rule</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedSlots.map((slot) => (
                    <tr key={slot.id}>
                      <td>#{slot.id}</td>
                      <td>{slot.name}</td>
                      <td>{slot.scope}</td>
                      <td>{slot.positionCode}</td>
                      <td>{slot.capacity}</td>
                      <td>{slot.displayRule}</td>
                      <td>{slot.priority}</td>
                      <td>
                        <StatusBadge
                          label={slot.status}
                          variant={
                            slot.status === "Active" ? "active" : "disabled"
                          }
                        />
                      </td>
                      <td>
                        <div className="placement-slots-actions">
                          <button
                            type="button"
                            className="placement-slots-actions__view"
                            onClick={() => openViewModal(slot)}
                          >
                            View
                          </button>

                          <button
                            type="button"
                            className="placement-slots-actions__edit"
                            onClick={() => openEditModal(slot)}
                          >
                            Edit
                          </button>

                          {slot.status === "Active" ? (
                            <button
                              type="button"
                              className="placement-slots-actions__disable"
                              onClick={() =>
                                openConfirmDialog(slot.id, "disable")
                              }
                              disabled={isStatusUpdating === slot.id}
                            >
                              Disable
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="placement-slots-actions__enable"
                              onClick={() => openConfirmDialog(slot.id, "enable")}
                              disabled={isStatusUpdating === slot.id}
                            >
                              Enable
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="placement-slots-pagination">
              <span className="placement-slots-pagination__info">
                Trang {page} / {totalPages}
              </span>

              <div className="placement-slots-pagination__actions">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
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
        title="Placement Slot Details"
        description="Review placement slot configuration, visibility rule, and operational notes."
        onClose={closeViewModal}
        maxWidth="720px"
      >
        {selectedSlot ? (
          <div className="placement-slots-modal__content">
            <div className="placement-slots-modal__grid">
              <div className="placement-slots-modal__field">
                <label>Slot Name</label>
                <input type="text" value={selectedSlot.name} disabled />
              </div>

              <div className="placement-slots-modal__field">
                <label>Scope</label>
                <input type="text" value={selectedSlot.scope} disabled />
              </div>

              <div className="placement-slots-modal__field">
                <label>Position Code</label>
                <input type="text" value={selectedSlot.positionCode} disabled />
              </div>

              <div className="placement-slots-modal__field">
                <label>Capacity</label>
                <input
                  type="text"
                  value={String(selectedSlot.capacity)}
                  disabled
                />
              </div>

              <div className="placement-slots-modal__field">
                <label>Display Rule</label>
                <input type="text" value={selectedSlot.displayRule} disabled />
              </div>

              <div className="placement-slots-modal__field">
                <label>Priority</label>
                <input
                  type="text"
                  value={String(selectedSlot.priority)}
                  disabled
                />
              </div>

              <div className="placement-slots-modal__field">
                <label>Status</label>
                <input type="text" value={selectedSlot.status} disabled />
              </div>
            </div>

            <div className="placement-slots-modal__field">
              <label>Notes</label>
              <textarea value={selectedSlot.notes} rows={4} disabled />
            </div>

            <div className="placement-slots-modal__actions">
              <button
                type="button"
                className="placement-slots-modal__close"
                onClick={closeViewModal}
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
      </BaseModal>

      <BaseModal
        isOpen={isFormModalOpen}
        title={
          modalMode === "add" ? "Add Placement Slot" : "Edit Placement Slot"
        }
        description={
          modalMode === "add"
            ? "Create a new placement slot with scope, capacity, rule, and priority."
            : "Update placement slot configuration and display behavior."
        }
        onClose={closeFormModal}
        maxWidth="720px"
      >
        <form className="placement-slots-form" onSubmit={handleSubmit}>
          <div className="placement-slots-form__guide">
            <p><strong>Scope</strong> controls where the slot is rendered.</p>
            <p><strong>Capacity</strong> sets how many campaigns can be shown in parallel.</p>
            <p><strong>Display Rule</strong> and <strong>Priority</strong> decide how those campaigns are ordered.</p>
          </div>

          <div className="placement-slots-modal__grid">
            <div className="placement-slots-modal__field">
              <label htmlFor="name">Slot Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="Enter slot name"
              />
            </div>

            <div className="placement-slots-modal__field">
              <label htmlFor="scope">Scope</label>
              <select
                id="scope"
                name="scope"
                value={formData.scope}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                <option>Homepage</option>
                <option>Category</option>
                <option>Search</option>
              </select>
            </div>

            <div className="placement-slots-modal__field">
              <label htmlFor="positionCode">Position Code</label>
              <input
                id="positionCode"
                name="positionCode"
                type="text"
                value={formData.positionCode}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="Enter unique position code"
              />
            </div>

            <div className="placement-slots-modal__field">
              <label htmlFor="capacity">Capacity</label>
              <input
                id="capacity"
                name="capacity"
                type="number"
                min={1}
                value={formData.capacity}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>

            <div className="placement-slots-modal__field">
              <label htmlFor="displayRule">Display Rule</label>
              <select
                id="displayRule"
                name="displayRule"
                value={formData.displayRule}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                <option>Round Robin</option>
                <option>First Purchased First Served</option>
                <option>Random</option>
                <option>Priority Score</option>
              </select>
            </div>

            <div className="placement-slots-modal__field">
              <label htmlFor="priority">Priority</label>
              <input
                id="priority"
                name="priority"
                type="number"
                min={1}
                value={formData.priority}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="placement-slots-modal__field">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              value={formData.notes}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="Enter operational notes for this slot"
            />
          </div>

          {formError ? (
            <p className="placement-slots-form__error">{formError}</p>
          ) : null}

          <div className="placement-slots-modal__actions">
            <button
              type="button"
              className="placement-slots-modal__close"
              onClick={closeFormModal}
              disabled={isSubmitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="placement-slots-modal__submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Saving..."
                : modalMode === "add"
                  ? "Add Slot"
                  : "Save Changes"}
            </button>
          </div>
        </form>
      </BaseModal>

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmTitle}
        message={confirmMessage}
        confirmText={
          confirmState.action === "disable" ? "Disable Slot" : "Enable Slot"
        }
        cancelText="Cancel"
        tone={confirmState.action === "disable" ? "danger" : "success"}
        onConfirm={handleConfirmAction}
        onCancel={closeConfirmDialog}
      />

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default PlacementSlotsPage;
