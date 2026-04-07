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
import { categoryService } from "../services/categoryService";
import {
  categoryMappingService,
  emptyCategoryMappingForm,
} from "../services/categoryMappingService";
import type { Attribute } from "../types/attribute";
import type { Category } from "../types/category";
import type {
  CategoryMapping,
  CategoryMappingFormState,
} from "../types/categoryMapping";
import "./CategoryAttributeMappingPage.css";

type ConfirmAction = "disable" | "enable" | "remove";

type ConfirmState = {
  isOpen: boolean;
  mappingId: string | null;
  action: ConfirmAction | null;
};

const PAGE_SIZE = 5;

function CategoryAttributeMappingPage() {
  const [mappings, setMappings] = useState<CategoryMapping[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Category[]>(
    [],
  );
  const [availableAttributes, setAvailableAttributes] = useState<Attribute[]>(
    [],
  );
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    mappingId: null,
    action: null,
  });
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedMappingId, setSelectedMappingId] = useState<string | null>(
    null,
  );
  const [formData, setFormData] = useState<CategoryMappingFormState>(
    emptyCategoryMappingForm,
  );
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewCategoryId, setPreviewCategoryId] = useState<string>("");

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        setIsCatalogLoading(true);
        setPageError("");

        const [categories, attributes, mappingData] = await Promise.all([
          categoryService.getCategories(),
          attributeService.getAttributes(),
          categoryMappingService.fetchMappings(),
        ]);

        const nextCategories =
          categoryMappingService.getAvailableCategories(categories);
        const nextAttributes =
          categoryMappingService.getAvailableAttributes(attributes);

        setAvailableCategories(nextCategories);
        setAvailableAttributes(nextAttributes);
        setMappings(mappingData);
        setPreviewCategoryId(
          categoryMappingService.getDefaultPreviewCategoryId(
            mappingData,
            nextCategories,
          ),
        );
      } catch (error) {
        setPageError(
          error instanceof Error
            ? error.message
            : "Failed to load category and attribute catalogs.",
        );
      } finally {
        setIsCatalogLoading(false);
      }
    };

    void loadCatalogs();
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

  const selectedMapping =
    selectedMappingId !== null
      ? (mappings.find((mapping) => mapping.id === selectedMappingId) ?? null)
      : null;

  const openAddModal = () => {
    setModalMode("add");
    setSelectedMappingId(null);
    setFormData(emptyCategoryMappingForm);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (mapping: CategoryMapping) => {
    setModalMode("edit");
    setSelectedMappingId(mapping.id);
    setFormData({
      categoryId: String(mapping.categoryId),
      attributeId: String(mapping.attributeId),
      required: mapping.required,
      displayOrder: mapping.displayOrder,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedMappingId(null);
    setFormError("");
    setIsSubmitting(false);
    setIsModalOpen(false);
  };

  const openConfirmDialog = (mappingId: string, action: ConfirmAction) => {
    setConfirmState({
      isOpen: true,
      mappingId,
      action,
    });
  };

  const closeConfirmDialog = () => {
    setConfirmState({
      isOpen: false,
      mappingId: null,
      action: null,
    });
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const target = event.target as HTMLInputElement;
    const { name, value, type, checked } = target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "displayOrder"
            ? Number(value)
            : value,
    }));

    if (formError) {
      setFormError("");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setFormError("");

      if (modalMode === "add") {
        const createdMapping = await categoryMappingService.createMapping(
          mappings,
          availableCategories,
          availableAttributes,
          formData,
        );

        setMappings((prev) => [...prev, createdMapping]);
        setPreviewCategoryId(
          (prev) => prev || String(createdMapping.categoryId),
        );
        showToast("Mapping added successfully.");
        closeModal();
        return;
      }

      if (modalMode === "edit" && selectedMapping) {
        const updatedMapping = await categoryMappingService.updateMapping(
          mappings,
          availableCategories,
          availableAttributes,
          selectedMapping,
          formData,
        );

        setMappings((prev) =>
          prev.map((mapping) =>
            mapping.id === selectedMapping.id ? updatedMapping : mapping,
          ),
        );

        setPreviewCategoryId((prev) =>
          prev === String(selectedMapping.categoryId)
            ? String(updatedMapping.categoryId)
            : prev,
        );

        showToast("Mapping updated successfully.");
        closeModal();
      }
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to save mapping.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (mapping: CategoryMapping) => {
    const nextStatus = mapping.status === "Active" ? "Disabled" : "Active";

    try {
      const updatedMapping = await categoryMappingService.updateMappingStatus(
        mapping,
        nextStatus,
      );

      setMappings((prev) =>
        prev.map((item) => (item.id === mapping.id ? updatedMapping : item)),
      );
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Failed to update mapping status.",
        "error",
      );
    }
  };

  const handleRemove = async (mapping: CategoryMapping) => {
    try {
      await categoryMappingService.removeMapping(mapping);

      setMappings((prev) => prev.filter((item) => item.id !== mapping.id));

      setPreviewCategoryId((prev) => {
        if (prev !== String(mapping.categoryId)) {
          return prev;
        }

        const remainingMappings = mappings.filter(
          (item) => item.id !== mapping.id && item.status === "Active",
        );

        return categoryMappingService.getDefaultPreviewCategoryId(
          remainingMappings,
          availableCategories,
        );
      });
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to remove mapping.",
        "error",
      );
    }
  };

  const handleConfirmAction = async () => {
    if (confirmState.mappingId === null || confirmState.action === null) return;

    const targetMapping =
      mappings.find((item) => item.id === confirmState.mappingId) ?? null;

    if (!targetMapping) {
      closeConfirmDialog();
      return;
    }

    const mappingLabel = `${targetMapping.categoryName} - ${targetMapping.attributeName}`;

    if (confirmState.action === "remove") {
      await handleRemove(targetMapping);
      showToast(`${mappingLabel} has been removed successfully.`, "info");
    } else {
      await handleToggleStatus(targetMapping);

      if (confirmState.action === "disable") {
        showToast(`${mappingLabel} has been disabled successfully.`, "info");
      } else {
        showToast(`${mappingLabel} has been enabled successfully.`);
      }
    }

    closeConfirmDialog();
  };

  const filteredMappings = useMemo(() => {
    return categoryMappingService.filterMappings(mappings, searchKeyword);
  }, [mappings, searchKeyword]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredMappings.length / PAGE_SIZE),
  );

  const paginatedMappings = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredMappings.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredMappings, page]);

  useEffect(() => {
    setPage(1);
  }, [searchKeyword]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const confirmMapping =
    confirmState.mappingId !== null
      ? (mappings.find((item) => item.id === confirmState.mappingId) ?? null)
      : null;

  const mappingLabel = confirmMapping
    ? `${confirmMapping.categoryName} - ${confirmMapping.attributeName}`
    : "this mapping";

  const confirmTitleMap: Record<ConfirmAction, string> = {
    disable: "Disable Mapping",
    enable: "Enable Mapping",
    remove: "Remove Mapping",
  };

  const confirmMessageMap: Record<ConfirmAction, string> = {
    disable: `Are you sure you want to disable ${mappingLabel}? This mapping will no longer be applied in the category configuration.`,
    enable: `Are you sure you want to enable ${mappingLabel}? This mapping will be active again in the category configuration.`,
    remove: `Are you sure you want to remove ${mappingLabel}? This action will delete the relationship between category and attribute from the current configuration.`,
  };

  const confirmButtonMap: Record<ConfirmAction, string> = {
    disable: "Disable Mapping",
    enable: "Enable Mapping",
    remove: "Remove Mapping",
  };

  const confirmToneMap: Record<
    ConfirmAction,
    "danger" | "success" | "neutral"
  > = {
    disable: "danger",
    enable: "success",
    remove: "danger",
  };

  const modalTitle = modalMode === "add" ? "Add Mapping" : "Edit Mapping";

  const modalDescription =
    modalMode === "add"
      ? "Assign an attribute to a category and define how it appears in the posting form. New mappings are created as active by default."
      : "Update the category-attribute relationship, requirement level, and display order. Use Enable or Disable in the table to change status.";

  const previewMappings = categoryMappingService.getPreviewMappingsByCategory(
    mappings,
    Number(previewCategoryId),
  );

  const previewCategoryName =
    availableCategories.find(
      (category) => category.id === Number(previewCategoryId),
    )?.name ?? "Selected Category";

  const renderPreviewInput = (mapping: CategoryMapping) => {
    if (mapping.attributeType === "Text") {
      return (
        <input
          type="text"
          placeholder={`Enter ${mapping.attributeName.toLowerCase()}`}
          disabled
        />
      );
    }

    if (mapping.attributeType === "Number") {
      return (
        <input
          type="number"
          placeholder={`Enter ${mapping.attributeName.toLowerCase()}`}
          disabled
        />
      );
    }

    if (mapping.attributeType === "Select") {
      return (
        <select disabled defaultValue="">
          <option value="" disabled>
            Select {mapping.attributeName.toLowerCase()}
          </option>
          {mapping.attributeOptions.length > 0 ? (
            mapping.attributeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))
          ) : (
            <>
              <option>Option 1</option>
              <option>Option 2</option>
              <option>Option 3</option>
            </>
          )}
        </select>
      );
    }

    return (
      <label className="mapping-preview__checkbox">
        <input type="checkbox" disabled />
        <span>{mapping.attributeName}</span>
      </label>
    );
  };

  return (
    <div className="mapping-page">
      <PageHeader
        title="Category - Attribute Mapping"
        description="Configure which attributes belong to each plant category and preview the posting form structure."
        actionLabel="+ Add Mapping"
        onActionClick={openAddModal}
      />

      <SearchToolbar
        placeholder="Search by category or attribute"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
      />

      <SectionCard
        title="Mapping Directory"
        description="Review category-attribute relationships, requirement settings, display order, and status."
      >
        {isCatalogLoading ? (
          <EmptyState
            title="Loading mapping catalogs"
            description="Fetching categories, attributes, and mappings from the admin API."
          />
        ) : pageError ? (
          <EmptyState
            title="Unable to load mapping catalogs"
            description={pageError}
          />
        ) : filteredMappings.length === 0 ? (
          <EmptyState
            title="No mappings found"
            description="No category-attribute mappings match your current search. Try another keyword or add a new mapping."
          />
        ) : (
          <>
            <div className="mapping-table-wrapper">
              <table className="mapping-table">
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Category</th>
                    <th>Attribute</th>
                    <th>Code</th>
                    <th>Type</th>
                    <th>Required</th>
                    <th>Display Order</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedMappings.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.categoryName}</td>
                      <td>{item.attributeName}</td>
                      <td>{item.attributeCode}</td>
                      <td>
                        <StatusBadge
                          label={item.attributeType}
                          variant="type"
                        />
                      </td>
                      <td>
                        <StatusBadge
                          label={item.required ? "Required" : "Optional"}
                          variant={item.required ? "required" : "optional"}
                        />
                      </td>
                      <td>{item.displayOrder}</td>
                      <td>
                        <StatusBadge
                          label={item.status}
                          variant={
                            item.status === "Active" ? "active" : "disabled"
                          }
                        />
                      </td>
                      <td>
                        <div className="mapping-actions">
                          <button
                            type="button"
                            className="mapping-actions__edit"
                            onClick={() => openEditModal(item)}
                          >
                            Edit
                          </button>

                          {item.status === "Active" ? (
                            <button
                              type="button"
                              className="mapping-actions__disable"
                              onClick={() =>
                                openConfirmDialog(item.id, "disable")
                              }
                            >
                              Disable
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="mapping-actions__enable"
                              onClick={() =>
                                openConfirmDialog(item.id, "enable")
                              }
                            >
                              Enable
                            </button>
                          )}

                          <button
                            type="button"
                            className="mapping-actions__remove"
                            onClick={() => openConfirmDialog(item.id, "remove")}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mapping-pagination">
              <span className="mapping-pagination__info">
                Page {page} of {totalPages}
              </span>

              <div className="mapping-pagination__actions">
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

      <SectionCard
        title="Preview Post Form Configuration"
        description="Preview how the posting form will appear based on the selected category's active mappings."
      >
        <div className="mapping-preview">
          <div className="mapping-preview__toolbar">
            <div className="mapping-preview__field">
              <label htmlFor="preview-category">Category</label>
              <select
                id="preview-category"
                value={previewCategoryId}
                onChange={(event) => setPreviewCategoryId(event.target.value)}
              >
                {availableCategories.map((category) => (
                  <option key={category.id} value={String(category.id)}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isCatalogLoading ? (
            <EmptyState
              title="Loading preview catalogs"
              description="Fetching categories and attributes used by the preview form."
            />
          ) : pageError ? (
            <EmptyState title="Preview unavailable" description={pageError} />
          ) : previewMappings.length === 0 ? (
            <EmptyState
              title="No active form fields"
              description="This category does not have any active attribute mappings yet. Add or enable a mapping to preview the posting form."
            />
          ) : (
            <div className="mapping-preview__form-card">
              <div className="mapping-preview__header">
                <h3>{previewCategoryName} Post Form</h3>
                <p>Fields are displayed in the configured order below.</p>
              </div>

              <div className="mapping-preview__grid">
                {previewMappings.map((mapping) => (
                  <div key={mapping.id} className="mapping-preview__item">
                    <div className="mapping-preview__label-row">
                      <label>{mapping.attributeName}</label>
                      <div className="mapping-preview__meta">
                        <StatusBadge
                          label={mapping.required ? "Required" : "Optional"}
                          variant={mapping.required ? "required" : "optional"}
                        />
                        <span className="mapping-preview__order">
                          Order {mapping.displayOrder}
                        </span>
                      </div>
                    </div>

                    {renderPreviewInput(mapping)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      <BaseModal
        isOpen={isModalOpen}
        title={modalTitle}
        description={modalDescription}
        onClose={closeModal}
        maxWidth="640px"
      >
        <form className="mapping-modal__form" onSubmit={handleSubmit}>
          <div className="mapping-modal__field">
            <label htmlFor="categoryId">Category</label>
            <select
              id="categoryId"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              disabled={isCatalogLoading || isSubmitting}
            >
              <option value="">Select category</option>
              {availableCategories.map((category) => (
                <option key={category.id} value={String(category.id)}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mapping-modal__field">
            <label htmlFor="attributeId">Attribute</label>
            <select
              id="attributeId"
              name="attributeId"
              value={formData.attributeId}
              onChange={handleChange}
              disabled={isCatalogLoading || isSubmitting}
            >
              <option value="">Select attribute</option>
              {availableAttributes.map((attribute) => (
                <option key={attribute.id} value={String(attribute.id)}>
                  {attribute.name} ({attribute.type})
                </option>
              ))}
            </select>
          </div>

          <div className="mapping-modal__field">
            <label htmlFor="displayOrder">Display Order</label>
            <input
              id="displayOrder"
              name="displayOrder"
              type="number"
              min={1}
              value={formData.displayOrder}
              onChange={handleChange}
              placeholder="Enter display order"
              disabled={isSubmitting}
            />
          </div>

          <label className="mapping-modal__checkbox">
            <input
              name="required"
              type="checkbox"
              checked={formData.required}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            <span>Required field in posting form</span>
          </label>

          {formError ? (
            <p className="mapping-modal__error">{formError}</p>
          ) : null}

          <div className="mapping-modal__actions">
            <button
              type="button"
              className="mapping-modal__cancel"
              onClick={closeModal}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="mapping-modal__submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Saving..."
                : modalMode === "add"
                  ? "Add Mapping"
                  : "Save Changes"}
            </button>
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
        onConfirm={() => {
          void handleConfirmAction();
        }}
        onCancel={closeConfirmDialog}
      />

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default CategoryAttributeMappingPage;
