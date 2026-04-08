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
    title: "STEP 1",
    heading: "Choose one base template",
    headingVi: "Chọn một template gốc",
    description:
      "Pick one Active template from the library. That template becomes the starting message for this builder.",
    descriptionVi:
      "Chọn một template đang Active trong thư viện. Template đó sẽ là nội dung gốc để màn builder mô phỏng.",
  },
  {
    title: "STEP 2",
    heading: "Fill one sample case",
    headingVi: "Điền một tình huống mẫu",
    description:
      "Edit the channel, tone, shop, post, reason, and note so the screen simulates a realistic case.",
    descriptionVi:
      "Điền các trường như kênh gửi, giọng văn, shop, bài post, lý do và ghi chú để mô phỏng một tình huống thực tế.",
  },
  {
    title: "STEP 3",
    heading: "Apply draft and review preview",
    headingVi: "Áp dụng bản nháp và xem trước",
    description:
      "Click Apply Draft To Preview to refresh the preview card and confirm the final wording before using the template.",
    descriptionVi:
      "Bấm Apply Draft To Preview để cập nhật phần xem trước và kiểm tra wording cuối cùng trước khi dùng thật.",
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
    Formal:
      "Please review the following update from the GreenMarket admin team.",
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
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [pageError, setPageError] = useState("");

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

  const loadTemplates = async (showLoader = false) => {
    try {
      if (showLoader) {
        setIsInitialLoading(true);
      }

      setPageError("");
      const data = await templateService.getTemplates();
      setTemplates(data);
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Failed to load templates.",
      );
    } finally {
      if (showLoader) {
        setIsInitialLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadTemplates(true);
  }, []);

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

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTemplates.length / PAGE_SIZE),
  );

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
      showToast(
        "Select one base template before applying the preview.",
        "error",
      );
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
      `${selectedTemplate?.name ?? "Current"} sample setup was saved to this browser.`,
    );
  };

  return (
    <div className="template-builder-page">
      <PageHeader
        title="Template Builder"
        description="Preview how one existing template will look in a sample moderation or notification case. / Xem trước một template có sẵn sẽ hiển thị như thế nào trong một tình huống mẫu về moderation hoặc notification."
      />

      <SectionCard
        title="What This Screen Is For / Màn này dùng để làm gì"
        description="This page is only for preview and review. It does not create a new template and it does not send any real message. / Màn này chỉ dùng để xem trước và rà wording. Nó không tạo template mới và cũng không gửi thông báo thật."
      >
        <div className="template-builder-purpose">
          <div className="template-builder-purpose__item">
            <strong>Use this screen to preview wording</strong>
            <span>Dùng màn này để xem trước wording cuối cùng.</span>
          </div>
          <div className="template-builder-purpose__item">
            <strong>Choose one existing template first</strong>
            <span>Trước hết hãy chọn một template đã có sẵn.</span>
          </div>
          <div className="template-builder-purpose__item">
            <strong>Fill sample data only</strong>
            <span>Chỉ điền dữ liệu mẫu để mô phỏng tình huống.</span>
          </div>
          <div className="template-builder-purpose__item">
            <strong>Apply draft to refresh preview</strong>
            <span>Bấm Apply Draft To Preview để cập nhật phần xem trước.</span>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Quick Start / Cách dùng nhanh"
        description="Follow the flow from left to right. / Làm theo luồng từ trái sang phải."
      >
        <div className="template-builder-steps">
          {builderSteps.map((step) => (
            <div key={step.title} className="template-builder-step-card">
              <span className="template-builder-step-card__eyebrow">
                {step.title}
              </span>
              <strong>{step.heading}</strong>
              <p>{step.description}</p>
              <p className="template-builder-step-card__vi">
                {step.headingVi}. {step.descriptionVi}
              </p>
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
          selectedTemplate?.name ?? "No template selected",
          audience,
        ]}
      />

      {showFilters ? (
        <SectionCard
          title="Template Library Filters / Bộ lọc thư viện template"
          description="Narrow the library before choosing one template. / Lọc bớt danh sách trước khi chọn template."
        >
          <div className="template-builder-filters">
            <div className="template-builder-filters__field">
              <label htmlFor="template-builder-type-filter">
                Template Type / Loại template
              </label>
              <select
                id="template-builder-type-filter"
                value={selectedTypeFilter}
                onChange={(event) =>
                  setSelectedTypeFilter(
                    event.target.value as TemplateType | "All",
                  )
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
          title="Step 1 • Template Library / Bước 1 • Chọn template"
          description="Choose one Active template. The selected card becomes the source message for the builder. / Chọn một template đang Active. Template được chọn sẽ là nội dung gốc cho builder."
        >
          {isInitialLoading ? (
            <EmptyState
              title="Loading template library"
              description="Fetching active templates from the admin API."
            />
          ) : pageError ? (
            <EmptyState
              title="Unable to load template library"
              description={pageError}
            />
          ) : filteredTemplates.length === 0 ? (
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
          title="Step 2 • Builder Workspace / Bước 2 • Khu vực mô phỏng"
          description="Fill one sample case, then apply the draft so the preview below shows the final message output. / Điền một tình huống mẫu, sau đó áp dụng bản nháp để phần preview bên dưới hiển thị nội dung cuối cùng."
        >
          {selectedTemplate ? (
            <div className="template-builder-form">
              <div className="template-builder-callout">
                <strong>
                  This is sample data only / Đây chỉ là dữ liệu mô phỏng
                </strong>
                <p>
                  The fields below do not create a new template. They only help
                  you preview how the selected template will look in one example
                  case. / Các trường bên dưới không tạo template mới. Chúng chỉ
                  giúp bạn xem trước template đã chọn sẽ hiển thị ra sao trong
                  một tình huống ví dụ.
                </p>
              </div>

              <div className="template-builder-sync-panel">
                <div>
                  <strong>
                    {isPreviewOutdated
                      ? "Preview needs refresh"
                      : "Preview is synced with the current draft"}
                  </strong>
                  <p>
                    {isPreviewOutdated
                      ? "You edited the draft after the last apply. Click Apply Draft To Preview so the preview card matches the latest values. / Bạn đã sửa dữ liệu sau lần apply trước. Hãy bấm Apply Draft To Preview để phần preview cập nhật đúng."
                      : "The preview card already reflects the currently selected template and all sample values below. / Phần preview đã khớp với template đang chọn và toàn bộ dữ liệu mẫu hiện tại."}
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

              <div className="template-builder-field-guide">
                <h4>Field meanings / Ý nghĩa các trường</h4>
                <ul>
                  <li>
                    <strong>Selected Template</strong>: template gốc đang được
                    dùng để preview.
                  </li>
                  <li>
                    <strong>Channel</strong>: kênh hiển thị thông điệp, ví dụ
                    Email hoặc In-App Notification.
                  </li>
                  <li>
                    <strong>Audience</strong>: người nhận giả lập, ví dụ Seller,
                    Reporter, hoặc Internal Admin.
                  </li>
                  <li>
                    <strong>Tone</strong>: giọng văn của thông điệp.
                  </li>
                  <li>
                    <strong>
                      Shop Name / Post Title / Reason / Slot / Contact / Admin
                      Note
                    </strong>
                    : dữ liệu mẫu để chèn vào preview.
                  </li>
                </ul>
              </div>

              <div className="template-builder-form__section">
                <div className="template-builder-form__section-header">
                  <strong>Message Setup / Cấu hình thông điệp</strong>
                  <span>
                    Choose how the selected template is presented. / Chọn cách
                    template đã chọn sẽ được hiển thị.
                  </span>
                </div>

                <div className="template-builder-form__grid">
                  <div className="template-builder-form__field">
                    <label>Selected Template / Template đã chọn</label>
                    <input type="text" value={selectedTemplate.name} disabled />
                  </div>

                  <div className="template-builder-form__field">
                    <label htmlFor="template-builder-channel">
                      Channel / Kênh hiển thị
                    </label>
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
                    <label htmlFor="template-builder-audience">
                      Audience / Đối tượng nhận
                    </label>
                    <select
                      id="template-builder-audience"
                      value={audience}
                      onChange={(event) =>
                        setAudience(
                          event.target.value as TemplateBuilderAudience,
                        )
                      }
                    >
                      <option>Seller</option>
                      <option>Reporter</option>
                      <option>Internal Admin</option>
                    </select>
                  </div>

                  <div className="template-builder-form__field">
                    <label htmlFor="template-builder-tone">
                      Tone / Giọng văn
                    </label>
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
                  <strong>Sample Case Details / Chi tiết tình huống mẫu</strong>
                  <span>
                    Fill the sample values used in preview. / Điền dữ liệu mẫu
                    sẽ được dùng trong preview.
                  </span>
                </div>

                <div className="template-builder-form__grid">
                  <div className="template-builder-form__field">
                    <label htmlFor="template-builder-shop-name">
                      Shop Name / Tên shop mẫu
                    </label>
                    <input
                      id="template-builder-shop-name"
                      type="text"
                      value={shopName}
                      onChange={(event) => setShopName(event.target.value)}
                    />
                  </div>

                  <div className="template-builder-form__field">
                    <label htmlFor="template-builder-post-title">
                      Post Title / Tiêu đề bài post mẫu
                    </label>
                    <input
                      id="template-builder-post-title"
                      type="text"
                      value={postTitle}
                      onChange={(event) => setPostTitle(event.target.value)}
                    />
                  </div>

                  <div className="template-builder-form__field">
                    <label htmlFor="template-builder-reason">
                      Reason / Lý do mẫu
                    </label>
                    <input
                      id="template-builder-reason"
                      type="text"
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                    />
                  </div>

                  <div className="template-builder-form__field">
                    <label htmlFor="template-builder-slot">
                      Placement Slot / Vị trí hiển thị mẫu
                    </label>
                    <input
                      id="template-builder-slot"
                      type="text"
                      value={slotName}
                      onChange={(event) => setSlotName(event.target.value)}
                    />
                  </div>

                  <div className="template-builder-form__field">
                    <label htmlFor="template-builder-contact">
                      Contact Email / Email liên hệ mẫu
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
                  <label htmlFor="template-builder-note">
                    Admin Note / Ghi chú admin mẫu
                  </label>
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
                    Apply first to review the exact final wording. / Trước hết
                    hãy bấm Apply để xem wording cuối cùng chính xác.
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
                    Save This Sample Setup
                  </button>
                  <button
                    type="button"
                    className="template-builder-form__action template-builder-form__action--secondary"
                    onClick={handleRestoreDefault}
                  >
                    Reset Sample Data
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
        title="Step 3 • Live Preview / Bước 3 • Xem trước"
        description="This preview always reflects the last applied draft. / Phần này luôn hiển thị đúng dữ liệu của lần Apply gần nhất."
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
                ? "The draft was changed after the last apply. Click Apply Draft To Preview so this card matches the latest values. / Bạn đã sửa dữ liệu sau lần apply trước. Hãy bấm Apply Draft To Preview để preview khớp lại."
                : "Preview is in sync with the current draft and ready for review. / Preview đang khớp với dữ liệu hiện tại và sẵn sàng để review."}
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
