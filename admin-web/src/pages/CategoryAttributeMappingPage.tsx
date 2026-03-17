import "./CategoryAttributeMappingPage.css";

type MappingItem = {
  id: number;
  categoryName: string;
  attributeName: string;
  attributeCode: string;
  required: boolean;
  displayOrder: number;
  status: "Active" | "Disabled";
};

const mappingItems: MappingItem[] = [
  {
    id: 1,
    categoryName: "Indoor Plants",
    attributeName: "Height",
    attributeCode: "height",
    required: true,
    displayOrder: 1,
    status: "Active",
  },
  {
    id: 2,
    categoryName: "Indoor Plants",
    attributeName: "Pot Size",
    attributeCode: "pot_size",
    required: false,
    displayOrder: 2,
    status: "Active",
  },
  {
    id: 3,
    categoryName: "Succulents",
    attributeName: "Light Requirement",
    attributeCode: "light_requirement",
    required: true,
    displayOrder: 1,
    status: "Active",
  },
  {
    id: 4,
    categoryName: "Bonsai",
    attributeName: "Pet Friendly",
    attributeCode: "pet_friendly",
    required: false,
    displayOrder: 3,
    status: "Disabled",
  },
];

function CategoryAttributeMappingPage() {
  return (
    <div className="mapping-page">
      <div className="mapping-page__header">
        <div>
          <h2>Category - Attribute Mapping</h2>
          <p>Configure which attributes belong to each plant category.</p>
        </div>

        <button className="mapping-page__add-btn" type="button">
          + Add Mapping
        </button>
      </div>

      <div className="mapping-toolbar">
        <input
          className="mapping-toolbar__search"
          type="text"
          placeholder="Search by category or attribute"
        />

        <button className="mapping-toolbar__filter-btn" type="button">
          Filter
        </button>
      </div>

      <div className="mapping-table-wrapper">
        <table className="mapping-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Category</th>
              <th>Attribute</th>
              <th>Code</th>
              <th>Required</th>
              <th>Display Order</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {mappingItems.map((item) => (
              <tr key={item.id}>
                <td>#{item.id}</td>
                <td>{item.categoryName}</td>
                <td>{item.attributeName}</td>
                <td>{item.attributeCode}</td>
                <td>
                  <span
                    className={
                      item.required
                        ? "mapping-badge mapping-badge--required"
                        : "mapping-badge mapping-badge--optional"
                    }
                  >
                    {item.required ? "Required" : "Optional"}
                  </span>
                </td>
                <td>{item.displayOrder}</td>
                <td>
                  <span
                    className={
                      item.status === "Active"
                        ? "mapping-badge mapping-badge--active"
                        : "mapping-badge mapping-badge--disabled"
                    }
                  >
                    {item.status}
                  </span>
                </td>
                <td>
                  <div className="mapping-actions">
                    <button type="button" className="mapping-actions__edit">
                      Edit
                    </button>

                    <button type="button" className="mapping-actions__remove">
                      Remove
                    </button>
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

export default CategoryAttributeMappingPage;
