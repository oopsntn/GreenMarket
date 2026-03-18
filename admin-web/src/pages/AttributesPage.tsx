import { useState } from "react";
import PageHeader from "../components/PageHeader";
import { emptyAttributeForm } from "../mock-data/attributes";
import { attributeService } from "../services/attributeService";
import type { Attribute, AttributeFormState } from "../types/attribute";
import "./AttributesPage.css";

function AttributesPage() {
  const [attributes, setAttributes] = useState<Attribute[]>(
    attributeService.getAttributes(),
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedAttributeId, setSelectedAttributeId] = useState<number | null>(
    null,
  );
  const [formData, setFormData] =
    useState<AttributeFormState>(emptyAttributeForm);

  const openAddModal = () => {
    setModalMode("add");
    setSelectedAttributeId(null);
    setFormData(emptyAttributeForm);
    setIsModalOpen(true);
  };

  const openViewModal = (attribute: Attribute) => {
    setModalMode("view");
    setSelectedAttributeId(attribute.id);
    setFormData({
      name: attribute.name,
      code: attribute.code,
      type: attribute.type,
      required: attribute.required,
      status: attribute.status,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (attribute: Attribute) => {
    setModalMode("edit");
    setSelectedAttributeId(attribute.id);
    setFormData({
      name: attribute.name,
      code: attribute.code,
      type: attribute.type,
      required: attribute.required,
      status: attribute.status,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedAttributeId(null);
    setIsModalOpen(false);
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const target = event.target as HTMLInputElement;
    const { name, value, type, checked } = target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (modalMode === "add") {
      setAttributes((prev) => attributeService.createAttribute(prev, formData));
    }

    if (modalMode === "edit" && selectedAttributeId !== null) {
      setAttributes((prev) =>
        attributeService.updateAttribute(prev, selectedAttributeId, formData),
      );
    }

    closeModal();
  };

  const handleToggleStatus = (attribute: Attribute) => {
    const nextStatus = attribute.status === "Active" ? "Disabled" : "Active";
    setAttributes((prev) =>
      attributeService.updateAttributeStatus(prev, attribute.id, nextStatus),
    );
  };

  return (
    <div className="attributes-page">
      <PageHeader
        title="Attributes Management"
        description="Manage post attributes used across plant categories."
        actionLabel="+ Add Attribute"
        onActionClick={openAddModal}
      />

      <div className="attributes-toolbar">
        <input
          className="attributes-toolbar__search"
          type="text"
          placeholder="Search by attribute name or code"
        />

        <button className="attributes-toolbar__filter-btn" type="button">
          Filter
        </button>
      </div>

      <div className="attributes-table-wrapper">
        <table className="attributes-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Attribute Name</th>
              <th>Code</th>
              <th>Type</th>
              <th>Required</th>
              <th>Status</th>
              <th>Created Date</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {attributes.map((attribute) => (
              <tr key={attribute.id}>
                <td>#{attribute.id}</td>
                <td>{attribute.name}</td>
                <td>{attribute.code}</td>
                <td>
                  <span className="attributes-badge attributes-badge--type">
                    {attribute.type}
                  </span>
                </td>
                <td>
                  <span
                    className={
                      attribute.required
                        ? "attributes-badge attributes-badge--required"
                        : "attributes-badge attributes-badge--optional"
                    }
                  >
                    {attribute.required ? "Required" : "Optional"}
                  </span>
                </td>
                <td>
                  <span
                    className={
                      attribute.status === "Active"
                        ? "attributes-badge attributes-badge--active"
                        : "attributes-badge attributes-badge--disabled"
                    }
                  >
                    {attribute.status}
                  </span>
                </td>
                <td>{attribute.createdAt}</td>
                <td>
                  <div className="attributes-actions">
                    <button
                      type="button"
                      className="attributes-actions__view"
                      onClick={() => openViewModal(attribute)}
                    >
                      View
                    </button>

                    <button
                      type="button"
                      className="attributes-actions__edit"
                      onClick={() => openEditModal(attribute)}
                    >
                      Edit
                    </button>

                    {attribute.status === "Active" ? (
                      <button
                        type="button"
                        className="attributes-actions__disable"
                        onClick={() => handleToggleStatus(attribute)}
                      >
                        Disable
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="attributes-actions__enable"
                        onClick={() => handleToggleStatus(attribute)}
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
        <div className="attributes-modal-backdrop">
          <div className="attributes-modal">
            <div className="attributes-modal__header">
              <div>
                <h3>
                  {modalMode === "add"
                    ? "Add Attribute"
                    : modalMode === "edit"
                      ? "Edit Attribute"
                      : "Attribute Details"}
                </h3>
                <p>Manage attribute information and configuration.</p>
              </div>

              <button
                type="button"
                className="attributes-modal__close"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <form className="attributes-modal__form" onSubmit={handleSubmit}>
              <div className="attributes-modal__field">
                <label htmlFor="name">Attribute Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={modalMode === "view"}
                  placeholder="Enter attribute name"
                />
              </div>

              <div className="attributes-modal__field">
                <label htmlFor="code">Code</label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  value={formData.code}
                  onChange={handleChange}
                  disabled={modalMode === "view"}
                  placeholder="Enter attribute code"
                />
              </div>

              <div className="attributes-modal__field">
                <label htmlFor="type">Type</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  disabled={modalMode === "view"}
                >
                  <option>Text</option>
                  <option>Number</option>
                  <option>Select</option>
                  <option>Boolean</option>
                </select>
              </div>

              <label className="attributes-modal__checkbox">
                <input
                  name="required"
                  type="checkbox"
                  checked={formData.required}
                  onChange={handleChange}
                  disabled={modalMode === "view"}
                />
                <span>Required attribute</span>
              </label>

              <div className="attributes-modal__field">
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

              <div className="attributes-modal__actions">
                <button
                  type="button"
                  className="attributes-modal__cancel"
                  onClick={closeModal}
                >
                  Close
                </button>

                {modalMode !== "view" && (
                  <button type="submit" className="attributes-modal__submit">
                    {modalMode === "add" ? "Add Attribute" : "Save Changes"}
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

export default AttributesPage;
