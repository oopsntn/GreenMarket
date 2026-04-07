import { useEffect, useMemo, useRef, useState } from "react";
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
  TemplateBuilderPreset,
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
    title: "Step 1",
    heading: "Choose one base template",
    description:
      "Pick one Active template from the library. That template becomes the starting message for this builder.",
  },
  {
    title: "Step 2",
    heading: "Fill one demo case",
    description:
      "Edit the channel, tone, shop, post, reason, and note so the screen simulates a realistic case.",
  },
  {
    title: "Step 3",
    heading: "Apply draft and review preview",
    description:
      "Click Apply Draft To Preview to refresh the preview card and confirm the final wording before using the template.",
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
  const [appliedPreset, setAppliedPreset] = useState<TemplateBuilderPreset>({
    ...initialPreset,
  });
  const [lastAppliedAt, setLastAppliedAt] = useState("Not applied yet");
  const [isPreviewHighlighted, setIsPreviewHighlighted] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const previewRef = useRef<HTMLDivElement | null>(null);

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

  const selectedTemplate =
    activeTemplates.find((template) => template.id === selectedTemplateId) ??
    null;

  useEffect(() => {
    if (!appliedPreset.selectedTemplateId && selectedTemplate) {
      setAppliedPreset((prev) => ({
        ...prev,
        selectedTemplateId: selectedTemplate.id,
      }));
    }
  }, [appliedPreset.selectedTemplateId, selectedTemplate]);

  const appliedTemplate =
    activeTemplates.find(
      (template) => template.id === appliedPreset.selectedTemplateId,
    ) ??
    selectedTemplate ??
    null;

  const draftPreset: TemplateBuilderPreset = {
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
  };

  const isPreviewOutdated =
    JSON.stringify(draftPreset) !== JSON.stringify(appliedPreset);

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

  const applyWorkspaceToPreview = () => {
    if (!selectedTemplateId) {
      showToast("Select one base template before applying the preview.", "error");
      return;
    }

    setAppliedPreset(draftPreset);
    setLastAppliedAt(
      new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    );
    setIsPreviewHighlighted(true);

    window.setTimeout(() => {
      setIsPreviewHighlighted(false);
    }, 1800);

    previewRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    showToast(
      `Preview updated for ${selectedTemplate?.name ?? "the selected template"}.`,
      "info",
    );
  };

  const handleRestoreDefault = () => {
    const defaultPreset = templateBuilderService.getDefaultPreset();

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
    setLastAppliedAt("Restored to default sample");
    showToast(
      "Template Builder was restored to the default sample scenario.",
      "info",
    );
  };

  const handleSavePreset = () => {
    templateBuilderService.savePreset(draftPreset);
    showToast(
      `${selectedTemplate?.name ?? "Current"} demo preset was saved to this browser.`,
    );
  };

  return (
    <div className="template-builder-page">
      <PageHeader
        title="Template Builder"
        description="Choose one template, fill one demo case, and review the exact preview before the template is used in moderation or notification workflows."
      />

      <SectionCard
        title="Quick Start"
        description="Follow these three steps from left to right. This screen is only for preview and review, not for sending messages."
      >
        <div className="template-builder-steps">
          {builderSteps.map((step) => (
            <div key={step.title} className="template-builder-step-card">
              <span className="template-builder-step-card__eyebrow">
                {step.title}
              </span>
              <strong>{step.heading}</strong>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SearchToolbar
        placeholder="Search base templates by name, type, or content"
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
          description="Narrow the library before choosing a base template for the builder."
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
          title="Step 1 • Template Library"
          description="Choose one Active template. The selected card becomes the source message for the builder."
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
                          ? "Using In Builder"
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
          title="Step 2 • Builder Workspace"
          description="Fill one sample case, then apply the draft so the preview below shows the final message output."
        >
          {selectedTemplate ? (
            <div className="template-builder-form">
              <div className="template-builder-sync-panel">
                <div>
                  <strong>
                    {isPreviewOutdated
                      ? "Preview needs refresh"
                      : "Preview is synced with the current draft"}
                  </strong>
                  <p>
                    {isPreviewOutdated
                      ? "You edited the draft after the last apply. Click Apply Draft To Preview so the preview card matches the latest values."
                      : "The preview card already reflects the currently selected template and all sample values below."}
                  </p>
                </div>
                <span
                  className={`template-builder-sync-panel__badge${
                    isPreviewOutdated
                      ? " template-builder-sync-panel__badge--warning"
                      : ""
                  }`}
                >
                  {isPreviewOutdated ? "Draft Updated" : "Preview Synced"}
                </span>
              </div>

              <div className="template-builder-form__guide">
                <strong>How this workspace works</strong>
                <p>
                  The fields below create one sample situation only. Nothing is
                  sent from this screen. The preview becomes authoritative only
                  after you click <strong>Apply Draft To Preview</strong>.
                </p>
              </div>

              <div className="template-builder-form__section">
                <div className="template-builder-form__section-header">
                  <strong>Message Setup</strong>
                  <span>
                    Choose where the message appears and what tone it should use.
                  </span>
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
                </div>
              </div>

              <div className="template-builder-form__section">
                <div className="template-builder-form__section-header">
                  <strong>Sample Case Details</strong>
                  <span>
                    Fill the sample shop, post, reason, slot, and contact fields
                    used to build the preview below.
                  </span>
                </div>

                <div className="template-builder-form__grid">
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
                    <label htmlFor="template-builder-post-title">
                      Post Title
                    </label>
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
              </div>

              <div className="template-builder-form__action-panel">
                <div className="template-builder-form__actions-note">
                  <strong>
                    {isPreviewOutdated
                      ? "Draft changed after the last apply"
                      : "Preview is already up to date"}
                  </strong>
                  <span>
                    Apply first to review the exact final wording, then save the
                    sample setup only if you want to reuse it later in this
                    browser.
                  </span>
                </div>

                <div className="template-builder-form__actions">
                  <button
                    type="button"
                    className="template-builder-form__action template-builder-form__action--secondary"
                    onClick={applyWorkspaceToPreview}
                  >
                    Apply Draft To Preview
                  </button>
                  <button
                    type="button"
                    className="template-builder-form__action"
                    onClick={handleSavePreset}
                  >
                    Save Demo Preset
                  </button>
                  <button
                    type="button"
                    className="template-builder-form__action template-builder-form__action--secondary"
                    onClick={handleRestoreDefault}
                  >
                    Restore Default Sample
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No template selected"
              description="Choose a template from the library to continue editing the builder workspace."
            />
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Step 3 • Live Preview"
        description="This preview always reflects the last applied draft. Review it here before you approve the wording for real admin use."
      >
        {appliedTemplate ? (
          <div className="template-builder-preview">
            <div
              className={`template-builder-preview__banner${
                isPreviewOutdated
                  ? " template-builder-preview__banner--warning"
                  : ""
              }`}
            >
              {isPreviewOutdated
                ? "The draft was changed after the last apply. Click Apply Draft To Preview so this card matches the latest values."
                : "Preview is in sync with the current draft and ready for review."}
            </div>

            <div className="template-builder-preview__summary">
              <div>
                <strong>Preview source</strong>
                <span>{appliedTemplate.name}</span>
              </div>
              <div>
                <strong>Applied at</strong>
                <span>{lastAppliedAt}</span>
              </div>
              <div>
                <strong>Preview target</strong>
                <span>
                  {appliedPreset.channel} • {appliedPreset.audience}
                </span>
              </div>
            </div>

            <div className="template-builder-preview__meta">
              <StatusBadge label={appliedTemplate.type} variant="type" />
              <StatusBadge label={appliedPreset.channel} variant="processing" />
              <StatusBadge label={appliedPreset.tone} variant="success" />
            </div>

            <div
              ref={previewRef}
              className={`template-builder-preview__card${
                isPreviewHighlighted
                  ? " template-builder-preview__card--highlighted"
                  : ""
              }`}
            >
              <div className="template-builder-preview__header">
                <strong>{appliedTemplate.name}</strong>
                <span>{appliedPreset.audience}</span>
              </div>

              <div className="template-builder-preview__context">
                <span>Shop: {appliedPreset.shopName}</span>
                <span>Post: {appliedPreset.postTitle}</span>
                <span>Reason: {appliedPreset.reason}</span>
                <span>Slot: {appliedPreset.slotName}</span>
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
