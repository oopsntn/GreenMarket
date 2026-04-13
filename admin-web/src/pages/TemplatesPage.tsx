import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import "./TemplatesPage.css";
import { templateService, type Template, type TemplateStatus, type TemplateType } from "../services/templateService";

type ModalMode = "create" | "edit" | "view";

type TemplateFormState = {
  name: string;
  type: TemplateType;
  content: string;
};

const PAGE_SIZE = 5;
const TEMPLATE_TYPES: TemplateType[] = ["Rejection Reason", "Report Reason", "Notification"];

const TEMPLATE_TYPE_LABELS: Record<TemplateType, string> = {
  "Rejection Reason": "Ly do tu choi",
  "Report Reason": "Ly do bao cao",
  Notification: "Thong bao",
};

const TEMPLATE_STATUS_LABELS: Record<TemplateStatus, string> = {
  Active: "Dang hoat dong",
  Disabled: "Da tat",
};

const EMPTY_FORM: TemplateFormState = {
  name: "",
  type: "Rejection Reason",
  content: "",
};

function formatStatusClass(status: TemplateStatus) {
  return status === "Active" ? "active" : "inactive";
}

function truncateContent(content: string, length = 100) {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (normalized.length <= length) {
    return normalized;
  }

  return `${normalized.slice(0, length).trim()}...`;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [formState, setFormState] = useState<TemplateFormState>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [confirmTemplate, setConfirmTemplate] = useState<Template | null>(null);
  const [confirmStatus, setConfirmStatus] = useState<TemplateStatus>("Disabled");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
      setCurrentPage(1);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    void loadTemplates();
  }, [debouncedSearchTerm, currentPage]);

  useEffect(() => {
    if (!toastMessage) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setToastMessage(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  async function loadTemplates() {
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await templateService.getTemplates({
        search: debouncedSearchTerm,
        page: currentPage,
        pageSize: PAGE_SIZE,
      });

      setTemplates(response.data);
      setTotalItems(response.total);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Khong the tai danh sach mau.");
      setTemplates([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const pageLabel = useMemo(() => {
    if (!totalItems) {
      return "Khong co du lieu";
    }

    return `Trang ${currentPage} / ${totalPages}`;
  }, [currentPage, totalItems, totalPages]);

  function openCreateModal() {
    setModalMode("create");
    setActiveTemplate(null);
    setFormState(EMPTY_FORM);
    setFormError(null);
    setIsModalOpen(true);
  }

  function openEditModal(template: Template) {
    setModalMode("edit");
    setActiveTemplate(template);
    setFormState({
      name: template.name,
      type: template.type,
      content: template.content,
    });
    setFormError(null);
    setIsModalOpen(true);
  }

  function openViewModal(template: Template) {
    setModalMode("view");
    setActiveTemplate(template);
    setFormState({
      name: template.name,
      type: template.type,
      content: template.content,
    });
    setFormError(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSubmitting) {
      return;
    }

    setIsModalOpen(false);
    setActiveTemplate(null);
    setFormError(null);
    setFormState(EMPTY_FORM);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (modalMode === "view") {
      closeModal();
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      if (modalMode === "create") {
        await templateService.createTemplate(formState);
        setToastMessage("Da tao mau moi.");
      } else if (activeTemplate) {
        await templateService.updateTemplate(activeTemplate.id, formState);
        setToastMessage("Da cap nhat mau.");
      }

      setIsModalOpen(false);
      setActiveTemplate(null);
      setFormState(EMPTY_FORM);
      await loadTemplates();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Khong the luu mau.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatusChange() {
    if (!confirmTemplate) {
      return;
    }

    setIsUpdatingStatus(true);

    try {
      await templateService.updateTemplateStatus(confirmTemplate.id, confirmStatus);
      setToastMessage(confirmStatus === "Active" ? "Da bat lai mau." : "Da tat mau.");
      setConfirmTemplate(null);
      await loadTemplates();
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : "Khong the cap nhat trang thai mau.");
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  function askToChangeStatus(template: Template, nextStatus: TemplateStatus) {
    setConfirmTemplate(template);
    setConfirmStatus(nextStatus);
  }

  return (
    <div className="management-page">
      <section className="management-page__header">
        <div>
          <h1>Quan ly mau noi dung</h1>
          <p>
            Quan ly cac mau noi dung dung cho ly do tu choi, ly do bao cao va thong bao trong he thong quan tri.
          </p>
        </div>
        <button type="button" className="primary-button" onClick={openCreateModal}>
          + Them mau
        </button>
      </section>

      <section className="management-page__card">
        <div className="management-page__toolbar">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tim theo ten mau, loai mau hoac noi dung"
          />
        </div>
      </section>

      <section className="management-page__card">
        <div className="management-page__table-header">
          <div>
            <h2>Danh sach mau</h2>
            <p>Theo doi thong tin mau, noi dung rut gon va trang thai su dung.</p>
          </div>
        </div>

        {loading ? (
          <div className="management-page__state">Dang tai danh sach mau...</div>
        ) : errorMessage ? (
          <div className="management-page__state management-page__state--error">
            <p>{errorMessage}</p>
            <button type="button" className="secondary-button" onClick={loadTemplates}>
              Tai lai
            </button>
          </div>
        ) : templates.length === 0 ? (
          <div className="management-page__state">
            <p>Khong tim thay mau nao phu hop voi bo loc hien tai.</p>
          </div>
        ) : (
          <div className="data-table__wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Ten mau</th>
                  <th>Loai mau</th>
                  <th>Noi dung rut gon</th>
                  <th>Trang thai</th>
                  <th>Ngay cap nhat</th>
                  <th>Thao tac</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <tr key={template.id}>
                    <td>#{template.id}</td>
                    <td>{template.name}</td>
                    <td>
                      <span className="table-badge">{TEMPLATE_TYPE_LABELS[template.type]}</span>
                    </td>
                    <td>{truncateContent(template.content)}</td>
                    <td>
                      <span className={`table-badge table-badge--${formatStatusClass(template.status)}`}>
                        {TEMPLATE_STATUS_LABELS[template.status]}
                      </span>
                    </td>
                    <td>{template.updatedDate || "--"}</td>
                    <td>
                      <div className="data-table__actions">
                        <button type="button" className="table-button" onClick={() => openViewModal(template)}>
                          Xem
                        </button>
                        <button
                          type="button"
                          className="table-button table-button--secondary"
                          onClick={() => openEditModal(template)}
                        >
                          Sua
                        </button>
                        {template.status === "Active" ? (
                          <button
                            type="button"
                            className="table-button table-button--danger"
                            onClick={() => askToChangeStatus(template, "Disabled")}
                          >
                            Tat
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="table-button table-button--success"
                            onClick={() => askToChangeStatus(template, "Active")}
                          >
                            Bat lai
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="management-page__pagination">
          <span>{pageLabel}</span>
          <div className="management-page__pagination-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              Truoc
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            >
              Sau
            </button>
          </div>
        </div>
      </section>

      {isModalOpen && (
        <div className="management-page__modal-backdrop">
          <div className="management-page__modal">
            <div className="management-page__modal-header">
              <div>
                <h3>
                  {modalMode === "create"
                    ? "Them mau moi"
                    : modalMode === "edit"
                      ? "Chinh sua mau"
                      : "Chi tiet mau"}
                </h3>
                <p>
                  {modalMode === "create"
                    ? "Nhap day du ten mau, loai mau va noi dung."
                    : modalMode === "edit"
                      ? "Cap nhat thong tin mau dang duoc su dung."
                      : "Xem thong tin day du cua mau noi dung."}
                </p>
              </div>
              <button type="button" className="secondary-button" onClick={closeModal}>
                Dong
              </button>
            </div>

            <form className="management-page__form" onSubmit={handleSubmit}>
              <label>
                Ten mau
                <input
                  type="text"
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, name: event.target.value }))
                  }
                  disabled={modalMode === "view" || isSubmitting}
                />
              </label>

              <label>
                Loai mau
                <select
                  value={formState.type}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      type: event.target.value as TemplateType,
                    }))
                  }
                  disabled={modalMode === "view" || isSubmitting}
                >
                  {TEMPLATE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {TEMPLATE_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Noi dung mau
                <textarea
                  rows={8}
                  value={formState.content}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, content: event.target.value }))
                  }
                  disabled={modalMode === "view" || isSubmitting}
                />
              </label>

              {formError && <div className="management-page__form-error">{formError}</div>}

              {modalMode !== "view" && (
                <div className="management-page__form-actions">
                  <button type="button" className="secondary-button" onClick={closeModal} disabled={isSubmitting}>
                    Huy
                  </button>
                  <button type="submit" className="primary-button" disabled={isSubmitting}>
                    {isSubmitting
                      ? "Dang luu..."
                      : modalMode === "create"
                        ? "Tao mau"
                        : "Luu thay doi"}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {confirmTemplate && (
        <div className="management-page__modal-backdrop">
          <div className="management-page__modal management-page__modal--compact">
            <div className="management-page__modal-header">
              <div>
                <h3>{confirmStatus === "Active" ? "Bat lai mau" : "Tat mau"}</h3>
                <p>
                  {confirmStatus === "Active"
                    ? `Ban co chac muon bat lai mau "${confirmTemplate.name}"?`
                    : `Ban co chac muon tat mau "${confirmTemplate.name}"?`}
                </p>
              </div>
            </div>
            <div className="management-page__form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setConfirmTemplate(null)}
                disabled={isUpdatingStatus}
              >
                Huy
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={handleStatusChange}
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus ? "Dang cap nhat..." : "Xac nhan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && <div className="management-page__toast">{toastMessage}</div>}
    </div>
  );
}
