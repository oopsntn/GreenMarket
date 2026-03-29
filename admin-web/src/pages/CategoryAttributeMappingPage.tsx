import { useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import SectionCard from "../components/SectionCard";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { categoryMappingService } from "../services/categoryMappingService";
import type { CategoryMapping } from "../types/categoryMapping";
import "./CategoryAttributeMappingPage.css";

type ConfirmAction = "disable" | "enable" | "remove";

type ConfirmState = {
  isOpen: boolean;
  mappingId: number | null;
  action: ConfirmAction | null;
};

function CategoryAttributeMappingPage() {
  const [mappings, setMappings] = useState<CategoryMapping[]>(
    categoryMappingService.getMappings(),
  );
  const [searchKeyword, setSearchKeyword] = useState("");
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    mappingId: null,
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

  const openConfirmDialog = (mappingId: number, action: ConfirmAction) => {
    setConfirmState({
      isOpen: true,
      mappingId,
      action,
    });
  };

  const closeConfirmDialog = () => {
    setConfirmState({
      isOpen: false,
      mappingId: null,
      action: null,
    });
  };

  const handleToggleStatus = (mapping: CategoryMapping) => {
    const nextStatus = mapping.status === "Active" ? "Disabled" : "Active";
    setMappings((prev) =>
      categoryMappingService.updateMappingStatus(prev, mapping.id, nextStatus),
    );
  };

  const handleRemove = (mappingId: number) => {
    setMappings((prev) =>
      categoryMappingService.removeMapping(prev, mappingId),
    );
  };

  const handleConfirmAction = () => {
    if (confirmState.mappingId === null || confirmState.action === null) return;

    const targetMapping = mappings.find(
      (item) => item.id === confirmState.mappingId,
    );
    if (!targetMapping) {
      closeConfirmDialog();
      return;
    }

    const mappingLabel = `${targetMapping.categoryName} - ${targetMapping.attributeName}`;

    if (confirmState.action === "remove") {
      handleRemove(confirmState.mappingId);
      showToast(`${mappingLabel} has been removed successfully.`, "info");
    } else {
      handleToggleStatus(targetMapping);

      if (confirmState.action === "disable") {
        showToast(`${mappingLabel} has been disabled successfully.`, "info");
      } else {
        showToast(`${mappingLabel} has been enabled successfully.`);
      }
    }

    closeConfirmDialog();
  };

  const filteredMappings = mappings.filter((item) => {
    const keyword = searchKeyword.trim().toLowerCase();

    if (!keyword) return true;

    return (
      item.categoryName.toLowerCase().includes(keyword) ||
      item.attributeName.toLowerCase().includes(keyword) ||
      item.attributeCode.toLowerCase().includes(keyword)
    );
  });

  const confirmMapping =
    confirmState.mappingId !== null
      ? (mappings.find((item) => item.id === confirmState.mappingId) ?? null)
      : null;

  const mappingLabel = confirmMapping
    ? `${confirmMapping.categoryName} - ${confirmMapping.attributeName}`
    : "this mapping";

  const confirmTitleMap: Record<ConfirmAction, string> = {
    disable: "Disable Mapping",
    enable: "Enable Mapping",
    remove: "Remove Mapping",
  };

  const confirmMessageMap: Record<ConfirmAction, string> = {
    disable: `Are you sure you want to disable ${mappingLabel}? This mapping will no longer be applied in the category configuration.`,
    enable: `Are you sure you want to enable ${mappingLabel}? This mapping will be active again in the category configuration.`,
    remove: `Are you sure you want to remove ${mappingLabel}? This action will delete the relationship between category and attribute from the current UI data.`,
  };

  const confirmButtonMap: Record<ConfirmAction, string> = {
    disable: "Disable Mapping",
    enable: "Enable Mapping",
    remove: "Remove Mapping",
  };

  const confirmToneMap: Record<
    ConfirmAction,
    "danger" | "success" | "neutral"
  > = {
    disable: "danger",
    enable: "success",
    remove: "danger",
  };

  return (
    <div className="mapping-page">
      <PageHeader
        title="Category - Attribute Mapping"
        description="Configure which attributes belong to each plant category."
        actionLabel="+ Add Mapping"
      />

      <SearchToolbar
        placeholder="Search by category or attribute"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
      />

      <SectionCard
        title="Mapping Directory"
        description="Review category-attribute relationships, requirement settings, and status."
      >
        {filteredMappings.length === 0 ? (
          <EmptyState
            title="No mappings found"
            description="No category-attribute mappings match your current search. Try another keyword to continue."
          />
        ) : (
          <div className="mapping-table-wrapper">
            <table className="mapping-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Category</th>
                  <th>Attribute</th>
                  <th>Code</th>
                  <th>Required</th>
                  <th>Display Order</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredMappings.map((item) => (
                  <tr key={item.id}>
                    <td>#{item.id}</td>
                    <td>{item.categoryName}</td>
                    <td>{item.attributeName}</td>
                    <td>{item.attributeCode}</td>
                    <td>
                      <StatusBadge
                        label={item.required ? "Required" : "Optional"}
                        variant={item.required ? "required" : "optional"}
                      />
                    </td>
                    <td>{item.displayOrder}</td>
                    <td>
                      <StatusBadge
                        label={item.status}
                        variant={
                          item.status === "Active" ? "active" : "disabled"
                        }
                      />
                    </td>
                    <td>
                      <div className="mapping-actions">
                        <button type="button" className="mapping-actions__edit">
                          Edit
                        </button>

                        {item.status === "Active" ? (
                          <button
                            type="button"
                            className="mapping-actions__disable"
                            onClick={() =>
                              openConfirmDialog(item.id, "disable")
                            }
                          >
                            Disable
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="mapping-actions__enable"
                            onClick={() => openConfirmDialog(item.id, "enable")}
                          >
                            Enable
                          </button>
                        )}

                        <button
                          type="button"
                          className="mapping-actions__remove"
                          onClick={() => openConfirmDialog(item.id, "remove")}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

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

export default CategoryAttributeMappingPage;
