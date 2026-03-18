import { useState } from "react";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import StatusBadge from "../components/StatusBadge";
import { emptyCategoryForm } from "../mock-data/categories";
import { categoryService } from "../services/categoryService";
import type { Category, CategoryFormState } from "../types/category";
import "./CategoriesPage.css";

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
    }

    if (modalMode === "edit" && selectedCategoryId !== null) {
      setCategories((prev) =>
        categoryService.updateCategory(prev, selectedCategoryId, formData),
      );
    }

    closeModal();
  };

  const handleToggleStatus = (category: Category) => {
    const nextStatus = category.status === "Active" ? "Disabled" : "Active";
    setCategories((prev) =>
      categoryService.updateCategoryStatus(prev, category.id, nextStatus),
    );
  };

  const filteredCategories = categories.filter((category) => {
    const keyword = searchKeyword.trim().toLowerCase();

    if (!keyword) return true;

    return (
      category.name.toLowerCase().includes(keyword) ||
      category.slug.toLowerCase().includes(keyword)
    );
  });

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
                        onClick={() => handleToggleStatus(category)}
                      >
                        Disable
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="categories-actions__enable"
                        onClick={() => handleToggleStatus(category)}
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

      {isModalOpen && (
        <div className="categories-modal-backdrop">
          <div className="categories-modal">
            <div className="categories-modal__header">
              <div>
                <h3>
                  {modalMode === "add"
                    ? "Add Category"
                    : modalMode === "edit"
                      ? "Edit Category"
                      : "Category Details"}
                </h3>
                <p>Manage category information and settings.</p>
              </div>

              <button
                type="button"
                className="categories-modal__close"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

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
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoriesPage;
