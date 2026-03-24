import "./CategoriesPage.css";

type Category = {
  id: number;
  name: string;
  slug: string;
  attributesCount: number;
  status: "Active" | "Disabled";
  createdAt: string;
};

const categories: Category[] = [
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

function CategoriesPage() {
  return (
    <div className="categories-page">
      <div className="categories-page__header">
        <div>
          <h2>Categories Management</h2>
          <p>Manage plant categories and their basic information.</p>
        </div>

        <button className="categories-page__add-btn" type="button">
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
                    <button type="button" className="categories-actions__edit">
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
    </div>
  );
}

export default CategoriesPage;
