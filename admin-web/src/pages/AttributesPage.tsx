import { useEffect, useMemo, useState } from "react";
import BaseModal from "../components/BaseModal";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import SectionCard from "../components/SectionCard";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { attributeService } from "../services/attributeService";
import type {
  Attribute,
  AttributeFormState,
  AttributeStatus,
  AttributeType,
} from "../types/attribute";
import "./AttributesPage.css";

type ConfirmAction = "disable" | "enable";

type ConfirmState = {
  isOpen: boolean;
  attributeId: number | null;
  action: ConfirmAction | null;
};

const statusFilterOptions: Array<AttributeStatus | "All"> = [
  "All",
  "Active",
  "Disabled",
];

const typeFilterOptions: Array<AttributeType | "All"> = [
  "All",
  "Text",
  "Number",
  "Select",
  "Boolean",
];

const PAGE_SIZE = 5;

function AttributesPage() {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState<number | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedAttributeId, setSelectedAttributeId] = useState<number | null>(
    null,
  );
  const [formData, setFormData] = useState<AttributeFormState>(
    attributeService.getEmptyForm(),
  );
  const [formError, setFormError] = useState("");

  const [searchKeyword, setSearchKeyword] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<
    AttributeStatus | "All"
  >("All");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<
    AttributeType | "All"
  >("All");
  const [page, setPage] = useState(1);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    attributeId: null,
    action: null,
  });
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const loadAttributes = async () => {
    try {
      setPageError("");
      const data = await attributeService.getAttributes();
      setAttributes(data);
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Failed to load attributes.",
      );
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    void loadAttributes();
  }, []);

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

  const openAddModal = () => {
    setModalMode("add");
    setSelectedAttributeId(null);
    setFormData(attributeService.getEmptyForm());
    setFormError("");
    setIsModalOpen(true);
  };

  const openViewModal = (attribute: Attribute) => {
    setModalMode("view");
    setSelectedAttributeId(attribute.id);
    setFormData({
      name: attribute.name,
      code: attribute.code,
      type: attribute.type,
      optionsText: attribute.options.join(", "),
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (attribute: Attribute) => {
    setModalMode("edit");
    setSelectedAttributeId(attribute.id);
    setFormData({
      name: attribute.name,
      code: attribute.code,
      type: attribute.type,
      optionsText: attribute.options.join(", "),
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedAttributeId(null);
    setFormError("");
    setIsModalOpen(false);
  };

  const openConfirmDialog = (attributeId: number, action: ConfirmAction) => {
    setConfirmState({
      isOpen: true,
      attributeId,
      action,
    });
  };

  const closeConfirmDialog = () => {
    setConfirmState({
      isOpen: false,
      attributeId: null,
      action: null,
    });
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (formError) {
      setFormError("");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      setFormError("Attribute name is required.");
      return;
    }

    if (!formData.type) {
      setFormError("Attribute type is required.");
      return;
    }

    if (formData.type === "Select" && !formData.optionsText.trim()) {
      setFormError("Options are required for Select type.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError("");

      if (modalMode === "add") {
        const newAttribute = await attributeService.createAttribute(formData);
        setAttributes((prev) => [newAttribute, ...prev]);
        showToast("Attribute added successfully.");
      }

      if (modalMode === "edit" && selectedAttributeId !== null) {
        const currentAttribute = attributes.find(
          (attribute) => attribute.id === selectedAttributeId,
        );

        if (!currentAttribute) {
          setFormError("Selected attribute no longer exists.");
          return;
        }

        const updatedAttribute = await attributeService.updateAttribute(
          selectedAttributeId,
          formData,
          currentAttribute.status,
        );

        setAttributes((prev) =>
          prev.map((attribute) =>
            attribute.id === selectedAttributeId ? updatedAttribute : attribute,
          ),
        );
        showToast("Attribute updated successfully.");
      }

      closeModal();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to save attribute.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmAction = async () => {
    if (confirmState.attributeId === null || confirmState.action === null)
      return;

    const targetAttribute = attributes.find(
      (item) => item.id === confirmState.attributeId,
    );

    if (!targetAttribute) {
      closeConfirmDialog();
      return;
    }

    const nextStatus =
      confirmState.action === "disable" ? "Disabled" : "Active";

    try {
      setIsStatusUpdating(confirmState.attributeId);

      const updatedAttribute = await attributeService.updateAttributeStatus(
        confirmState.attributeId,
        nextStatus,
        targetAttribute,
      );

      setAttributes((prev) =>
        prev.map((item) =>
          item.id === confirmState.attributeId ? updatedAttribute : item,
        ),
      );

      if (confirmState.action === "disable") {
        showToast(
          `${targetAttribute.name} has been disabled successfully.`,
          "info",
        );
      } else {
        showToast(`${targetAttribute.name} has been enabled successfully.`);
      }

      closeConfirmDialog();
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Failed to update attribute status.",
        "error",
      );
    } finally {
      setIsStatusUpdating(null);
    }
  };

  const filteredAttributes = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return attributes.filter((attribute) => {
      const matchesKeyword =
        !keyword ||
        attribute.name.toLowerCase().includes(keyword) ||
        attribute.code.toLowerCase().includes(keyword);
      const matchesStatus =
        selectedStatusFilter === "All" ||
        attribute.status === selectedStatusFilter;
      const matchesType =
        selectedTypeFilter === "All" || attribute.type === selectedTypeFilter;

      return matchesKeyword && matchesStatus && matchesType;
    });
  }, [attributes, searchKeyword, selectedStatusFilter, selectedTypeFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAttributes.length / PAGE_SIZE),
  );

  const paginatedAttributes = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredAttributes.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredAttributes, page]);

  useEffect(() => {
    setPage(1);
  }, [searchKeyword, selectedStatusFilter, selectedTypeFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const selectedAttribute =
    selectedAttributeId !== null
      ? (attributes.find((item) => item.id === selectedAttributeId) ?? null)
      : null;

  const modalTitle =
    modalMode === "add"
      ? "Add Attribute"
      : modalMode === "edit"
        ? "Edit Attribute"
        : "Attribute Details";

  const modalDescription =
    modalMode === "add"
      ? "Create a new attribute. New attributes are created as active by default."
      : modalMode === "edit"
        ? "Update attribute information and options. Use Enable or Disable in the table to change status."
        : "Review attribute information, configuration, and current activation status.";

  const confirmAttribute =
    confirmState.attributeId !== null
      ? (attributes.find((item) => item.id === confirmState.attributeId) ??
        null)
      : null;

  const attributeLabel = confirmAttribute?.name ?? "this attribute";

  const confirmTitleMap: Record<ConfirmAction, string> = {
    disable: "Disable Attribute",
    enable: "Enable Attribute",
  };

  const confirmMessageMap: Record<ConfirmAction, string> = {
    disable: `Are you sure you want to disable ${attributeLabel}? This attribute will no longer be active in the system.`,
    enable: `Are you sure you want to enable ${attributeLabel}? This attribute will be active again in the system.`,
  };

  const confirmButtonMap: Record<ConfirmAction, string> = {
    disable: "Disable Attribute",
    enable: "Enable Attribute",
  };

  const confirmToneMap: Record<
    ConfirmAction,
    "danger" | "success" | "neutral"
  > = {
    disable: "danger",
    enable: "success",
  };

  return (
    <div className="attributes-page">
      <PageHeader
        title="Attributes Management"
        description="Manage post attributes used across plant categories."
        actionLabel="+ Add Attribute"
        onActionClick={openAddModal}
      />

      <SearchToolbar
        placeholder="Search by attribute name or code"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
        onFilterClick={() => setShowFilters((prev) => !prev)}
        filterLabel="Filter by type & status"
        filterSummary={`Current filters: ${selectedTypeFilter} • ${selectedStatusFilter}`}
      />

      {showFilters ? (
        <SectionCard
          title="Attribute Filters"
          description="Filter attribute records by data type and status."
        >
          <div className="attributes-filters">
            <div className="attributes-filters__field">
              <label htmlFor="attributes-type-filter">Type</label>
              <select
                id="attributes-type-filter"
                value={selectedTypeFilter}
                onChange={(event) =>
                  setSelectedTypeFilter(
                    event.target.value as AttributeType | "All",
                  )
                }
              >
                {typeFilterOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="attributes-filters__field">
              <label htmlFor="attributes-status-filter">Status</label>
              <select
                id="attributes-status-filter"
                value={selectedStatusFilter}
                onChange={(event) =>
                  setSelectedStatusFilter(
                    event.target.value as AttributeStatus | "All",
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
      ) : null}

      <SectionCard
        title="Attribute Directory"
        description="Review attribute information, type, usage, and activation status."
      >
        {isInitialLoading ? (
          <div className="attributes-state">Loading attributes...</div>
        ) : pageError ? (
          <div className="attributes-state attributes-state--error">
            {pageError}
          </div>
        ) : filteredAttributes.length === 0 ? (
          <EmptyState
            title="No attributes found"
            description="No attributes match your current search. Try another keyword or create a new attribute."
          />
        ) : (
          <div className="attributes-table-wrapper">
            <table className="attributes-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Attribute Name</th>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Used In</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredAttributes.map((attribute) => (
                  <tr key={attribute.id}>
                    <td>#{attribute.id}</td>
                    <td>{attribute.name}</td>
                    <td>{attribute.code || "—"}</td>
                    <td>
                      <StatusBadge label={attribute.type} variant="type" />
                    </td>
                    <td>
                      {attribute.usedIn.length > 0
                        ? attribute.usedIn.join(", ")
                        : "—"}
                    </td>
                    <td>
                      <StatusBadge
                        label={attribute.status}
                        variant={
                          attribute.status === "Active" ? "active" : "disabled"
                        }
                      />
                    </td>
                    <td>{attribute.createdAt || "—"}</td>
                    <td>
                      <div className="attributes-actions">
                        <button
                          type="button"
                          className="attributes-actions__view"
                          onClick={() => openViewModal(attribute)}
                        >
                          View
                        </button>

                        <button
                          type="button"
                          className="attributes-actions__edit"
                          onClick={() => openEditModal(attribute)}
                        >
                          Edit
                        </button>

                        {attribute.status === "Active" ? (
                          <button
                            type="button"
                            className="attributes-actions__disable"
                            onClick={() =>
                              openConfirmDialog(attribute.id, "disable")
                            }
                            disabled={isStatusUpdating === attribute.id}
                          >
                            Disable
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="attributes-actions__enable"
                            onClick={() =>
                              openConfirmDialog(attribute.id, "enable")
                            }
                            disabled={isStatusUpdating === attribute.id}
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
        isOpen={isModalOpen}
        title={modalTitle}
        description={modalDescription}
        onClose={closeModal}
      >
        <form className="attributes-modal__form" onSubmit={handleSubmit}>
          <div className="attributes-modal__field">
            <label htmlFor="name">Attribute Name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              disabled={modalMode === "view" || isSubmitting}
              placeholder="Enter attribute name"
            />
          </div>

          <div className="attributes-modal__field">
            <label htmlFor="code">Code</label>
            <input
              id="code"
              name="code"
              type="text"
              value={formData.code}
              onChange={handleChange}
              disabled={modalMode === "view" || isSubmitting}
              placeholder="Enter attribute code"
            />
          </div>

          <div className="attributes-modal__field">
            <label htmlFor="type">Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              disabled={modalMode === "view" || isSubmitting}
            >
              <option>Text</option>
              <option>Number</option>
              <option>Select</option>
              <option>Boolean</option>
            </select>
          </div>

          {formData.type === "Select" && (
            <div className="attributes-modal__field">
              <label htmlFor="optionsText">Options</label>
              <input
                id="optionsText"
                name="optionsText"
                type="text"
                value={formData.optionsText}
                onChange={handleChange}
                disabled={modalMode === "view" || isSubmitting}
                placeholder="Enter options separated by commas"
              />
            </div>
          )}

          {modalMode === "view" && selectedAttribute ? (
            <>
              <div className="attributes-modal__field">
                <label>Status</label>
                <input type="text" value={selectedAttribute.status} disabled />
              </div>

              <div className="attributes-modal__field">
                <label>Created Date</label>
                <input
                  type="text"
                  value={selectedAttribute.createdAt || "—"}
                  disabled
                />
              </div>
            </>
          ) : null}

          {formError ? (
            <div className="attributes-state attributes-state--error">
              {formError}
            </div>
          ) : null}

          <div className="attributes-modal__actions">
            <button
              type="button"
              className="attributes-modal__cancel"
              onClick={closeModal}
              disabled={isSubmitting}
            >
              Close
            </button>

            {modalMode !== "view" && (
              <button
                type="submit"
                className="attributes-modal__submit"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Saving..."
                  : modalMode === "add"
                    ? "Add Attribute"
                    : "Save Changes"}
              </button>
            )}
          </div>
        </form>
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

export default AttributesPage;
