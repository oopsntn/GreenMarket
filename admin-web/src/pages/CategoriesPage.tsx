import { useState } from "react";
import "./CategoriesPage.css";

type Category = {
  id: number;
  name: string;
  slug: string;
  attributesCount: number;
  status: "Active" | "Disabled";
  createdAt: string;
};

const initialCategories: Category[] = [
  {
    id: 1,
    name: "Indoor Plants",
    slug: "indoor-plants",
    attributesCount: 8,
    status: "Active",
    createdAt: "2026-03-10",
  },
  {
    id: 2,
    name: "Outdoor Plants",
    slug: "outdoor-plants",
    attributesCount: 6,
    status: "Active",
    createdAt: "2026-03-11",
  },
  {
    id: 3,
    name: "Succulents",
    slug: "succulents",
    attributesCount: 5,
    status: "Active",
    createdAt: "2026-03-12",
  },
  {
    id: 4,
    name: "Bonsai",
    slug: "bonsai",
    attributesCount: 7,
    status: "Disabled",
    createdAt: "2026-03-13",
  },
];

type CategoryFormState = {
  name: string;
  slug: string;
  attributesCount: number;
  status: "Active" | "Disabled";
};

const emptyForm: CategoryFormState = {
  name: "",
  slug: "",
  attributesCount: 0,
  status: "Active",
};

function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [formData, setFormData] = useState<CategoryFormState>(emptyForm);

  const openAddModal = () => {
    setModalMode("add");
    setSelectedCategoryId(null);
    setFormData(emptyForm);
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
      const newCategory: Category = {
        id: categories.length + 1,
        name: formData.name,
        slug: formData.slug,
        attributesCount: formData.attributesCount,
        status: formData.status,
        createdAt: "2026-03-18",
      };

      setCategories((prev) => [newCategory, ...prev]);
    }

    if (modalMode === "edit" && selectedCategoryId !== null) {
      setCategories((prev) =>
        prev.map((category) =>
          category.id === selectedCategoryId
            ? {
                ...category,
                name: formData.name,
                slug: formData.slug,
                attributesCount: formData.attributesCount,
                status: formData.status,
              }
            : category,
        ),
      );
    }

    closeModal();
  };

  return (
    <div className="categories-page">
      <div className="categories-page__header">
        <div>
          <h2>Categories Management</h2>
          <p>Manage plant categories and their basic information.</p>
        </div>

        <button
          className="categories-page__add-btn"
          type="button"
          onClick={openAddModal}
        >
          + Add Category
        </button>
      </div>

      <div className="categories-toolbar">
        <input
          className="categories-toolbar__search"
          type="text"
          placeholder="Search by category name or slug"
        />

        <button className="categories-toolbar__filter-btn" type="button">
          Filter
        </button>
      </div>

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
            {categories.map((category) => (
              <tr key={category.id}>
                <td>#{category.id}</td>
                <td>{category.name}</td>
                <td>{category.slug}</td>
                <td>{category.attributesCount}</td>
                <td>
                  <span
                    className={
                      category.status === "Active"
                        ? "categories-badge categories-badge--active"
                        : "categories-badge categories-badge--disabled"
                    }
                  >
                    {category.status}
                  </span>
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
                      >
                        Disable
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="categories-actions__enable"
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
