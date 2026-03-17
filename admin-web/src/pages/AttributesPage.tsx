import "./AttributesPage.css";

type Attribute = {
  id: number;
  name: string;
  code: string;
  type: "Text" | "Number" | "Select" | "Boolean";
  required: boolean;
  status: "Active" | "Disabled";
  createdAt: string;
};

const attributes: Attribute[] = [
  {
    id: 1,
    name: "Height",
    code: "height",
    type: "Number",
    required: true,
    status: "Active",
    createdAt: "2026-03-10",
  },
  {
    id: 2,
    name: "Pot Size",
    code: "pot_size",
    type: "Text",
    required: false,
    status: "Active",
    createdAt: "2026-03-11",
  },
  {
    id: 3,
    name: "Light Requirement",
    code: "light_requirement",
    type: "Select",
    required: true,
    status: "Active",
    createdAt: "2026-03-12",
  },
  {
    id: 4,
    name: "Pet Friendly",
    code: "pet_friendly",
    type: "Boolean",
    required: false,
    status: "Disabled",
    createdAt: "2026-03-13",
  },
];

function AttributesPage() {
  return (
    <div className="attributes-page">
      <div className="attributes-page__header">
        <div>
          <h2>Attributes Management</h2>
          <p>Manage post attributes used across plant categories.</p>
        </div>

        <button className="attributes-page__add-btn" type="button">
          + Add Attribute
        </button>
      </div>

      <div className="attributes-toolbar">
        <input
          className="attributes-toolbar__search"
          type="text"
          placeholder="Search by attribute name or code"
        />

        <button className="attributes-toolbar__filter-btn" type="button">
          Filter
        </button>
      </div>

      <div className="attributes-table-wrapper">
        <table className="attributes-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Attribute Name</th>
              <th>Code</th>
              <th>Type</th>
              <th>Required</th>
              <th>Status</th>
              <th>Created Date</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {attributes.map((attribute) => (
              <tr key={attribute.id}>
                <td>#{attribute.id}</td>
                <td>{attribute.name}</td>
                <td>{attribute.code}</td>
                <td>
                  <span className="attributes-badge attributes-badge--type">
                    {attribute.type}
                  </span>
                </td>
                <td>
                  <span
                    className={
                      attribute.required
                        ? "attributes-badge attributes-badge--required"
                        : "attributes-badge attributes-badge--optional"
                    }
                  >
                    {attribute.required ? "Required" : "Optional"}
                  </span>
                </td>
                <td>
                  <span
                    className={
                      attribute.status === "Active"
                        ? "attributes-badge attributes-badge--active"
                        : "attributes-badge attributes-badge--disabled"
                    }
                  >
                    {attribute.status}
                  </span>
                </td>
                <td>{attribute.createdAt}</td>
                <td>
                  <div className="attributes-actions">
                    <button type="button" className="attributes-actions__edit">
                      Edit
                    </button>

                    {attribute.status === "Active" ? (
                      <button
                        type="button"
                        className="attributes-actions__disable"
                      >
                        Disable
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="attributes-actions__enable"
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

export default AttributesPage;
