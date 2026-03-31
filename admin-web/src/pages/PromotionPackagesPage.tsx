import { useMemo, useState } from "react";
import BaseModal from "../components/BaseModal";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { promotionPackageService } from "../services/promotionPackageService";
import type {
  PromotionPackage,
  PromotionPackageFormState,
  PromotionPackageSlot,
  PromotionPackageStatus,
} from "../types/promotionPackage";
import "./PromotionPackagesPage.css";

type ConfirmAction = "disable" | "enable";

type ConfirmState = {
  isOpen: boolean;
  packageId: number | null;
  action: ConfirmAction | null;
};

const slotFilterOptions: Array<PromotionPackageSlot | "All"> = [
  "All",
  "Home Top",
  "Category Top",
  "Search Boost",
];

const statusFilterOptions: Array<PromotionPackageStatus | "All"> = [
  "All",
  "Active",
  "Disabled",
];

function PromotionPackagesPage() {
  const [packages, setPackages] = useState<PromotionPackage[]>(
    promotionPackageService.getPromotionPackages(),
  );
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedSlotFilter, setSelectedSlotFilter] = useState<
    PromotionPackageSlot | "All"
  >("All");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<
    PromotionPackageStatus | "All"
  >("All");

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedPackage, setSelectedPackage] =
    useState<PromotionPackage | null>(null);
  const [formData, setFormData] = useState<PromotionPackageFormState>(
    promotionPackageService.getEmptyForm(),
  );
  const [formError, setFormError] = useState("");

  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    packageId: null,
    action: null,
  });

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const summaryCards = promotionPackageService.getSummaryCards(packages);

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

  const filteredPackages = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return packages.filter((item) => {
      const matchesKeyword =
        !keyword ||
        item.name.toLowerCase().includes(keyword) ||
        item.slot.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword);

      const matchesSlot =
        selectedSlotFilter === "All" || item.slot === selectedSlotFilter;

      const matchesStatus =
        selectedStatusFilter === "All" || item.status === selectedStatusFilter;

      return matchesKeyword && matchesSlot && matchesStatus;
    });
  }, [packages, searchKeyword, selectedSlotFilter, selectedStatusFilter]);

  const openViewModal = (item: PromotionPackage) => {
    setSelectedPackage(item);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setSelectedPackage(null);
    setIsViewModalOpen(false);
  };

  const openAddModal = () => {
    setModalMode("add");
    setSelectedPackage(null);
    setFormData(promotionPackageService.getEmptyForm());
    setFormError("");
    setIsFormModalOpen(true);
  };

  const openEditModal = (item: PromotionPackage) => {
    setModalMode("edit");
    setSelectedPackage(item);
    setFormData({
      name: item.name,
      slot: item.slot,
      durationDays: item.durationDays,
      price: item.price,
      maxPosts: item.maxPosts,
      displayQuota: item.displayQuota,
      description: item.description,
    });
    setFormError("");
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setSelectedPackage(null);
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
        name === "durationDays" ||
        name === "maxPosts" ||
        name === "displayQuota"
          ? Number(value)
          : value,
    }));

    if (formError) {
      setFormError("");
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      if (modalMode === "add") {
        setPackages((prev) =>
          promotionPackageService.createPromotionPackage(prev, formData),
        );
        showToast("Promotion package added successfully.");
      }

      if (modalMode === "edit" && selectedPackage) {
        setPackages((prev) =>
          promotionPackageService.updatePromotionPackage(
            prev,
            selectedPackage.id,
            formData,
          ),
        );
        showToast("Promotion package updated successfully.");
      }

      closeFormModal();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to save promotion package.",
      );
    }
  };

  const openConfirmDialog = (packageId: number, action: ConfirmAction) => {
    setConfirmState({
      isOpen: true,
      packageId,
      action,
    });
  };

  const closeConfirmDialog = () => {
    setConfirmState({
      isOpen: false,
      packageId: null,
      action: null,
    });
  };

  const confirmPackage =
    confirmState.packageId !== null
      ? (packages.find((item) => item.id === confirmState.packageId) ?? null)
      : null;

  const handleConfirmAction = () => {
    if (confirmState.packageId === null || confirmState.action === null) return;

    const packageId = confirmState.packageId;

    const targetPackage = packages.find((item) => item.id === packageId);
    if (!targetPackage) {
      closeConfirmDialog();
      return;
    }

    const nextStatus: PromotionPackageStatus =
      confirmState.action === "disable" ? "Disabled" : "Active";

    setPackages((prev) =>
      promotionPackageService.updatePromotionPackageStatus(
        prev,
        packageId,
        nextStatus,
      ),
    );

    if (selectedPackage?.id === packageId) {
      setSelectedPackage((prev) =>
        prev
          ? {
              ...prev,
              status: nextStatus,
            }
          : null,
      );
    }

    if (confirmState.action === "disable") {
      showToast(
        `${targetPackage.name} has been disabled successfully.`,
        "info",
      );
    } else {
      showToast(`${targetPackage.name} has been enabled successfully.`);
    }

    closeConfirmDialog();
  };

  const confirmTitle =
    confirmState.action === "disable"
      ? "Disable Promotion Package"
      : "Enable Promotion Package";

  const confirmMessage =
    confirmState.action === "disable"
      ? `Are you sure you want to disable ${
          confirmPackage?.name ?? "this promotion package"
        }? It will no longer be available for purchase.`
      : `Are you sure you want to enable ${
          confirmPackage?.name ?? "this promotion package"
        }? It will become available for sale again.`;

  return (
    <div className="promotion-packages-page">
      <PageHeader
        title="Promotion Package Management"
        description="Manage sellable promotion plans used for homepage, category, and search boosted post placements."
        actionLabel="+ Add Package"
        onActionClick={openAddModal}
      />

      <div className="promotion-packages-summary-grid">
        {summaryCards.map((card, index) => (
          <div
            key={card.title}
            className={
              index === 3
                ? "promotion-packages-summary-card promotion-packages-summary-card--compact"
                : "promotion-packages-summary-card"
            }
          >
            <span className="promotion-packages-summary-card__label">
              {card.title}
            </span>
            <strong className="promotion-packages-summary-card__value">
              {card.value}
            </strong>
            <p className="promotion-packages-summary-card__subtitle">
              {card.subtitle}
            </p>
          </div>
        ))}
      </div>

      <SectionCard
        title="Package Filters"
        description="Search and refine promotion packages by slot and sales status."
      >
        <div className="promotion-packages-filters">
          <div className="promotion-packages-filters__field promotion-packages-filters__field--search">
            <label htmlFor="promotion-package-search">Search</label>
            <input
              id="promotion-package-search"
              type="text"
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder="Search by package name, slot, or description"
            />
          </div>

          <div className="promotion-packages-filters__field">
            <label htmlFor="promotion-package-slot-filter">Slot</label>
            <select
              id="promotion-package-slot-filter"
              value={selectedSlotFilter}
              onChange={(event) =>
                setSelectedSlotFilter(
                  event.target.value as PromotionPackageSlot | "All",
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

          <div className="promotion-packages-filters__field">
            <label htmlFor="promotion-package-status-filter">Status</label>
            <select
              id="promotion-package-status-filter"
              value={selectedStatusFilter}
              onChange={(event) =>
                setSelectedStatusFilter(
                  event.target.value as PromotionPackageStatus | "All",
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
        title="Promotion Package Directory"
        description="Review package price, duration, slot assignment, quota, and sales availability."
      >
        {filteredPackages.length === 0 ? (
          <EmptyState
            title="No promotion packages found"
            description="No promotion packages match the current search or filter settings."
          />
        ) : (
          <div className="promotion-packages-table-wrapper">
            <table className="promotion-packages-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Package Name</th>
                  <th>Slot</th>
                  <th>Duration</th>
                  <th>Price</th>
                  <th>Max Posts</th>
                  <th>Quota</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredPackages.map((item) => (
                  <tr key={item.id}>
                    <td>#{item.id}</td>
                    <td>{item.name}</td>
                    <td>
                      <StatusBadge label={item.slot} variant="slot" />
                    </td>
                    <td>{item.durationDays} days</td>
                    <td>{item.price}</td>
                    <td>{item.maxPosts}</td>
                    <td>{item.displayQuota.toLocaleString("en-US")}</td>
                    <td>
                      <StatusBadge
                        label={item.status}
                        variant={
                          item.status === "Active" ? "active" : "disabled"
                        }
                      />
                    </td>
                    <td>
                      <div className="promotion-packages-actions">
                        <button
                          type="button"
                          className="promotion-packages-actions__view"
                          onClick={() => openViewModal(item)}
                        >
                          View
                        </button>

                        <button
                          type="button"
                          className="promotion-packages-actions__edit"
                          onClick={() => openEditModal(item)}
                        >
                          Edit
                        </button>

                        {item.status === "Active" ? (
                          <button
                            type="button"
                            className="promotion-packages-actions__disable"
                            onClick={() =>
                              openConfirmDialog(item.id, "disable")
                            }
                          >
                            Disable
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="promotion-packages-actions__enable"
                            onClick={() => openConfirmDialog(item.id, "enable")}
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
        )}
      </SectionCard>

      <BaseModal
        isOpen={isViewModalOpen}
        title="Promotion Package Details"
        description="Review package scope, quota, sales status, and promotion description."
        onClose={closeViewModal}
        maxWidth="760px"
      >
        {selectedPackage ? (
          <div className="promotion-packages-modal__content">
            <div className="promotion-packages-modal__grid">
              <div className="promotion-packages-modal__field">
                <label>Package Name</label>
                <input type="text" value={selectedPackage.name} disabled />
              </div>

              <div className="promotion-packages-modal__field">
                <label>Slot</label>
                <input type="text" value={selectedPackage.slot} disabled />
              </div>

              <div className="promotion-packages-modal__field">
                <label>Duration</label>
                <input
                  type="text"
                  value={`${selectedPackage.durationDays} days`}
                  disabled
                />
              </div>

              <div className="promotion-packages-modal__field">
                <label>Price</label>
                <input type="text" value={selectedPackage.price} disabled />
              </div>

              <div className="promotion-packages-modal__field">
                <label>Max Posts</label>
                <input
                  type="text"
                  value={String(selectedPackage.maxPosts)}
                  disabled
                />
              </div>

              <div className="promotion-packages-modal__field">
                <label>Display Quota</label>
                <input
                  type="text"
                  value={selectedPackage.displayQuota.toLocaleString("en-US")}
                  disabled
                />
              </div>

              <div className="promotion-packages-modal__field">
                <label>Status</label>
                <input type="text" value={selectedPackage.status} disabled />
              </div>
            </div>

            <div className="promotion-packages-modal__field">
              <label>Description</label>
              <textarea value={selectedPackage.description} rows={4} disabled />
            </div>

            <div className="promotion-packages-modal__actions">
              <button
                type="button"
                className="promotion-packages-modal__close"
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
          modalMode === "add"
            ? "Add Promotion Package"
            : "Edit Promotion Package"
        }
        description={
          modalMode === "add"
            ? "Create a new package plan for a supported placement slot."
            : "Update package price, quota, duration, and sales details."
        }
        onClose={closeFormModal}
        maxWidth="760px"
      >
        <form className="promotion-packages-form" onSubmit={handleSubmit}>
          <div className="promotion-packages-modal__grid">
            <div className="promotion-packages-modal__field">
              <label htmlFor="name">Package Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter package name"
              />
            </div>

            <div className="promotion-packages-modal__field">
              <label htmlFor="slot">Slot</label>
              <select
                id="slot"
                name="slot"
                value={formData.slot}
                onChange={handleChange}
              >
                <option>Home Top</option>
                <option>Category Top</option>
                <option>Search Boost</option>
              </select>
            </div>

            <div className="promotion-packages-modal__field">
              <label htmlFor="durationDays">Duration (Days)</label>
              <input
                id="durationDays"
                name="durationDays"
                type="number"
                min={1}
                value={formData.durationDays}
                onChange={handleChange}
              />
            </div>

            <div className="promotion-packages-modal__field">
              <label htmlFor="price">Price</label>
              <input
                id="price"
                name="price"
                type="text"
                value={formData.price}
                onChange={handleChange}
                placeholder="Enter package price"
              />
            </div>

            <div className="promotion-packages-modal__field">
              <label htmlFor="maxPosts">Max Posts</label>
              <input
                id="maxPosts"
                name="maxPosts"
                type="number"
                min={1}
                value={formData.maxPosts}
                onChange={handleChange}
              />
            </div>

            <div className="promotion-packages-modal__field">
              <label htmlFor="displayQuota">Display Quota</label>
              <input
                id="displayQuota"
                name="displayQuota"
                type="number"
                min={1}
                value={formData.displayQuota}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="promotion-packages-modal__field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter package description and benefits"
            />
          </div>

          {formError ? (
            <p className="promotion-packages-form__error">{formError}</p>
          ) : null}

          <div className="promotion-packages-modal__actions">
            <button
              type="button"
              className="promotion-packages-modal__close"
              onClick={closeFormModal}
            >
              Cancel
            </button>

            <button type="submit" className="promotion-packages-modal__submit">
              {modalMode === "add" ? "Add Package" : "Save Changes"}
            </button>
          </div>
        </form>
      </BaseModal>

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmTitle}
        message={confirmMessage}
        confirmText={
          confirmState.action === "disable"
            ? "Disable Package"
            : "Enable Package"
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

export default PromotionPackagesPage;
