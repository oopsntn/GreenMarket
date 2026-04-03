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
  const [slots, setSlots] = useState<PlacementSlot[]>(
    placementSlotService.getPlacementSlots(),
  );
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      if (modalMode === "add") {
        setSlots((prev) =>
          placementSlotService.createPlacementSlot(prev, formData),
        );
        showToast("Placement slot added successfully.");
      }

      if (modalMode === "edit" && selectedSlot) {
        setSlots((prev) =>
          placementSlotService.updatePlacementSlot(
            prev,
            selectedSlot.id,
            formData,
          ),
        );
        showToast("Placement slot updated successfully.");
      }

      closeFormModal();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to save placement slot.",
      );
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

  const handleConfirmAction = () => {
    if (confirmState.slotId === null || confirmState.action === null) return;

    const slotId = confirmState.slotId;

    const targetSlot = slots.find((slot) => slot.id === slotId);
    if (!targetSlot) {
      closeConfirmDialog();
      return;
    }

    const nextStatus: PlacementSlotStatus =
      confirmState.action === "disable" ? "Disabled" : "Active";

    setSlots((prev) =>
      placementSlotService.updatePlacementSlotStatus(prev, slotId, nextStatus),
    );

    if (selectedSlot?.id === slotId) {
      setSelectedSlot((prev) =>
        prev
          ? {
              ...prev,
              status: nextStatus,
            }
          : null,
      );
    }

    if (confirmState.action === "disable") {
      showToast(`${targetSlot.name} has been disabled successfully.`, "info");
    } else {
      showToast(`${targetSlot.name} has been enabled successfully.`);
    }

    closeConfirmDialog();
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
        title="Placement Slot Directory"
        description="Review slot scope, capacity, display rule, priority, and current status."
      >
        {filteredSlots.length === 0 ? (
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
                            >
                              Disable
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="placement-slots-actions__enable"
                              onClick={() => openConfirmDialog(slot.id, "enable")}
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
                Page {page} of {totalPages}
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
          <div className="placement-slots-modal__grid">
            <div className="placement-slots-modal__field">
              <label htmlFor="name">Slot Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
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
              />
            </div>

            <div className="placement-slots-modal__field">
              <label htmlFor="displayRule">Display Rule</label>
              <select
                id="displayRule"
                name="displayRule"
                value={formData.displayRule}
                onChange={handleChange}
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
            >
              Cancel
            </button>

            <button type="submit" className="placement-slots-modal__submit">
              {modalMode === "add" ? "Add Slot" : "Save Changes"}
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
