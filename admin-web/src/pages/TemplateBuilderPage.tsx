import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import SectionCard from "../components/SectionCard";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { templateBuilderService } from "../services/templateBuilderService";
import { templateService } from "../services/templateService";
import type {
  Template,
  TemplateBuilderAudience,
  TemplateBuilderChannel,
  TemplateBuilderTone,
  TemplateType,
} from "../types/template";
import "./TemplateBuilderPage.css";

const PAGE_SIZE = 4;

const typeFilterOptions: Array<TemplateType | "All"> = [
  "All",
  "Rejection Reason",
  "Report Reason",
  "Notification",
];

const buildPreviewMessage = (
  template: Template | null,
  audience: BuilderAudience,
  tone: BuilderTone,
  fields: {
    shopName: string;
    postTitle: string;
    reason: string;
    slotName: string;
    contactEmail: string;
    adminNote: string;
  },
) => {
  if (!template) return "";

  const toneLead: Record<BuilderTone, string> = {
    Formal: "Please review the following update from the GreenMarket admin team.",
    Supportive:
      "We wanted to share a quick update and the next recommended action for this case.",
    Direct: "Review the following action immediately.",
  };

  const audienceTail: Record<BuilderAudience, string> = {
    Seller: `Affected shop: ${fields.shopName}. Related post: ${fields.postTitle}.`,
    Reporter: `Report context: ${fields.reason}. Assigned contact: ${fields.contactEmail}.`,
    "Internal Admin": `Operational focus: ${fields.slotName}. Escalation contact: ${fields.contactEmail}.`,
  };

  return [
    toneLead[tone],
    "",
    template.content,
    "",
    audienceTail[audience],
    `Reference reason: ${fields.reason}.`,
    `Admin note: ${fields.adminNote || "No additional note."}`,
  ]
    .filter(Boolean)
    .join("\n");
};

function TemplateBuilderPage() {
  const [templates] = useState<Template[]>(templateService.getTemplates());
  const initialPreset = templateBuilderService.getPreset();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<
    TemplateType | "All"
  >(initialPreset.selectedTypeFilter);
  const [page, setPage] = useState(1);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    initialPreset.selectedTemplateId,
  );
  const [channel, setChannel] = useState<TemplateBuilderChannel>(
    initialPreset.channel,
  );
  const [audience, setAudience] = useState<TemplateBuilderAudience>(
    initialPreset.audience,
  );
  const [tone, setTone] = useState<TemplateBuilderTone>(initialPreset.tone);
  const [shopName, setShopName] = useState(initialPreset.shopName);
  const [postTitle, setPostTitle] = useState(initialPreset.postTitle);
  const [reason, setReason] = useState(initialPreset.reason);
  const [slotName, setSlotName] = useState(initialPreset.slotName);
  const [contactEmail, setContactEmail] = useState(initialPreset.contactEmail);
  const [adminNote, setAdminNote] = useState(initialPreset.adminNote);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const activeTemplates = useMemo(
    () => templates.filter((template) => template.status === "Active"),
    [templates],
  );

  const filteredTemplates = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return activeTemplates.filter((template) => {
      const matchesKeyword =
        !keyword ||
        template.name.toLowerCase().includes(keyword) ||
        template.type.toLowerCase().includes(keyword) ||
        template.content.toLowerCase().includes(keyword);

      const matchesType =
        selectedTypeFilter === "All" || template.type === selectedTypeFilter;

      return matchesKeyword && matchesType;
    });
  }, [activeTemplates, searchKeyword, selectedTypeFilter]);

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

  useEffect(() => {
    if (!selectedTemplateId && activeTemplates.length > 0) {
      setSelectedTemplateId(activeTemplates[0].id);
    }
  }, [activeTemplates, selectedTemplateId]);

  useEffect(() => {
    templateBuilderService.savePreset({
      selectedTemplateId,
      selectedTypeFilter,
      channel,
      audience,
      tone,
      shopName,
      postTitle,
      reason,
      slotName,
      contactEmail,
      adminNote,
    });
  }, [
    adminNote,
    audience,
    channel,
    contactEmail,
    postTitle,
    reason,
    selectedTemplateId,
    selectedTypeFilter,
    shopName,
    slotName,
    tone,
  ]);

  const selectedTemplate =
    activeTemplates.find((template) => template.id === selectedTemplateId) ??
    null;

  const previewMessage = buildPreviewMessage(selectedTemplate, audience, tone, {
    shopName,
    postTitle,
    reason,
    slotName,
    contactEmail,
    adminNote,
  });

  const showToast = (
    message: string,
    toneValue: ToastItem["tone"] = "success",
  ) => {
    const toastId = Date.now() + Math.random();

    setToasts((prev) => [...prev, { id: toastId, message, tone: toneValue }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
    }, 2600);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <div className="template-builder-page">
      <PageHeader
        title="Template Builder"
        description="Assemble template delivery settings, switch communication tone, and preview outbound admin messaging before publishing."
      />

      <SearchToolbar
        placeholder="Search templates by name, type, or content"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
        onFilterClick={() => setShowFilters((prev) => !prev)}
        filterLabel="Filter library"
        filterSummaryItems={[selectedTypeFilter, channel, audience]}
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
          description="Choose an active template as the base content for your builder workspace."
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
                      <th>Action</th>
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
                        <td>
                          <button
                            type="button"
                            className={
                              selectedTemplateId === template.id
                                ? "template-builder-table__use template-builder-table__use--active"
                                : "template-builder-table__use"
                            }
                            onClick={() => setSelectedTemplateId(template.id)}
                          >
                            {selectedTemplateId === template.id ? "Selected" : "Use"}
                          </button>
                        </td>
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
          description="Adjust channel, audience, and sample variables to validate final message formatting."
        >
          {selectedTemplate ? (
            <div className="template-builder-form">
              <div className="template-builder-form__grid">
                <div className="template-builder-form__field">
                  <label>Selected Template</label>
                  <input type="text" value={selectedTemplate.name} disabled />
                </div>

                <div className="template-builder-form__field">
                  <label htmlFor="template-builder-channel">Channel</label>
                  <select
                    id="template-builder-channel"
                    value={channel}
                    onChange={(event) =>
                      setChannel(event.target.value as BuilderChannel)
                    }
                  >
                    <option>Email</option>
                    <option>In-App Notification</option>
                    <option>Moderation Note</option>
                  </select>
                </div>

                <div className="template-builder-form__field">
                  <label htmlFor="template-builder-audience">Audience</label>
                  <select
                    id="template-builder-audience"
                    value={audience}
                    onChange={(event) =>
                      setAudience(event.target.value as BuilderAudience)
                    }
                  >
                    <option>Seller</option>
                    <option>Reporter</option>
                    <option>Internal Admin</option>
                  </select>
                </div>

                <div className="template-builder-form__field">
                  <label htmlFor="template-builder-tone">Tone</label>
                  <select
                    id="template-builder-tone"
                    value={tone}
                    onChange={(event) =>
                      setTone(event.target.value as BuilderTone)
                    }
                  >
                    <option>Formal</option>
                    <option>Supportive</option>
                    <option>Direct</option>
                  </select>
                </div>

                <div className="template-builder-form__field">
                  <label htmlFor="template-builder-shop-name">Shop Name</label>
                  <input
                    id="template-builder-shop-name"
                    type="text"
                    value={shopName}
                    onChange={(event) => setShopName(event.target.value)}
                  />
                </div>

                <div className="template-builder-form__field">
                  <label htmlFor="template-builder-post-title">Post Title</label>
                  <input
                    id="template-builder-post-title"
                    type="text"
                    value={postTitle}
                    onChange={(event) => setPostTitle(event.target.value)}
                  />
                </div>

                <div className="template-builder-form__field">
                  <label htmlFor="template-builder-reason">Reason</label>
                  <input
                    id="template-builder-reason"
                    type="text"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                  />
                </div>

                <div className="template-builder-form__field">
                  <label htmlFor="template-builder-slot">Placement Slot</label>
                  <input
                    id="template-builder-slot"
                    type="text"
                    value={slotName}
                    onChange={(event) => setSlotName(event.target.value)}
                  />
                </div>

                <div className="template-builder-form__field">
                  <label htmlFor="template-builder-contact">
                    Contact Email
                  </label>
                  <input
                    id="template-builder-contact"
                    type="email"
                    value={contactEmail}
                    onChange={(event) => setContactEmail(event.target.value)}
                  />
                </div>
              </div>

              <div className="template-builder-form__field">
                <label htmlFor="template-builder-note">Admin Note</label>
                <textarea
                  id="template-builder-note"
                  rows={4}
                  value={adminNote}
                  onChange={(event) => setAdminNote(event.target.value)}
                />
              </div>

              <div className="template-builder-form__actions">
                <button
                  type="button"
                  className="template-builder-form__action template-builder-form__action--secondary"
                  onClick={() =>
                    showToast(
                      `Preview refreshed for ${selectedTemplate.name} via ${channel}.`,
                      "info",
                    )
                  }
                >
                  Refresh Preview
                </button>
                <button
                  type="button"
                  className="template-builder-form__action"
                  onClick={() =>
                    showToast(`${selectedTemplate.name} builder preset saved.`)
                  }
                >
                  Save Builder Preset
                </button>
                <button
                  type="button"
                  className="template-builder-form__action template-builder-form__action--secondary"
                  onClick={() => {
                    const defaultPreset =
                      templateBuilderService.getDefaultPreset();

                    setSelectedTypeFilter(defaultPreset.selectedTypeFilter);
                    setSelectedTemplateId(defaultPreset.selectedTemplateId);
                    setChannel(defaultPreset.channel);
                    setAudience(defaultPreset.audience);
                    setTone(defaultPreset.tone);
                    setShopName(defaultPreset.shopName);
                    setPostTitle(defaultPreset.postTitle);
                    setReason(defaultPreset.reason);
                    setSlotName(defaultPreset.slotName);
                    setContactEmail(defaultPreset.contactEmail);
                    setAdminNote(defaultPreset.adminNote);
                    showToast("Builder preset was reset to defaults.", "info");
                  }}
                >
                  Reset Preset
                </button>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No template selected"
              description="Choose a template from the library to continue editing builder settings."
            />
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Live Preview"
        description="Preview the composed message before it is used in moderation or notification workflows."
      >
        {selectedTemplate ? (
          <div className="template-builder-preview">
            <div className="template-builder-preview__meta">
              <StatusBadge label={selectedTemplate.type} variant="type" />
              <StatusBadge label={channel} variant="processing" />
              <StatusBadge label={tone} variant="success" />
            </div>

            <div className="template-builder-preview__card">
              <div className="template-builder-preview__header">
                <strong>{selectedTemplate.name}</strong>
                <span>{audience}</span>
              </div>

              <pre>{previewMessage}</pre>
            </div>
          </div>
        ) : (
          <EmptyState
            title="Preview unavailable"
            description="Select a template from the library to generate a live preview."
          />
        )}
      </SectionCard>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default TemplateBuilderPage;
