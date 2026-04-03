import { useEffect, useMemo, useState } from "react";
import BaseModal from "../components/BaseModal";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import SectionCard from "../components/SectionCard";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { categoryService } from "../services/categoryService";
import type {
  Category,
  CategoryFormState,
  CategoryStatus,
} from "../types/category";
import "./CategoriesPage.css";

type ConfirmAction = "disable" | "enable";

type ConfirmState = {
  isOpen: boolean;
  categoryId: number | null;
  action: ConfirmAction | null;
};

const statusFilterOptions: Array<CategoryStatus | "All"> = [
  "All",
  "Active",
  "Disabled",
];

const PAGE_SIZE = 5;

function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState<number | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [formData, setFormData] = useState<CategoryFormState>(
    categoryService.getEmptyForm(),
  );
  const [formError, setFormError] = useState("");

  const [searchKeyword, setSearchKeyword] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<
    CategoryStatus | "All"
  >("All");
  const [page, setPage] = useState(1);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    categoryId: null,
    action: null,
  });
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const loadCategories = async () => {
    try {
      setPageError("");
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Failed to load categories.",
      );
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    void loadCategories();
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
    setSelectedCategoryId(null);
    setFormData(categoryService.getEmptyForm());
    setFormError("");
    setIsModalOpen(true);
  };

  const openViewModal = (category: Category) => {
    setModalMode("view");
    setSelectedCategoryId(category.id);
    setFormData({
      name: category.name,
      slug: category.slug,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setModalMode("edit");
    setSelectedCategoryId(category.id);
    setFormData({
      name: category.name,
      slug: category.slug,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedCategoryId(null);
    setFormError("");
    setIsModalOpen(false);
  };

  const openConfirmDialog = (categoryId: number, action: ConfirmAction) => {
    setConfirmState({
      isOpen: true,
      categoryId,
      action,
    });
  };

  const closeConfirmDialog = () => {
    setConfirmState({
      isOpen: false,
      categoryId: null,
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
      ...(name === "name" && !prev.slug.trim()
        ? { slug: categoryService.buildSlug(value, "") }
        : {}),
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
      categoryService.validateCategoryForm(
        categories,
        formData,
        selectedCategoryId,
      );

      if (modalMode === "add") {
        const newCategory = await categoryService.createCategory(formData);
        setCategories((prev) => [newCategory, ...prev]);
        showToast("Category added successfully.");
      }

      if (modalMode === "edit" && selectedCategoryId !== null) {
        const currentCategory = categories.find(
          (category) => category.id === selectedCategoryId,
        );

        if (!currentCategory) {
          setFormError("Selected category no longer exists.");
          return;
        }

        const updatedCategory = await categoryService.updateCategory(
          selectedCategoryId,
          formData,
          currentCategory.status,
        );

        setCategories((prev) =>
          prev.map((category) =>
            category.id === selectedCategoryId ? updatedCategory : category,
          ),
        );
        showToast("Category updated successfully.");
      }

      closeModal();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to save category.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmAction = async () => {
    if (confirmState.categoryId === null || confirmState.action === null)
      return;

    const targetCategory = categories.find(
      (item) => item.id === confirmState.categoryId,
    );

    if (!targetCategory) {
      closeConfirmDialog();
      return;
    }

    const nextStatus =
      confirmState.action === "disable" ? "Disabled" : "Active";

    try {
      setIsStatusUpdating(confirmState.categoryId);

      const updatedCategory = await categoryService.updateCategoryStatus(
        confirmState.categoryId,
        nextStatus,
        targetCategory,
      );

      setCategories((prev) =>
        prev.map((item) =>
          item.id === confirmState.categoryId ? updatedCategory : item,
        ),
      );

      if (confirmState.action === "disable") {
        showToast(
          `${targetCategory.name} has been disabled successfully.`,
          "info",
        );
      } else {
        showToast(`${targetCategory.name} has been enabled successfully.`);
      }

      closeConfirmDialog();
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Failed to update category status.",
        "error",
      );
    } finally {
      setIsStatusUpdating(null);
    }
  };

  const filteredCategories = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return categories.filter((category) => {
      const matchesKeyword =
        !keyword ||
        category.name.toLowerCase().includes(keyword) ||
        category.slug.toLowerCase().includes(keyword);
      const matchesStatus =
        selectedStatusFilter === "All" ||
        category.status === selectedStatusFilter;

      return matchesKeyword && matchesStatus;
    });
  }, [categories, searchKeyword, selectedStatusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCategories.length / PAGE_SIZE),
  );

  const paginatedCategories = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredCategories.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredCategories, page]);

  useEffect(() => {
    setPage(1);
  }, [searchKeyword, selectedStatusFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const selectedCategory =
    selectedCategoryId !== null
      ? (categories.find((item) => item.id === selectedCategoryId) ?? null)
      : null;

  const modalTitle =
    modalMode === "add"
      ? "Add Category"
      : modalMode === "edit"
        ? "Edit Category"
        : "Category Details";

  const modalDescription =
    modalMode === "add"
      ? "Create a new category. New categories are created as active by default."
      : modalMode === "edit"
        ? "Update category information. Use Enable or Disable in the table to change status."
        : "Review category information and current activation status.";

  const confirmCategory =
    confirmState.categoryId !== null
      ? (categories.find((item) => item.id === confirmState.categoryId) ?? null)
      : null;

  const categoryLabel = confirmCategory?.name ?? "this category";

  const confirmTitleMap: Record<ConfirmAction, string> = {
    disable: "Disable Category",
    enable: "Enable Category",
  };

  const confirmMessageMap: Record<ConfirmAction, string> = {
    disable: `Are you sure you want to disable ${categoryLabel}? This category will no longer be active in the system.`,
    enable: `Are you sure you want to enable ${categoryLabel}? This category will be active again in the system.`,
  };

  const confirmButtonMap: Record<ConfirmAction, string> = {
    disable: "Disable Category",
    enable: "Enable Category",
  };

  const confirmToneMap: Record<
    ConfirmAction,
    "danger" | "success" | "neutral"
  > = {
    disable: "danger",
    enable: "success",
  };

  return (
    <div className="categories-page">
      <PageHeader
        title="Categories Management"
        description="Manage plant categories and their basic information."
        actionLabel="+ Add Category"
        onActionClick={openAddModal}
      />

      <SearchToolbar
        placeholder="Search by category name or slug"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
        onFilterClick={() => setShowFilters((prev) => !prev)}
        filterLabel="Filter by status"
        filterSummaryLabel="Current status"
        filterSummaryItems={[selectedStatusFilter]}
      />

      {showFilters ? (
        <SectionCard
          title="Category Filters"
          description="Filter category records by publication status."
        >
          <div className="categories-filters">
            <div className="categories-filters__field">
              <label htmlFor="categories-status-filter">Status</label>
              <select
                id="categories-status-filter"
                value={selectedStatusFilter}
                onChange={(event) =>
                  setSelectedStatusFilter(
                    event.target.value as CategoryStatus | "All",
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
        title="Category Directory"
        description="Review category information, publication status, and creation date."
      >
        {isInitialLoading ? (
          <div className="categories-state">Loading categories...</div>
        ) : pageError ? (
          <div className="categories-state categories-state--error">
            {pageError}
          </div>
        ) : filteredCategories.length === 0 ? (
          <EmptyState
            title="No categories found"
            description="No categories match your current search. Try another keyword or create a new category."
          />
        ) : (
          <>
            <div className="categories-table-wrapper">
              <table className="categories-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Category Name</th>
                    <th>Slug</th>
                    <th>Attributes</th>
                    <th>Status</th>
                    <th>Created Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedCategories.map((category) => (
                    <tr key={category.id}>
                      <td>#{category.id}</td>
                      <td>{category.name}</td>
                      <td>{category.slug || "—"}</td>
                      <td>{category.attributesCount ?? "—"}</td>
                      <td>
                        <StatusBadge
                          label={category.status}
                          variant={
                            category.status === "Active" ? "active" : "disabled"
                          }
                        />
                      </td>
                      <td>{category.createdAt || "—"}</td>
                      <td>
                        <div className="categories-actions">
                          <button
                            type="button"
                            className="categories-actions__view"
                            onClick={() => openViewModal(category)}
                          >
                            View
                          </button>

                          <button
                            type="button"
                            className="categories-actions__edit"
                            onClick={() => openEditModal(category)}
                          >
                            Edit
                          </button>

                          {category.status === "Active" ? (
                            <button
                              type="button"
                              className="categories-actions__disable"
                              onClick={() =>
                                openConfirmDialog(category.id, "disable")
                              }
                              disabled={isStatusUpdating === category.id}
                            >
                              Disable
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="categories-actions__enable"
                              onClick={() =>
                                openConfirmDialog(category.id, "enable")
                              }
                              disabled={isStatusUpdating === category.id}
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

            <div className="categories-pagination">
              <span className="categories-pagination__info">
                Page {page} of {totalPages}
              </span>

              <div className="categories-pagination__actions">
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
        isOpen={isModalOpen}
        title={modalTitle}
        description={modalDescription}
        onClose={closeModal}
      >
        <form className="categories-modal__form" onSubmit={handleSubmit}>
          <div className="categories-modal__field">
            <label htmlFor="name">Category Name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              disabled={modalMode === "view" || isSubmitting}
              placeholder="Enter category name"
            />
          </div>

          <div className="categories-modal__field">
            <label htmlFor="slug">Slug</label>
            <input
              id="slug"
              name="slug"
              type="text"
              value={formData.slug}
              onChange={handleChange}
              disabled={modalMode === "view" || isSubmitting}
              placeholder="Leave blank to auto-generate from category name"
            />
          </div>

          {modalMode === "view" && selectedCategory ? (
            <>
              <div className="categories-modal__field">
                <label>Status</label>
                <input type="text" value={selectedCategory.status} disabled />
              </div>

              <div className="categories-modal__field">
                <label>Created Date</label>
                <input
                  type="text"
                  value={selectedCategory.createdAt || "—"}
                  disabled
                />
              </div>
            </>
          ) : null}

          {formError ? (
            <div className="categories-state categories-state--error">
              {formError}
            </div>
          ) : null}

          <div className="categories-modal__actions">
            <button
              type="button"
              className="categories-modal__cancel"
              onClick={closeModal}
              disabled={isSubmitting}
            >
              Close
            </button>

            {modalMode !== "view" && (
              <button
                type="submit"
                className="categories-modal__submit"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Saving..."
                  : modalMode === "add"
                    ? "Add Category"
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

export default CategoriesPage;
