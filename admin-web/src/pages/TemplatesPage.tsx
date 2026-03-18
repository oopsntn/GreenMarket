import { useState } from "react";
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

  return (
    <div className="templates-page">
      <div className="templates-page__header">
        <div>
          <h2>Template Management</h2>
          <p>
            Manage rejection reasons, report templates, and notification
            content.
          </p>
        </div>

        <button
          className="templates-page__add-btn"
          type="button"
          onClick={openAddModal}
        >
          + Add Template
        </button>
      </div>

      <div className="templates-toolbar">
        <input
          className="templates-toolbar__search"
          type="text"
          placeholder="Search by template name or type"
        />

        <button className="templates-toolbar__filter-btn" type="button">
          Filter
        </button>
      </div>

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
            {templates.map((template) => (
              <tr key={template.id}>
                <td>#{template.id}</td>
                <td>{template.name}</td>
                <td>
                  <span className="templates-badge templates-badge--type">
                    {template.type}
                  </span>
                </td>
                <td className="templates-content-preview">
                  {template.content}
                </td>
                <td>
                  <span
                    className={
                      template.status === "Active"
                        ? "templates-badge templates-badge--active"
                        : "templates-badge templates-badge--disabled"
                    }
                  >
                    {template.status}
                  </span>
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

      {isModalOpen && (
        <div className="templates-modal-backdrop">
          <div className="templates-modal">
            <div className="templates-modal__header">
              <div>
                <h3>
                  {modalMode === "add"
                    ? "Add Template"
                    : modalMode === "edit"
                      ? "Edit Template"
                      : "Template Details"}
                </h3>
                <p>Manage template details and content configuration.</p>
              </div>

              <button
                type="button"
                className="templates-modal__close"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

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
          </div>
        </div>
      )}
    </div>
  );
}

export default TemplatesPage;
