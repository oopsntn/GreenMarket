import { useEffect, useMemo, useState } from "react";
import BaseModal from "../components/BaseModal";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import SectionCard from "../components/SectionCard";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import {
  emptyTemplateForm,
  templateService,
} from "../services/templateService";
import type { Template, TemplateFormState } from "../types/template";
import "./TemplatesPage.css";

type ConfirmAction = "disable" | "enable";

type ConfirmState = {
  isOpen: boolean;
  templateId: number | null;
  action: ConfirmAction | null;
};

const PAGE_SIZE = 5;

function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState<number | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    null,
  );
  const [formData, setFormData] =
    useState<TemplateFormState>(emptyTemplateForm);
  const [formError, setFormError] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    templateId: null,
    action: null,
  });
  const [toasts, setToasts] = useState<ToastItem[]>([]);

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

  const showToast = (message: string, tone: ToastItem["tone"] = "success") => {
    const toastId = Date.now() + Math.random();

    setToasts((prev) => [
      ...prev,
      {
        id: toastId,
        message,
        tone,
      },
    ]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
    }, 2600);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const openAddModal = () => {
    setModalMode("add");
    setSelectedTemplateId(null);
    setFormData({
      ...emptyTemplateForm,
      status: "Active",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const openViewModal = (template: Template) => {
    setModalMode("view");
    setSelectedTemplateId(template.id);
    setFormData({
      name: template.name,
      type: template.type,
      content: template.content,
      status: template.status,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (template: Template) => {
    setModalMode("edit");
    setSelectedTemplateId(template.id);
    setFormData({
      name: template.name,
      type: template.type,
      content: template.content,
      status: template.status,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedTemplateId(null);
    setFormError("");
    setIsModalOpen(false);
  };

  const openConfirmDialog = (templateId: number, action: ConfirmAction) => {
    setConfirmState({
      isOpen: true,
      templateId,
      action,
    });
  };

  const closeConfirmDialog = () => {
    setConfirmState({
      isOpen: false,
      templateId: null,
      action: null,
    });
  };

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (formError) {
      setFormError("");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);

      templateService.validateTemplateForm(
        templates,
        formData,
        selectedTemplateId,
      );
      setFormError("");

      if (modalMode === "add") {
        await templateService.createTemplate({
          ...formData,
          status: "Active",
        });
        await loadTemplates();
        showToast("Template added successfully.");
      }

      if (modalMode === "edit" && selectedTemplateId !== null) {
        const currentTemplate = templates.find(
          (template) => template.id === selectedTemplateId,
        );

        await templateService.updateTemplate(selectedTemplateId, {
          ...formData,
          status: currentTemplate?.status ?? "Active",
        });

        await loadTemplates();
        showToast("Template updated successfully.");
      }

      closeModal();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to save template.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmAction = async () => {
    if (confirmState.templateId === null || confirmState.action === null)
      return;

    const targetTemplate = templates.find(
      (item) => item.id === confirmState.templateId,
    );

    if (!targetTemplate) {
      closeConfirmDialog();
      return;
    }

    const nextStatus =
      confirmState.action === "disable" ? "Disabled" : "Active";

    try {
      setIsStatusUpdating(confirmState.templateId);

      await templateService.updateTemplateStatus(
        confirmState.templateId,
        nextStatus,
      );

      await loadTemplates();

      if (confirmState.action === "disable") {
        showToast(
          `${targetTemplate.name} has been disabled successfully.`,
          "info",
        );
      } else {
        showToast(`${targetTemplate.name} has been enabled successfully.`);
      }

      closeConfirmDialog();
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Failed to update template status.",
        "error",
      );
    } finally {
      setIsStatusUpdating(null);
    }
  };

  const filteredTemplates = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    if (!keyword) return templates;

    return templates.filter((template) => {
      return (
        template.name.toLowerCase().includes(keyword) ||
        template.type.toLowerCase().includes(keyword) ||
        template.content.toLowerCase().includes(keyword)
      );
    });
  }, [templates, searchKeyword]);

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
  }, [searchKeyword]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const modalTitle =
    modalMode === "add"
      ? "Add Template"
      : modalMode === "edit"
        ? "Edit Template"
        : "Template Details";

  const modalDescription =
    modalMode === "add"
      ? "Create a new template. New templates are created as active by default."
      : modalMode === "edit"
        ? "Update template type and content. Use Enable or Disable in the table to change status."
        : "Review template information, content preview, and current status.";

  const confirmTemplate =
    confirmState.templateId !== null
      ? (templates.find((item) => item.id === confirmState.templateId) ?? null)
      : null;

  const templateLabel = confirmTemplate?.name ?? "this template";

  const confirmTitleMap: Record<ConfirmAction, string> = {
    disable: "Disable Template",
    enable: "Enable Template",
  };

  const confirmMessageMap: Record<ConfirmAction, string> = {
    disable: `Are you sure you want to disable ${templateLabel}? This template will no longer be active in the system.`,
    enable: `Are you sure you want to enable ${templateLabel}? This template will be active again in the system.`,
  };

  const confirmButtonMap: Record<ConfirmAction, string> = {
    disable: "Disable Template",
    enable: "Enable Template",
  };

  const confirmToneMap: Record<
    ConfirmAction,
    "danger" | "success" | "neutral"
  > = {
    disable: "danger",
    enable: "success",
  };

  return (
    <div className="templates-page">
      <PageHeader
        title="Template Management"
        description="Manage rejection reasons, report templates, and notification content."
        actionLabel="+ Add Template"
        onActionClick={openAddModal}
      />

      <SearchToolbar
        placeholder="Search by template name or type"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
      />

      <SectionCard
        title="Template Directory"
        description="Review template information, content preview, and status."
      >
        {isInitialLoading ? (
          <EmptyState
            title="Loading templates"
            description="Fetching template records from the admin API."
          />
        ) : pageError ? (
          <EmptyState
            title="Unable to load templates"
            description={pageError}
          />
        ) : filteredTemplates.length === 0 ? (
          <EmptyState
            title="No templates found"
            description="No templates match your current search. Try another keyword or create a new template."
          />
        ) : (
          <>
            <div className="templates-table-wrapper">
              <table className="templates-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Template Name</th>
                    <th>Type</th>
                    <th>Content Preview</th>
                    <th>Status</th>
                    <th>Updated Date</th>
                    <th>Actions</th>
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
                      <td className="templates-content-preview">
                        {template.content}
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
                        <div className="templates-actions">
                          <button
                            type="button"
                            className="templates-actions__view"
                            onClick={() => openViewModal(template)}
                          >
                            View
                          </button>

                          <button
                            type="button"
                            className="templates-actions__edit"
                            onClick={() => openEditModal(template)}
                          >
                            Edit
                          </button>

                          {template.status === "Active" ? (
                            <button
                              type="button"
                              className="templates-actions__disable"
                              onClick={() =>
                                openConfirmDialog(template.id, "disable")
                              }
                              disabled={isStatusUpdating === template.id}
                            >
                              Disable
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="templates-actions__enable"
                              onClick={() =>
                                openConfirmDialog(template.id, "enable")
                              }
                              disabled={isStatusUpdating === template.id}
                            >
                              Enable
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="templates-pagination">
              <span className="templates-pagination__info">
                Page {page} of {totalPages}
              </span>

              <div className="templates-pagination__actions">
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

      <BaseModal
        isOpen={isModalOpen}
        title={modalTitle}
        description={modalDescription}
        onClose={closeModal}
        maxWidth="620px"
      >
        <form className="templates-modal__form" onSubmit={handleSubmit}>
          <div className="templates-modal__field">
            <label htmlFor="name">Template Name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              disabled={modalMode === "view" || isSubmitting}
              placeholder="Enter template name"
            />
          </div>

          <div className="templates-modal__field">
            <label htmlFor="type">Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              disabled={modalMode === "view" || isSubmitting}
            >
              <option>Rejection Reason</option>
              <option>Report Reason</option>
              <option>Notification</option>
            </select>
          </div>

          <div className="templates-modal__field">
            <label htmlFor="content">Content</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              disabled={modalMode === "view" || isSubmitting}
              placeholder="Enter template content"
              rows={5}
            />
          </div>

          {formError ? (
            <div className="templates-state templates-state--error">
              {formError}
            </div>
          ) : null}

          {modalMode === "view" && (
            <div className="templates-modal__field">
              <label>Status</label>
              <input type="text" value={formData.status} disabled />
            </div>
          )}

          <div className="templates-modal__actions">
            <button
              type="button"
              className="templates-modal__cancel"
              onClick={closeModal}
              disabled={isSubmitting}
            >
              Close
            </button>

            {modalMode !== "view" && (
              <button
                type="submit"
                className="templates-modal__submit"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Saving..."
                  : modalMode === "add"
                    ? "Add Template"
                    : "Save Changes"}
              </button>
            )}
          </div>
        </form>
      </BaseModal>

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={
          confirmState.action ? confirmTitleMap[confirmState.action] : "Confirm"
        }
        message={
          confirmState.action
            ? confirmMessageMap[confirmState.action]
            : "Please confirm this action."
        }
        confirmText={
          confirmState.action
            ? confirmButtonMap[confirmState.action]
            : "Confirm"
        }
        cancelText="Cancel"
        tone={
          confirmState.action ? confirmToneMap[confirmState.action] : "neutral"
        }
        onConfirm={handleConfirmAction}
        onCancel={closeConfirmDialog}
      />

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default TemplatesPage;
