import { useState } from "react";
import BaseModal from "../components/BaseModal";
import ConfirmDialog from "../components/ConfirmDialog";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { emptyAttributeForm } from "../mock-data/attributes";
import { attributeService } from "../services/attributeService";
import type { Attribute, AttributeFormState } from "../types/attribute";
import "./AttributesPage.css";

type ConfirmAction = "disable" | "enable";

type ConfirmState = {
  isOpen: boolean;
  attributeId: number | null;
  action: ConfirmAction | null;
};

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
  const [searchKeyword, setSearchKeyword] = useState("");
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    attributeId: null,
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

  const openConfirmDialog = (attributeId: number, action: ConfirmAction) => {
    setConfirmState({
      isOpen: true,
      attributeId,
      action,
    });
  };

  const closeConfirmDialog = () => {
    setConfirmState({
      isOpen: false,
      attributeId: null,
      action: null,
    });
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
      showToast("Attribute added successfully.");
    }

    if (modalMode === "edit" && selectedAttributeId !== null) {
      setAttributes((prev) =>
        attributeService.updateAttribute(prev, selectedAttributeId, formData),
      );
      showToast("Attribute updated successfully.");
    }

    closeModal();
  };

  const handleToggleStatus = (attribute: Attribute) => {
    const nextStatus = attribute.status === "Active" ? "Disabled" : "Active";
    setAttributes((prev) =>
      attributeService.updateAttributeStatus(prev, attribute.id, nextStatus),
    );
  };

  const handleConfirmAction = () => {
    if (confirmState.attributeId === null || confirmState.action === null)
      return;

    const targetAttribute = attributes.find(
      (item) => item.id === confirmState.attributeId,
    );
    if (!targetAttribute) {
      closeConfirmDialog();
      return;
    }

    handleToggleStatus(targetAttribute);

    if (confirmState.action === "disable") {
      showToast(
        `${targetAttribute.name} has been disabled successfully.`,
        "info",
      );
    } else {
      showToast(`${targetAttribute.name} has been enabled successfully.`);
    }

    closeConfirmDialog();
  };

  const filteredAttributes = attributes.filter((attribute) => {
    const keyword = searchKeyword.trim().toLowerCase();

    if (!keyword) return true;

    return (
      attribute.name.toLowerCase().includes(keyword) ||
      attribute.code.toLowerCase().includes(keyword)
    );
  });

  const modalTitle =
    modalMode === "add"
      ? "Add Attribute"
      : modalMode === "edit"
        ? "Edit Attribute"
        : "Attribute Details";

  const confirmAttribute =
    confirmState.attributeId !== null
      ? (attributes.find((item) => item.id === confirmState.attributeId) ??
        null)
      : null;

  const attributeLabel = confirmAttribute?.name ?? "this attribute";

  const confirmTitleMap: Record<ConfirmAction, string> = {
    disable: "Disable Attribute",
    enable: "Enable Attribute",
  };

  const confirmMessageMap: Record<ConfirmAction, string> = {
    disable: `Are you sure you want to disable ${attributeLabel}? This attribute will no longer be active in the system.`,
    enable: `Are you sure you want to enable ${attributeLabel}? This attribute will be active again in the system.`,
  };

  const confirmButtonMap: Record<ConfirmAction, string> = {
    disable: "Disable Attribute",
    enable: "Enable Attribute",
  };

  const confirmToneMap: Record<
    ConfirmAction,
    "danger" | "success" | "neutral"
  > = {
    disable: "danger",
    enable: "success",
  };

  return (
    <div className="attributes-page">
      <PageHeader
        title="Attributes Management"
        description="Manage post attributes used across plant categories."
        actionLabel="+ Add Attribute"
        onActionClick={openAddModal}
      />

      <SearchToolbar
        placeholder="Search by attribute name or code"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
      />

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
            {filteredAttributes.map((attribute) => (
              <tr key={attribute.id}>
                <td>#{attribute.id}</td>
                <td>{attribute.name}</td>
                <td>{attribute.code}</td>
                <td>
                  <StatusBadge label={attribute.type} variant="type" />
                </td>
                <td>
                  <StatusBadge
                    label={attribute.required ? "Required" : "Optional"}
                    variant={attribute.required ? "required" : "optional"}
                  />
                </td>
                <td>
                  <StatusBadge
                    label={attribute.status}
                    variant={
                      attribute.status === "Active" ? "active" : "disabled"
                    }
                  />
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
                        onClick={() =>
                          openConfirmDialog(attribute.id, "disable")
                        }
                      >
                        Disable
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="attributes-actions__enable"
                        onClick={() =>
                          openConfirmDialog(attribute.id, "enable")
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

      <BaseModal
        isOpen={isModalOpen}
        title={modalTitle}
        description="Manage attribute information and configuration."
        onClose={closeModal}
      >
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

export default AttributesPage;
