import { useMemo, useState } from "react";
import BaseModal from "../components/BaseModal";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import SectionCard from "../components/SectionCard";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { emptyTemplateForm } from "../mock-data/templates";
import { templateService } from "../services/templateService";
import type { Template, TemplateFormState } from "../types/template";
import "./TemplatesPage.css";

type ConfirmAction = "disable" | "enable";

type ConfirmState = {
  isOpen: boolean;
  templateId: number | null;
  action: ConfirmAction | null;
};

function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>(
    templateService.getTemplates(),
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    null,
  );
  const [formData, setFormData] =
    useState<TemplateFormState>(emptyTemplateForm);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    templateId: null,
    action: null,
  });
  const [toasts, setToasts] = useState<ToastItem[]>([]);

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
    setFormData(emptyTemplateForm);
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
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedTemplateId(null);
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
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (modalMode === "add") {
      setTemplates((prev) => templateService.createTemplate(prev, formData));
      showToast("Template added successfully.");
    }

    if (modalMode === "edit" && selectedTemplateId !== null) {
      setTemplates((prev) =>
        templateService.updateTemplate(prev, selectedTemplateId, formData),
      );
      showToast("Template updated successfully.");
    }

    closeModal();
  };

  const handleToggleStatus = (template: Template) => {
    const nextStatus = template.status === "Active" ? "Disabled" : "Active";
    setTemplates((prev) =>
      templateService.updateTemplateStatus(prev, template.id, nextStatus),
    );
  };

  const handleConfirmAction = () => {
    if (confirmState.templateId === null || confirmState.action === null)
      return;

    const targetTemplate = templates.find(
      (item) => item.id === confirmState.templateId,
    );
    if (!targetTemplate) {
      closeConfirmDialog();
      return;
    }

    handleToggleStatus(targetTemplate);

    if (confirmState.action === "disable") {
      showToast(
        `${targetTemplate.name} has been disabled successfully.`,
        "info",
      );
    } else {
      showToast(`${targetTemplate.name} has been enabled successfully.`);
    }

    closeConfirmDialog();
  };

  const filteredTemplates = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    if (!keyword) return templates;

    return templates.filter((template) => {
      return (
        template.name.toLowerCase().includes(keyword) ||
        template.type.toLowerCase().includes(keyword)
      );
    });
  }, [templates, searchKeyword]);

  const modalTitle =
    modalMode === "add"
      ? "Add Template"
      : modalMode === "edit"
        ? "Edit Template"
        : "Template Details";

  const modalDescription =
    modalMode === "add"
      ? "Create a new template for rejection reasons, report messages, or notifications."
      : modalMode === "edit"
        ? "Update template type, content, and current activation status."
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
        {filteredTemplates.length === 0 ? (
          <EmptyState
            title="No templates found"
            description="No templates match your current search. Try another keyword or create a new template."
          />
        ) : (
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
                {filteredTemplates.map((template) => (
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
              disabled={modalMode === "view"}
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
              disabled={modalMode === "view"}
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
              disabled={modalMode === "view"}
              placeholder="Enter template content"
              rows={5}
            />
          </div>

          <div className="templates-modal__field">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              disabled={modalMode === "view"}
            >
              <option>Active</option>
              <option>Disabled</option>
            </select>
          </div>

          <div className="templates-modal__actions">
            <button
              type="button"
              className="templates-modal__cancel"
              onClick={closeModal}
            >
              Close
            </button>

            {modalMode !== "view" && (
              <button type="submit" className="templates-modal__submit">
                {modalMode === "add" ? "Add Template" : "Save Changes"}
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
