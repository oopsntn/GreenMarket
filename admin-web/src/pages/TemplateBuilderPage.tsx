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

const builderSteps = [
  {
    title: "1. Chon Mau Noi Dung",
    description:
      "Chon mot template dang Active o thu vien de lam noi dung goc cho thong diep.",
  },
  {
    title: "2. Dieu Chinh Du Lieu Mau",
    description:
      "Nhap channel, doi tuong nhan, tone, shop, bai dang va ly do de mo phong tinh huong thuc te.",
  },
  {
    title: "3. Ap Vao Preview Va Luu",
    description:
      "Bam Apply to Preview de cap nhat ban xem truoc; bam Save Demo Preset neu muon giu bo tham so nay cho lan sau.",
  },
];

const buildPreviewMessage = (
  template: Template | null,
  audience: TemplateBuilderAudience,
  tone: TemplateBuilderTone,
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

  const toneLead: Record<TemplateBuilderTone, string> = {
    Formal: "Please review the following update from the GreenMarket admin team.",
    Supportive:
      "We wanted to share a quick update and the next recommended action for this case.",
    Direct: "Review the following action immediately.",
  };

  const audienceTail: Record<TemplateBuilderAudience, string> = {
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
  const [appliedPreset, setAppliedPreset] = useState({
    ...initialPreset,
  });
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
    if (!appliedPreset.selectedTemplateId && activeTemplates.length > 0) {
      setAppliedPreset((prev) => ({
        ...prev,
        selectedTemplateId: activeTemplates[0].id,
      }));
    }
  }, [activeTemplates, appliedPreset.selectedTemplateId]);

  const selectedTemplate =
    activeTemplates.find((template) => template.id === selectedTemplateId) ??
    null;

  const appliedTemplate =
    activeTemplates.find(
      (template) => template.id === appliedPreset.selectedTemplateId,
    ) ??
    selectedTemplate ??
    null;

  const previewMessage = buildPreviewMessage(
    appliedTemplate,
    appliedPreset.audience,
    appliedPreset.tone,
    {
      shopName: appliedPreset.shopName,
      postTitle: appliedPreset.postTitle,
      reason: appliedPreset.reason,
      slotName: appliedPreset.slotName,
      contactEmail: appliedPreset.contactEmail,
      adminNote: appliedPreset.adminNote,
    },
  );

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

      <SectionCard
        title="How Template Builder Works"
        description="Use this workspace to simulate the message an admin would send in moderation or notification flows."
      >
        <div className="template-builder-steps">
          {builderSteps.map((step) => (
            <div key={step.title} className="template-builder-step-card">
              <strong>{step.title}</strong>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SearchToolbar
        placeholder="Search templates by name, type, or content"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
        onFilterClick={() => setShowFilters((prev) => !prev)}
        filterLabel="Filter library"
        filterSummaryItems={[
          selectedTypeFilter,
          selectedTemplate?.type ?? "No template selected",
          audience,
        ]}
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
          description="Choose one active template, then use it as the base script for the builder workspace on the right."
        >
          {filteredTemplates.length === 0 ? (
            <EmptyState
              title="No templates found"
              description="No templates match the current search or filter settings."
            />
          ) : (
            <>
              <div className="template-builder-library">
                {paginatedTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`template-builder-library__card${
                      selectedTemplateId === template.id
                        ? " template-builder-library__card--selected"
                        : ""
                    }`}
                  >
                    <div className="template-builder-library__header">
                      <div>
                        <strong>
                          #{template.id} {template.name}
                        </strong>
                        <p>Last updated {template.updatedAt}</p>
                      </div>

                      <button
                        type="button"
                        className={
                          selectedTemplateId === template.id
                            ? "template-builder-library__use template-builder-library__use--active"
                            : "template-builder-library__use"
                        }
                        onClick={() => setSelectedTemplateId(template.id)}
                      >
                        {selectedTemplateId === template.id
                          ? "Using in Builder"
                          : "Use Template"}
                      </button>
                    </div>

                    <div className="template-builder-library__meta">
                      <StatusBadge label={template.type} variant="type" />
                      <StatusBadge label={template.status} variant="active" />
                    </div>

                    <p className="template-builder-library__snippet">
                      {template.content}
                    </p>
                  </div>
                ))}
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
          description="Set the sample situation below, then apply the draft to the preview so you can validate the final message before using it."
        >
          {selectedTemplate ? (
            <div className="template-builder-form">
              <div className="template-builder-form__guide">
                <strong>Current flow</strong>
                <p>
                  Chinh cac truong du lieu mau o day, sau do bam{" "}
                  <strong>Apply to Preview</strong> de cap nhat khung xem truoc.
                  Neu muon giu bo tham so nay cho lan demo sau, bam{" "}
                  <strong>Save Demo Preset</strong>.
                </p>
              </div>

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
                        setChannel(event.target.value as TemplateBuilderChannel)
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
                      setAudience(event.target.value as TemplateBuilderAudience)
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
                      setTone(event.target.value as TemplateBuilderTone)
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
                  onClick={() => {
                    setAppliedPreset({
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
                    showToast(
                      `Preview updated for ${selectedTemplate.name}.`,
                      "info",
                    );
                  }}
                >
                  Apply to Preview
                </button>
                <button
                  type="button"
                  className="template-builder-form__action"
                  onClick={() => {
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
                    showToast(
                      `${selectedTemplate.name} demo preset was saved to this browser.`,
                    );
                  }}
                >
                  Save Demo Preset
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
                    setAppliedPreset({ ...defaultPreset });
                    showToast(
                      "Template Builder was reset to the default sample scenario.",
                      "info",
                    );
                  }}
                >
                  Restore Default Sample
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
        {appliedTemplate ? (
          <div className="template-builder-preview">
            <div className="template-builder-preview__meta">
              <StatusBadge label={appliedTemplate.type} variant="type" />
              <StatusBadge label={appliedPreset.channel} variant="processing" />
              <StatusBadge label={appliedPreset.tone} variant="success" />
            </div>

            <div className="template-builder-preview__card">
              <div className="template-builder-preview__header">
                <strong>{appliedTemplate.name}</strong>
                <span>{appliedPreset.audience}</span>
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
