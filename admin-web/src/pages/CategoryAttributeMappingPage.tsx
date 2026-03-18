import { useState } from "react";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import StatusBadge from "../components/StatusBadge";
import { categoryMappingService } from "../services/categoryMappingService";
import type { CategoryMapping } from "../types/categoryMapping";
import "./CategoryAttributeMappingPage.css";

function CategoryAttributeMappingPage() {
  const [mappings, setMappings] = useState<CategoryMapping[]>(
    categoryMappingService.getMappings(),
  );
  const [searchKeyword, setSearchKeyword] = useState("");

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

  const filteredMappings = mappings.filter((item) => {
    const keyword = searchKeyword.trim().toLowerCase();

    if (!keyword) return true;

    return (
      item.categoryName.toLowerCase().includes(keyword) ||
      item.attributeName.toLowerCase().includes(keyword) ||
      item.attributeCode.toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="mapping-page">
      <PageHeader
        title="Category - Attribute Mapping"
        description="Configure which attributes belong to each plant category."
        actionLabel="+ Add Mapping"
      />

      <SearchToolbar
        placeholder="Search by category or attribute"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
      />

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
            {filteredMappings.map((item) => (
              <tr key={item.id}>
                <td>#{item.id}</td>
                <td>{item.categoryName}</td>
                <td>{item.attributeName}</td>
                <td>{item.attributeCode}</td>
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
                    variant={item.status === "Active" ? "active" : "disabled"}
                  />
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
