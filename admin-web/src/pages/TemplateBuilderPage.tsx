import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import SectionCard from "../components/SectionCard";
import StatusBadge from "../components/StatusBadge";
import { templateService } from "../services/templateService";
import type { Template, TemplateType } from "../types/template";
import "./TemplateBuilderPage.css";

const PAGE_SIZE = 4;

const typeFilterOptions: Array<TemplateType | "All"> = [
  "All",
  "Rejection Reason",
  "Report Reason",
  "Notification",
];


function TemplateBuilderPage() {
  const [templates] = useState<Template[]>(templateService.getTemplates());
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<
    TemplateType | "All"
  >("All");
  const [page, setPage] = useState(1);

  const filteredTemplates = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return templates.filter((template) => {
      const matchesKeyword =
        !keyword ||
        template.name.toLowerCase().includes(keyword) ||
        template.type.toLowerCase().includes(keyword) ||
        template.content.toLowerCase().includes(keyword);

      const matchesType =
        selectedTypeFilter === "All" || template.type === selectedTypeFilter;

      return matchesKeyword && matchesType;
    });
  }, [templates, searchKeyword, selectedTypeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTemplates.length / PAGE_SIZE));

  const paginatedTemplates = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredTemplates.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredTemplates, page]);

  useEffect(() => {
    setPage(1);
  }, [searchKeyword, selectedTypeFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <div className="template-builder-page">
      <PageHeader
        title="Template Builder"
        description="Choose a base template and prepare the builder workspace for outbound admin messaging."
      />

      <SearchToolbar
        placeholder="Search templates by name, type, or content"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
        onFilterClick={() => setShowFilters((prev) => !prev)}
        filterLabel="Filter library"
        filterSummaryItems={[selectedTypeFilter]}
      />

      {showFilters ? (
        <SectionCard
          title="Template Library Filters"
          description="Refine templates by template type before selecting one for the builder."
        >
          <div className="template-builder-filters">
            <div className="template-builder-filters__field">
              <label htmlFor="template-builder-type-filter">Template Type</label>
              <select
                id="template-builder-type-filter"
                value={selectedTypeFilter}
                onChange={(event) =>
                  setSelectedTypeFilter(event.target.value as TemplateType | "All")
                }
              >
                {typeFilterOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </SectionCard>
      ) : null}

      <div className="template-builder-grid">
        <SectionCard
          title="Template Library"
          description="Review available templates before opening the dedicated builder workspace."
        >
          {filteredTemplates.length === 0 ? (
            <EmptyState
              title="No templates found"
              description="No templates match the current search or filter settings."
            />
          ) : (
            <>
              <div className="template-builder-table-wrapper">
                <table className="template-builder-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Updated</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedTemplates.map((template) => (
                      <tr key={template.id}>
                        <td>#{template.id}</td>
                        <td>{template.name}</td>
                        <td>
                          <StatusBadge label={template.type} variant="type" />
                        </td>
                        <td>
                          <StatusBadge
                            label={template.status}
                            variant={
                              template.status === "Active" ? "active" : "disabled"
                            }
                          />
                        </td>
                        <td>{template.updatedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="template-builder-pagination">
                <span className="template-builder-pagination__info">
                  Page {page} of {totalPages}
                </span>

                <div className="template-builder-pagination__actions">
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
          title="Builder Workspace"
          description="The detailed variable editor and live preview are prepared in the next implementation step."
        >
          <div className="template-builder-placeholder">
            <strong>Builder setup pending</strong>
            <p>
              This workspace will include channel setup, variable mapping, tone
              selection, and live message preview in the next commit.
            </p>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

export default TemplateBuilderPage;
