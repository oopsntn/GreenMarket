import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { templateService } from "../services/templateService";
import type {
  Template,
  TemplateFormState,
  TemplateStatus,
  TemplateType,
} from "../types/template";
import "./TemplatesPage.css";

type ModalMode = "create" | "edit" | "view" | "clone";

const PAGE_SIZE = 6;

const templateTypeOptions: Array<TemplateType | "All"> = [
  "All",
  "Rejection Reason",
  "Report Reason",
  "Notification",
];

const templateStatusOptions: Array<TemplateStatus | "All"> = [
  "All",
  "Active",
  "Disabled",
];

const templateTypeLabels: Record<TemplateType | "All", string> = {
  All: "Tất cả loại mẫu",
  "Rejection Reason": "Lý do từ chối",
  "Report Reason": "Lý do báo cáo",
  Notification: "Thông báo",
};

const templateStatusLabels: Record<TemplateStatus | "All", string> = {
  All: "Tất cả trạng thái",
  Active: "Đang hoạt động",
  Disabled: "Đã tắt",
};

const emptyForm: TemplateFormState = {
  name: "",
  type: "Rejection Reason",
  content: "",
  description: "",
  usageNote: "",
  status: "Active",
};

const truncateText = (value: string, maxLength = 120) => {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized || "--";
  }

  return `${normalized.slice(0, maxLength).trim()}...`;
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<TemplateType | "All">("All");
  const [statusFilter, setStatusFilter] = useState<TemplateStatus | "All">("All");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [formState, setFormState] = useState<TemplateFormState>(emptyForm);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (message: string, tone: ToastItem["tone"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2600);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setPageError("");

      const response = await templateService.getTemplates({
        search: debouncedSearchTerm,
        page: currentPage,
        pageSize: PAGE_SIZE,
        type: typeFilter,
        status: statusFilter,
      });

      setTemplates(response.data);
      setTotalItems(response.total);
    } catch (error) {
      setTemplates([]);
      setTotalItems(0);
      setPageError(
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách mẫu nội dung.",
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, statusFilter, typeFilter]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
      setCurrentPage(1);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, statusFilter]);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const activeCount = useMemo(
    () => templates.filter((template) => template.status === "Active").length,
    [templates],
  );

  const openModal = (mode: ModalMode, template?: Template) => {
    setModalMode(mode);
    setActiveTemplate(template ?? null);
    setFormError("");

    if (!template) {
      setFormState(emptyForm);
    } else {
      setFormState({
        name:
          mode === "clone" ? `${template.name} (Bản sao dự thảo)` : template.name,
        type: template.type,
        content: template.content,
        description: template.description,
        usageNote: template.usageNote,
        status: mode === "clone" ? "Disabled" : template.status,
      });
    }

    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setActiveTemplate(null);
    setFormState(emptyForm);
    setFormError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (modalMode === "view") {
      closeModal();
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError("");

      if (modalMode === "create") {
        await templateService.createTemplate(formState);
        showToast("Đã tạo mẫu nội dung mới.");
      } else if (modalMode === "edit" && activeTemplate) {
        await templateService.updateTemplate(activeTemplate.id, formState);
        showToast("Đã cập nhật mẫu nội dung.");
      } else if (modalMode === "clone" && activeTemplate) {
        const clonedTemplate = await templateService.cloneTemplate(activeTemplate.id);
        await templateService.updateTemplate(clonedTemplate.id, formState);
        showToast("Đã nhân bản mẫu nội dung.");
      }

      closeModal();
      await loadTemplates();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Không thể lưu mẫu nội dung.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (template: Template) => {
    try {
      const nextStatus: TemplateStatus =
        template.status === "Active" ? "Disabled" : "Active";
      await templateService.updateTemplateStatus(template.id, nextStatus);
      showToast(
        nextStatus === "Active"
          ? "Đã bật lại mẫu nội dung."
          : "Đã tắt mẫu nội dung.",
        "info",
      );
      await loadTemplates();
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật trạng thái mẫu nội dung.",
        "error",
      );
    }
  };

  return (
    <div className="templates-page">
      <PageHeader
        title="Mẫu nội dung"
        description="Quản lý thư viện mẫu dùng cho kiểm duyệt, báo cáo và thông báo. Người mới vào vẫn có thể xem, tạo hoặc nhân bản mẫu mà không cần nhớ quy tắc trong đầu."
        actionLabel="+ Tạo mẫu mới"
        onActionClick={() => openModal("create")}
      />

      <div className="templates-page__stats">
        <div className="templates-page__stat-card">
          <strong>{totalItems}</strong>
          <span>Mẫu đang hiển thị theo bộ lọc</span>
        </div>
        <div className="templates-page__stat-card">
          <strong>{activeCount}</strong>
          <span>Mẫu đang hoạt động trên trang hiện tại</span>
        </div>
        <div className="templates-page__stat-card">
          <strong>{templateTypeLabels[typeFilter]}</strong>
          <span>Nhóm mẫu đang xem</span>
        </div>
      </div>

      <SectionCard
        title="Bộ lọc và tìm kiếm"
        description="Tìm nhanh theo tên, loại, mô tả, hướng dẫn sử dụng hoặc nội dung mẫu."
      >
        <div className="templates-page__toolbar">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm theo tên mẫu, loại mẫu, mô tả hoặc nội dung"
          />

          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value as TemplateType | "All")
            }
          >
            {templateTypeOptions.map((option) => (
              <option key={option} value={option}>
                {templateTypeLabels[option]}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as TemplateStatus | "All")
            }
          >
            {templateStatusOptions.map((option) => (
              <option key={option} value={option}>
                {templateStatusLabels[option]}
              </option>
            ))}
          </select>
        </div>
      </SectionCard>

      <SectionCard
        title="Danh sách mẫu"
        description="Mỗi dòng đều cho thấy rõ mẫu dùng trong tình huống nào, xem trước nội dung ra sao và đang bật hay tắt."
      >
        {loading ? (
          <div className="templates-page__state">Đang tải thư viện mẫu nội dung...</div>
        ) : pageError ? (
          <div className="templates-page__state templates-page__state--error">
            <p>{pageError}</p>
            <button type="button" onClick={() => void loadTemplates()}>
              Tải lại
            </button>
          </div>
        ) : templates.length === 0 ? (
          <div className="templates-page__state">
            Không có mẫu nào khớp với bộ lọc hiện tại.
          </div>
        ) : (
          <div className="templates-table-wrapper">
            <table className="templates-table">
              <thead>
                <tr>
                  <th>Tên mẫu</th>
                  <th>Loại mẫu</th>
                  <th>Dùng khi nào</th>
                  <th>Nội dung xem trước</th>
                  <th>Trạng thái</th>
                  <th>Cập nhật gần nhất</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <tr key={template.id}>
                    <td>
                      <div className="templates-table__title">
                        <strong>{template.name}</strong>
                        <span>{template.description}</span>
                      </div>
                    </td>
                    <td>
                      <span className="templates-pill">
                        {templateTypeLabels[template.type]}
                      </span>
                    </td>
                    <td>{template.usageNote}</td>
                    <td>
                      <div className="templates-content-preview">
                        {truncateText(template.content)}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`templates-pill templates-pill--${
                          template.status === "Active" ? "active" : "inactive"
                        }`}
                      >
                        {templateStatusLabels[template.status]}
                      </span>
                    </td>
                    <td>{template.updatedAt}</td>
                    <td>
                      <div className="templates-actions">
                        <button type="button" onClick={() => openModal("view", template)}>
                          Xem
                        </button>
                        <button type="button" onClick={() => openModal("edit", template)}>
                          Sửa
                        </button>
                        <button type="button" onClick={() => openModal("clone", template)}>
                          Clone
                        </button>
                        <button type="button" onClick={() => void handleToggleStatus(template)}>
                          {template.status === "Active" ? "Tắt" : "Bật lại"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="templates-pagination">
          <span className="templates-pagination__info">
            Trang {currentPage} / {totalPages}
          </span>

          <div className="templates-pagination__actions">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              Trước
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
            >
              Sau
            </button>
          </div>
        </div>
      </SectionCard>

      {isModalOpen ? (
        <div className="templates-modal-backdrop">
          <div className="templates-modal">
            <div className="templates-modal__header">
              <div>
                <h3>
                  {modalMode === "create"
                    ? "Tạo mẫu nội dung"
                    : modalMode === "edit"
                      ? "Cập nhật mẫu nội dung"
                      : modalMode === "clone"
                        ? "Nhân bản mẫu nội dung"
                        : "Xem chi tiết mẫu nội dung"}
                </h3>
                <p>
                  {modalMode === "view"
                    ? "Rà nhanh tên mẫu, nội dung, ghi chú sử dụng và trạng thái."
                    : "Điền mô tả ngắn và hướng dẫn sử dụng để người mới vẫn hiểu mẫu này dùng khi nào."}
                </p>
              </div>
              <button type="button" onClick={closeModal}>
                Đóng
              </button>
            </div>

            <form className="templates-modal__form" onSubmit={(event) => void handleSubmit(event)}>
              <div className="templates-modal__grid">
                <div className="templates-modal__field">
                  <label htmlFor="template-name">Tên mẫu</label>
                  <input
                    id="template-name"
                    value={formState.name}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, name: event.target.value }))
                    }
                    placeholder="Ví dụ: Từ chối bài đăng thiếu thông tin"
                    disabled={modalMode === "view" || isSubmitting}
                  />
                </div>

                <div className="templates-modal__field">
                  <label htmlFor="template-type">Loại mẫu</label>
                  <select
                    id="template-type"
                    value={formState.type}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        type: event.target.value as TemplateType,
                      }))
                    }
                    disabled={modalMode === "view" || isSubmitting}
                  >
                    {templateTypeOptions
                      .filter((option): option is TemplateType => option !== "All")
                      .map((option) => (
                        <option key={option} value={option}>
                          {templateTypeLabels[option]}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="templates-modal__field templates-modal__field--full">
                  <label htmlFor="template-description">Mô tả ngắn</label>
                  <input
                    id="template-description"
                    value={formState.description}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Mô tả ngắn để admin hiểu ngay mẫu này phục vụ mục đích gì"
                    disabled={modalMode === "view" || isSubmitting}
                  />
                </div>

                <div className="templates-modal__field templates-modal__field--full">
                  <label htmlFor="template-usage-note">Dùng khi nào</label>
                  <textarea
                    id="template-usage-note"
                    value={formState.usageNote}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        usageNote: event.target.value,
                      }))
                    }
                    placeholder="Giải thích ngắn gọn điều kiện hoặc tình huống nên dùng mẫu này"
                    disabled={modalMode === "view" || isSubmitting}
                  />
                </div>

                <div className="templates-modal__field templates-modal__field--full">
                  <label htmlFor="template-content">Nội dung mẫu</label>
                  <textarea
                    id="template-content"
                    value={formState.content}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        content: event.target.value,
                      }))
                    }
                    placeholder="Nhập nội dung mẫu đầy đủ để dùng cho thao tác thật"
                    disabled={modalMode === "view" || isSubmitting}
                  />
                </div>

                <div className="templates-modal__field">
                  <label htmlFor="template-status">Trạng thái</label>
                  <select
                    id="template-status"
                    value={formState.status}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        status: event.target.value as TemplateStatus,
                      }))
                    }
                    disabled={modalMode === "view" || isSubmitting}
                  >
                    <option value="Active">{templateStatusLabels.Active}</option>
                    <option value="Disabled">{templateStatusLabels.Disabled}</option>
                  </select>
                </div>
              </div>

              <div className="templates-modal__preview">
                <strong>Xem trước nhanh</strong>
                <p>{truncateText(formState.content, 220)}</p>
              </div>

              {formError ? (
                <div className="templates-page__state templates-page__state--error">
                  {formError}
                </div>
              ) : null}

              <div className="templates-modal__actions">
                <button type="button" className="templates-modal__cancel" onClick={closeModal}>
                  Hủy
                </button>
                {modalMode !== "view" ? (
                  <button
                    type="submit"
                    className="templates-modal__submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Đang lưu..." : "Lưu mẫu nội dung"}
                  </button>
                ) : null}
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
