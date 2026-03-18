import { useState } from "react";
import { categoryMappingService } from "../services/categoryMappingService";
import type { CategoryMapping } from "../types/categoryMapping";
import "./CategoryAttributeMappingPage.css";

function CategoryAttributeMappingPage() {
  const [mappings, setMappings] = useState<CategoryMapping[]>(
    categoryMappingService.getMappings(),
  );

  const handleToggleStatus = (mapping: CategoryMapping) => {
    const nextStatus = mapping.status === "Active" ? "Disabled" : "Active";
    setMappings((prev) =>
      categoryMappingService.updateMappingStatus(prev, mapping.id, nextStatus),
    );
  };

  const handleRemove = (mappingId: number) => {
    setMappings((prev) =>
      categoryMappingService.removeMapping(prev, mappingId),
    );
  };

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
            {mappings.map((item) => (
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

                    {item.status === "Active" ? (
                      <button
                        type="button"
                        className="mapping-actions__disable"
                        onClick={() => handleToggleStatus(item)}
                      >
                        Disable
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="mapping-actions__enable"
                        onClick={() => handleToggleStatus(item)}
                      >
                        Enable
                      </button>
                    )}

                    <button
                      type="button"
                      className="mapping-actions__remove"
                      onClick={() => handleRemove(item.id)}
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
    </div>
  );
}

export default CategoryAttributeMappingPage;
