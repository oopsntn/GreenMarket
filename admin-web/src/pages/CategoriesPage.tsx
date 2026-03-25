import { useState } from "react";
import BaseModal from "../components/BaseModal";
import ConfirmDialog from "../components/ConfirmDialog";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { emptyCategoryForm } from "../mock-data/categories";
import { categoryService } from "../services/categoryService";
import type { Category, CategoryFormState } from "../types/category";
import "./CategoriesPage.css";

type ConfirmAction = "disable" | "enable";

type ConfirmState = {
  isOpen: boolean;
  categoryId: number | null;
  action: ConfirmAction | null;
};

function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(
    categoryService.getCategories(),
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [formData, setFormData] =
    useState<CategoryFormState>(emptyCategoryForm);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    categoryId: null,
    action: null,
  });
  const [toasts, setToasts] = useState<ToastItem[]>([]);

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
    setFormData(emptyCategoryForm);
    setIsModalOpen(true);
  };

  const openViewModal = (category: Category) => {
    setModalMode("view");
    setSelectedCategoryId(category.id);
    setFormData({
      name: category.name,
      slug: category.slug,
      attributesCount: category.attributesCount,
      status: category.status,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setModalMode("edit");
    setSelectedCategoryId(category.id);
    setFormData({
      name: category.name,
      slug: category.slug,
      attributesCount: category.attributesCount,
      status: category.status,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedCategoryId(null);
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
      [name]: name === "attributesCount" ? Number(value) : value,
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (modalMode === "add") {
      setCategories((prev) => categoryService.createCategory(prev, formData));
      showToast("Category added successfully.");
    }

    if (modalMode === "edit" && selectedCategoryId !== null) {
      setCategories((prev) =>
        categoryService.updateCategory(prev, selectedCategoryId, formData),
      );
      showToast("Category updated successfully.");
    }

    closeModal();
  };

  const handleToggleStatus = (category: Category) => {
    const nextStatus = category.status === "Active" ? "Disabled" : "Active";
    setCategories((prev) =>
      categoryService.updateCategoryStatus(prev, category.id, nextStatus),
    );
  };

  const handleConfirmAction = () => {
    if (confirmState.categoryId === null || confirmState.action === null)
      return;

    const targetCategory = categories.find(
      (item) => item.id === confirmState.categoryId,
    );
    if (!targetCategory) {
      closeConfirmDialog();
      return;
    }

    handleToggleStatus(targetCategory);

    if (confirmState.action === "disable") {
      showToast(
        `${targetCategory.name} has been disabled successfully.`,
        "info",
      );
    } else {
      showToast(`${targetCategory.name} has been enabled successfully.`);
    }

    closeConfirmDialog();
  };

  const filteredCategories = categories.filter((category) => {
    const keyword = searchKeyword.trim().toLowerCase();

    if (!keyword) return true;

    return (
      category.name.toLowerCase().includes(keyword) ||
      category.slug.toLowerCase().includes(keyword)
    );
  });

  const modalTitle =
    modalMode === "add"
      ? "Add Category"
      : modalMode === "edit"
        ? "Edit Category"
        : "Category Details";

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
      />

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
            {filteredCategories.map((category) => (
              <tr key={category.id}>
                <td>#{category.id}</td>
                <td>{category.name}</td>
                <td>{category.slug}</td>
                <td>{category.attributesCount}</td>
                <td>
                  <StatusBadge
                    label={category.status}
                    variant={
                      category.status === "Active" ? "active" : "disabled"
                    }
                  />
                </td>
                <td>{category.createdAt}</td>
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
                      >
                        Disable
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="categories-actions__enable"
                        onClick={() => openConfirmDialog(category.id, "enable")}
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

      <BaseModal
        isOpen={isModalOpen}
        title={modalTitle}
        description="Manage category information and settings."
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
              disabled={modalMode === "view"}
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
              disabled={modalMode === "view"}
              placeholder="Enter slug"
            />
          </div>

          <div className="categories-modal__field">
            <label htmlFor="attributesCount">Attributes Count</label>
            <input
              id="attributesCount"
              name="attributesCount"
              type="number"
              value={formData.attributesCount}
              onChange={handleChange}
              disabled={modalMode === "view"}
              placeholder="Enter number of attributes"
            />
          </div>

          <div className="categories-modal__field">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              disabled={modalMode === "view"}
            >
              <option>Active</option>
              <option>Disabled</option>
            </select>
          </div>

          <div className="categories-modal__actions">
            <button
              type="button"
              className="categories-modal__cancel"
              onClick={closeModal}
            >
              Close
            </button>

            {modalMode !== "view" && (
              <button type="submit" className="categories-modal__submit">
                {modalMode === "add" ? "Add Category" : "Save Changes"}
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
