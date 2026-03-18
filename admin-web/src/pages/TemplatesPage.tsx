import { useState } from "react";
import BaseModal from "../components/BaseModal";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import StatusBadge from "../components/StatusBadge";
import { emptyTemplateForm } from "../mock-data/templates";
import { templateService } from "../services/templateService";
import type { Template, TemplateFormState } from "../types/template";
import "./TemplatesPage.css";

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
    }

    if (modalMode === "edit" && selectedTemplateId !== null) {
      setTemplates((prev) =>
        templateService.updateTemplate(prev, selectedTemplateId, formData),
      );
    }

    closeModal();
  };

  const handleToggleStatus = (template: Template) => {
    const nextStatus = template.status === "Active" ? "Disabled" : "Active";
    setTemplates((prev) =>
      templateService.updateTemplateStatus(prev, template.id, nextStatus),
    );
  };

  const filteredTemplates = templates.filter((template) => {
    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) return true;

    return (
      template.name.toLowerCase().includes(keyword) ||
      template.type.toLowerCase().includes(keyword)
    );
  });

  const modalTitle =
    modalMode === "add"
      ? "Add Template"
      : modalMode === "edit"
        ? "Edit Template"
        : "Template Details";

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
                        onClick={() => handleToggleStatus(template)}
                      >
                        Disable
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="templates-actions__enable"
                        onClick={() => handleToggleStatus(template)}
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

      <BaseModal
        isOpen={isModalOpen}
        title={modalTitle}
        description="Manage template details and content configuration."
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
    </div>
  );
}

export default TemplatesPage;
