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

const templateTypeLabels: Record<TemplateType | "All", string> = {
  All: "Tất cả loại mẫu",
  "Rejection Reason": "Lý do từ chối",
  "Report Reason": "Lý do báo cáo",
  Notification: "Thông báo",
};

const channelLabels: Record<TemplateBuilderChannel, string> = {
  Email: "Email",
  "In-App Notification": "Thông báo trong hệ thống",
  "Moderation Note": "Ghi chú kiểm duyệt",
};

const audienceLabels: Record<TemplateBuilderAudience, string> = {
  Seller: "Người bán",
  Reporter: "Người báo cáo",
  "Internal Admin": "Quản trị nội bộ",
};

const toneLabels: Record<TemplateBuilderTone, string> = {
  Formal: "Trang trọng",
  Supportive: "Hỗ trợ",
  Direct: "Trực tiếp",
};

const builderSteps = [
  {
    title: "BƯỚC 1",
    heading: "Chọn một template gốc",
    description:
      "Chọn một template đang Active trong thư viện. Template đó sẽ là nội dung gốc để builder mô phỏng.",
  },
  {
    title: "BƯỚC 2",
    heading: "Điền một tình huống mẫu",
    description:
      "Điền các trường như kênh gửi, giọng văn, shop, bài post, lý do và ghi chú để mô phỏng tình huống thực tế.",
  },
  {
    title: "BƯỚC 3",
    heading: "Áp dụng bản nháp và xem trước",
    description:
      "Bấm Áp dụng để cập nhật phần xem trước và kiểm tra nội dung cuối cùng trước khi dùng.",
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
    Formal: "Đây là cập nhật chính thức từ đội ngũ quản trị GreenMarket.",
    Supportive:
      "GreenMarket gửi bạn bản cập nhật nhanh cùng hướng xử lý đề xuất cho tình huống này.",
    Direct: "Vui lòng xử lý ngay nội dung sau.",
  };

  const audienceTail: Record<TemplateBuilderAudience, string> = {
    Seller: `Shop liên quan: ${fields.shopName}. Bài đăng liên quan: ${fields.postTitle}.`,
    Reporter: `Ngữ cảnh báo cáo: ${fields.reason}. Liên hệ phụ trách: ${fields.contactEmail}.`,
    "Internal Admin": `Điểm vận hành cần theo dõi: ${fields.slotName}. Liên hệ xử lý: ${fields.contactEmail}.`,
  };

  return [
    toneLead[tone],
    "",
    template.content,
    "",
    audienceTail[audience],
    `Lý do tham chiếu: ${fields.reason}.`,
    `Ghi chú quản trị: ${fields.adminNote || "Không có ghi chú bổ sung."}`,
  ]
    .filter(Boolean)
    .join("\n");
};

function TemplateBuilderPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const initialPreset = templateBuilderService.getDefaultPreset();
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
  const [lastAppliedAt, setLastAppliedAt] = useState("Chưa áp dụng lần nào");
  const [isPreviewHighlighted, setIsPreviewHighlighted] = useState(false);
  const [isPresetSaving, setIsPresetSaving] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const previewRef = useRef<HTMLDivElement | null>(null);

  const applyPresetToState = (preset: TemplateBuilderPreset) => {
    setSelectedTypeFilter(preset.selectedTypeFilter);
    setSelectedTemplateId(preset.selectedTemplateId);
    setChannel(preset.channel);
    setAudience(preset.audience);
    setTone(preset.tone);
    setShopName(preset.shopName);
    setPostTitle(preset.postTitle);
    setReason(preset.reason);
    setSlotName(preset.slotName);
    setContactEmail(preset.contactEmail);
    setAdminNote(preset.adminNote);
    setAppliedPreset({ ...preset });
  };

  const loadTemplates = async (showLoader = false) => {
    try {
      if (showLoader) {
        setIsInitialLoading(true);
      }

      setPageError("");
      const [data, preset] = await Promise.all([
        templateService.getTemplates(),
        templateBuilderService.getPreset(),
      ]);
      setTemplates(data);
      applyPresetToState(preset);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách mẫu mô phỏng.",
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
        "Hãy chọn một mẫu gốc trước khi áp dụng vào phần xem trước.",
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
      `Đã cập nhật phần xem trước cho ${selectedTemplate?.name ?? "mẫu đang chọn"}.`,
      "info",
    );
  };

  const handleRestoreDefault = async () => {
    try {
      setIsPresetSaving(true);
      const defaultPreset = await templateBuilderService.resetPreset();
      applyPresetToState(defaultPreset);
      setLastAppliedAt("Đã khôi phục cấu hình mặc định");
      showToast("Đã khôi phục cấu hình mô phỏng mặc định.", "info");
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Không thể khôi phục cấu hình mô phỏng mặc định.",
        "error",
      );
    } finally {
      setIsPresetSaving(false);
    }
  };

  const handleSavePreset = async () => {
    try {
      setIsPresetSaving(true);
      await templateBuilderService.savePreset(draftPreset);
      showToast(
        `Đã lưu cấu hình mô phỏng cho ${selectedTemplate?.name ?? "mẫu hiện tại"}.`,
      );
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Không thể lưu cấu hình mô phỏng.",
        "error",
      );
    } finally {
      setIsPresetSaving(false);
    }
  };

  return (
    <div className="template-builder-page">
      <PageHeader
        title="Mô Phỏng Mẫu Nội Dung"
        description="Xem trước một mẫu nội dung có sẵn trong tình huống kiểm duyệt hoặc thông báo giả lập trước khi dùng thật."
      />

      <SectionCard
        title="Màn Này Dùng Để Làm Gì"
        description="Màn này chỉ dùng để xem trước, rà nội dung và lưu cấu hình mô phỏng. Nó không tạo mẫu mới và cũng không gửi thông báo thật."
      >
        <div className="template-builder-purpose">
          <div className="template-builder-purpose__item">
            <strong>Xem trước nội dung cuối</strong>
            <span>Dùng màn này để rà câu chữ trước khi áp dụng thực tế.</span>
          </div>
          <div className="template-builder-purpose__item">
            <strong>Chọn một mẫu gốc có sẵn</strong>
            <span>Trước hết hãy chọn một mẫu đang hoạt động trong thư viện.</span>
          </div>
          <div className="template-builder-purpose__item">
            <strong>Điền dữ liệu mẫu</strong>
            <span>Chỉ nhập dữ liệu mô phỏng để tái hiện một ca sử dụng thực tế.</span>
          </div>
          <div className="template-builder-purpose__item">
            <strong>Áp dụng bản nháp để cập nhật xem trước</strong>
            <span>Bấm Áp dụng vào xem trước để phần preview phản ánh đúng dữ liệu hiện tại.</span>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Cách Dùng Nhanh"
        description="Làm theo 3 bước từ trái sang phải để chọn mẫu, nhập dữ liệu mô phỏng và xem kết quả cuối."
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
        placeholder="Tìm mẫu gốc theo tên, loại hoặc nội dung"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
        onFilterClick={() => setShowFilters((prev) => !prev)}
        filterLabel="Lọc thư viện"
        filterSummaryItems={[
          templateTypeLabels[selectedTypeFilter],
          selectedTemplate?.name ?? "Chưa chọn mẫu",
          audienceLabels[audience],
        ]}
      />

      {showFilters ? (
        <SectionCard
          title="Bộ Lọc Thư Viện Mẫu"
          description="Thu hẹp danh sách mẫu trước khi chọn một mẫu gốc cho phần mô phỏng."
        >
          <div className="template-builder-filters">
            <div className="template-builder-filters__field">
              <label htmlFor="template-builder-type-filter">Loại mẫu</label>
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
                    {templateTypeLabels[option]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </SectionCard>
      ) : null}

      <div className="template-builder-grid">
        <SectionCard
          title="Bước 1 • Chọn Mẫu Gốc"
          description="Chọn một mẫu đang hoạt động. Mẫu được chọn sẽ là nội dung nguồn cho màn mô phỏng."
        >
          {isInitialLoading ? (
            <EmptyState
              title="Đang tải thư viện mẫu"
              description="Đang lấy danh sách mẫu hoạt động từ hệ thống quản trị."
            />
          ) : pageError ? (
            <EmptyState
              title="Không thể tải thư viện mẫu"
              description={pageError}
            />
          ) : filteredTemplates.length === 0 ? (
            <EmptyState
              title="Không tìm thấy mẫu"
              description="Không có mẫu nào khớp với từ khóa hoặc bộ lọc hiện tại."
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
                        <p>Cập nhật lần cuối {template.updatedAt}</p>
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
                          ? "Đang dùng trong mô phỏng"
                          : "Chọn mẫu này"}
                      </button>
                    </div>

                    <div className="template-builder-library__meta">
                      <StatusBadge
                        label={templateTypeLabels[template.type]}
                        variant="type"
                      />
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
                  Trang {page} / {totalPages}
                </span>

                <div className="template-builder-pagination__actions">
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={page === 1}
                  >
                    Trước
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={page === totalPages}
                  >
                    Tiếp
                  </button>
                </div>
              </div>
            </>
          )}
        </SectionCard>

        <SectionCard
          title="Bước 2 • Điền Dữ Liệu Mô Phỏng"
          description="Nhập một tình huống mẫu, sau đó áp dụng bản nháp để phần xem trước phía dưới hiển thị nội dung cuối cùng."
        >
          {selectedTemplate ? (
            <div className="template-builder-form">
              <div className="template-builder-callout">
                <strong>Đây chỉ là dữ liệu mô phỏng</strong>
                <p>
                  Các trường bên dưới không tạo mẫu mới. Chúng chỉ giúp bạn mô
                  phỏng cách mẫu đã chọn sẽ hiển thị trong một tình huống ví dụ.
                </p>
              </div>

              <div className="template-builder-sync-panel">
                <div>
                  <strong>
                    {isPreviewOutdated
                      ? "Phần xem trước cần cập nhật lại"
                      : "Phần xem trước đã đồng bộ với bản nháp"}
                  </strong>
                  <p>
                    {isPreviewOutdated
                      ? "Bạn đã sửa bản nháp sau lần áp dụng gần nhất. Hãy bấm Áp dụng vào xem trước để đồng bộ lại phần preview."
                      : "Phần xem trước hiện đã phản ánh đúng mẫu đang chọn và toàn bộ dữ liệu mô phỏng hiện tại."}
                  </p>
                </div>
                <span
                  className={`template-builder-sync-panel__badge${
                    isPreviewOutdated
                      ? " template-builder-sync-panel__badge--warning"
                      : ""
                  }`}
                >
                  {isPreviewOutdated
                    ? "Bản nháp đã thay đổi"
                    : "Đã đồng bộ xem trước"}
                </span>
              </div>

              <div className="template-builder-field-guide">
                <h4>Ý Nghĩa Các Trường</h4>
                <ul>
                  <li>
                    <strong>Mẫu đã chọn</strong>: mẫu nội dung gốc đang được dùng để mô phỏng.
                  </li>
                  <li>
                    <strong>Kênh</strong>: nơi hiển thị thông điệp, ví dụ email hoặc thông báo trong hệ thống.
                  </li>
                  <li>
                    <strong>Đối tượng nhận</strong>: người nhận mô phỏng, ví dụ người bán, người báo cáo hoặc quản trị nội bộ.
                  </li>
                  <li>
                    <strong>Giọng văn</strong>: phong cách thể hiện của thông điệp.
                  </li>
                  <li>
                    <strong>
                      Tên shop / Tiêu đề bài / Lý do / Vị trí hiển thị / Email liên hệ / Ghi chú quản trị
                    </strong>
                    : dữ liệu mẫu sẽ được chèn vào phần xem trước.
                  </li>
                </ul>
              </div>

              <div className="template-builder-form__section">
                <div className="template-builder-form__section-header">
                  <strong>Cấu Hình Thông Điệp</strong>
                  <span>
                    Chọn cách mẫu đã chọn sẽ được trình bày trong tình huống mô phỏng.
                  </span>
                </div>

                <div className="template-builder-form__grid">
                  <div className="template-builder-form__field">
                    <label>Mẫu đã chọn</label>
                    <input type="text" value={selectedTemplate.name} disabled />
                  </div>

                  <div className="template-builder-form__field">
                    <label htmlFor="template-builder-channel">Kênh hiển thị</label>
                    <select
                      id="template-builder-channel"
                      value={channel}
                      onChange={(event) =>
                        setChannel(event.target.value as TemplateBuilderChannel)
                      }
                    >
                      <option value="Email">{channelLabels.Email}</option>
                      <option value="In-App Notification">
                        {channelLabels["In-App Notification"]}
                      </option>
                      <option value="Moderation Note">
                        {channelLabels["Moderation Note"]}
                      </option>
                    </select>
                  </div>

                  <div className="template-builder-form__field">
                    <label htmlFor="template-builder-audience">Đối tượng nhận</label>
                    <select
                      id="template-builder-audience"
                      value={audience}
                      onChange={(event) =>
                        setAudience(
                          event.target.value as TemplateBuilderAudience,
                        )
                      }
                    >
                      <option value="Seller">{audienceLabels.Seller}</option>
                      <option value="Reporter">
                        {audienceLabels.Reporter}
                      </option>
                      <option value="Internal Admin">
                        {audienceLabels["Internal Admin"]}
                      </option>
                    </select>
                  </div>

                  <div className="template-builder-form__field">
                    <label htmlFor="template-builder-tone">Giọng văn</label>
                    <select
                      id="template-builder-tone"
                      value={tone}
                      onChange={(event) =>
                        setTone(event.target.value as TemplateBuilderTone)
                      }
                    >
                      <option value="Formal">{toneLabels.Formal}</option>
                      <option value="Supportive">
                        {toneLabels.Supportive}
                      </option>
                      <option value="Direct">{toneLabels.Direct}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="template-builder-form__section">
                <div className="template-builder-form__section-header">
                  <strong>Chi Tiết Tình Huống Mẫu</strong>
                  <span>
                    Điền các dữ liệu mô phỏng sẽ được dùng trong phần xem trước.
                  </span>
                </div>

                <div className="template-builder-form__grid">
                  <div className="template-builder-form__field">
                    <label htmlFor="template-builder-shop-name">Tên shop mẫu</label>
                    <input
                      id="template-builder-shop-name"
                      type="text"
                      value={shopName}
                      onChange={(event) => setShopName(event.target.value)}
                    />
                  </div>

                  <div className="template-builder-form__field">
                    <label htmlFor="template-builder-post-title">Tiêu đề bài đăng mẫu</label>
                    <input
                      id="template-builder-post-title"
                      type="text"
                      value={postTitle}
                      onChange={(event) => setPostTitle(event.target.value)}
                    />
                  </div>

                  <div className="template-builder-form__field">
                    <label htmlFor="template-builder-reason">Lý do mẫu</label>
                    <input
                      id="template-builder-reason"
                      type="text"
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                    />
                  </div>

                  <div className="template-builder-form__field">
                    <label htmlFor="template-builder-slot">Vị trí hiển thị mẫu</label>
                    <input
                      id="template-builder-slot"
                      type="text"
                      value={slotName}
                      onChange={(event) => setSlotName(event.target.value)}
                    />
                  </div>

                  <div className="template-builder-form__field">
                    <label htmlFor="template-builder-contact">Email liên hệ mẫu</label>
                    <input
                      id="template-builder-contact"
                      type="email"
                      value={contactEmail}
                      onChange={(event) => setContactEmail(event.target.value)}
                    />
                  </div>
                </div>

                <div className="template-builder-form__field">
                  <label htmlFor="template-builder-note">Ghi chú quản trị mẫu</label>
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
                      ? "Bản nháp đã thay đổi sau lần áp dụng gần nhất"
                      : "Phần xem trước hiện đã mới nhất"}
                  </strong>
                  <span>
                    Hãy áp dụng bản nháp trước để xem chính xác nội dung cuối cùng.
                  </span>
                </div>

                <div className="template-builder-form__actions">
                  <button
                    type="button"
                    className="template-builder-form__action template-builder-form__action--secondary"
                    onClick={applyWorkspaceToPreview}
                  >
                    Áp dụng vào xem trước
                  </button>
                  <button
                    type="button"
                    className="template-builder-form__action"
                    onClick={() => void handleSavePreset()}
                    disabled={isPresetSaving}
                  >
                    {isPresetSaving ? "Đang lưu..." : "Lưu cấu hình mô phỏng"}
                  </button>
                  <button
                    type="button"
                    className="template-builder-form__action template-builder-form__action--secondary"
                    onClick={() => void handleRestoreDefault()}
                    disabled={isPresetSaving}
                  >
                    Đặt lại dữ liệu mẫu
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              title="Chưa chọn mẫu"
              description="Hãy chọn một mẫu từ thư viện để tiếp tục cấu hình phần mô phỏng."
            />
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Bước 3 • Xem Trước Nội Dung"
        description="Phần này luôn hiển thị đúng dữ liệu của lần áp dụng gần nhất."
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
                ? "Bạn đã thay đổi bản nháp sau lần áp dụng gần nhất. Hãy bấm Áp dụng vào xem trước để thẻ này cập nhật lại."
                : "Phần xem trước đang đồng bộ với bản nháp hiện tại và sẵn sàng để rà soát."}
            </div>

            <div className="template-builder-preview__summary">
              <div>
                <strong>Nguồn xem trước</strong>
                <span>{appliedTemplate.name}</span>
              </div>
              <div>
                <strong>Áp dụng lúc</strong>
                <span>{lastAppliedAt}</span>
              </div>
              <div>
                <strong>Mục tiêu hiển thị</strong>
                <span>
                  {channelLabels[appliedPreset.channel]} •{" "}
                  {audienceLabels[appliedPreset.audience]}
                </span>
              </div>
            </div>

            <div className="template-builder-preview__meta">
              <StatusBadge
                label={templateTypeLabels[appliedTemplate.type]}
                variant="type"
              />
              <StatusBadge
                label={channelLabels[appliedPreset.channel]}
                variant="processing"
              />
              <StatusBadge
                label={toneLabels[appliedPreset.tone]}
                variant="success"
              />
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
                <span>{audienceLabels[appliedPreset.audience]}</span>
              </div>

              <div className="template-builder-preview__context">
                <span>Shop: {appliedPreset.shopName}</span>
                <span>Bài đăng: {appliedPreset.postTitle}</span>
                <span>Lý do: {appliedPreset.reason}</span>
                <span>Vị trí: {appliedPreset.slotName}</span>
              </div>

              <pre>{previewMessage}</pre>
            </div>
          </div>
        ) : (
          <EmptyState
            title="Chưa có phần xem trước"
            description="Hãy chọn một mẫu từ thư viện để tạo phần xem trước nội dung."
          />
        )}
      </SectionCard>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default TemplateBuilderPage;
