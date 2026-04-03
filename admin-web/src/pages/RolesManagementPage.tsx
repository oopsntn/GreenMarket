import { useEffect, useMemo, useState } from "react";
import BaseModal from "../components/BaseModal";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { roleManagementService } from "../services/roleManagementService";
import type {
  RoleFormState,
  RoleManagementItem,
} from "../types/roleManagement";
import { getAdminProfile } from "../utils/adminSession";
import "./RolesManagementPage.css";

type ModalMode = "add" | "edit";

function RolesManagementPage() {
  const [roles, setRoles] = useState<RoleManagementItem[]>([]);
  const [assignedRoles, setAssignedRoles] = useState<RoleManagementItem[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("add");
  const [selectedRole, setSelectedRole] = useState<RoleManagementItem | null>(
    null,
  );
  const [formData, setFormData] = useState<RoleFormState>(
    roleManagementService.getEmptyForm(),
  );
  const [deleteTarget, setDeleteTarget] = useState<RoleManagementItem | null>(
    null,
  );
  const [isSavingAssignments, setIsSavingAssignments] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const adminProfile = getAdminProfile();

  const showToast = (message: string, tone: ToastItem["tone"] = "success") => {
    const toastId = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id: toastId, message, tone }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
    }, 2600);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const loadRoleData = async (showSuccessToast = false) => {
    try {
      setIsLoading(true);
      setError("");

      const [nextRoles, nextAssignments] = await Promise.all([
        roleManagementService.fetchRoles(),
        roleManagementService.fetchCurrentAdminAssignments(),
      ]);

      setRoles(nextRoles);
      setAssignedRoles(nextAssignments);
      setSelectedRoleIds(nextAssignments.map((role) => role.id));

      if (showSuccessToast) {
        showToast("Role management data refreshed.");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load roles.";
      setError(message);
      showToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRoleData();
  }, []);

  const filteredRoles = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return roles.filter((role) => {
      return (
        !keyword ||
        role.code.toLowerCase().includes(keyword) ||
        role.title.toLowerCase().includes(keyword)
      );
    });
  }, [roles, searchKeyword]);

  const openAddModal = () => {
    setModalMode("add");
    setSelectedRole(null);
    setFormData(roleManagementService.getEmptyForm());
    setIsModalOpen(true);
  };

  const openEditModal = (role: RoleManagementItem) => {
    setModalMode("edit");
    setSelectedRole(role);
    setFormData({
      code: role.code,
      title: role.title,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRole(null);
    setFormData(roleManagementService.getEmptyForm());
  };

  const handleFormChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      if (modalMode === "add") {
        const createdRole = await roleManagementService.createRole(formData);
        setRoles((prev) => [...prev, createdRole]);
        showToast(`Role "${createdRole.title}" was created.`);
      } else if (selectedRole) {
        const updatedRole = await roleManagementService.updateRole(
          selectedRole.id,
          formData,
        );

        setRoles((prev) =>
          prev.map((role) => (role.id === updatedRole.id ? updatedRole : role)),
        );
        setAssignedRoles((prev) =>
          prev.map((role) => (role.id === updatedRole.id ? updatedRole : role)),
        );
        showToast(`Role "${updatedRole.title}" was updated.`);
      }

      closeModal();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Unable to save role.",
        "error",
      );
    }
  };

  const handleDeleteRole = async () => {
    if (!deleteTarget) return;

    try {
      await roleManagementService.deleteRole(deleteTarget.id);
      setRoles((prev) => prev.filter((role) => role.id !== deleteTarget.id));
      setAssignedRoles((prev) =>
        prev.filter((role) => role.id !== deleteTarget.id),
      );
      setSelectedRoleIds((prev) => prev.filter((id) => id !== deleteTarget.id));
      showToast(`Role "${deleteTarget.title}" was deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Unable to delete role.",
        "error",
      );
    }
  };

  const handleToggleAssignment = (roleId: number) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId],
    );
  };

  const handleSaveAssignments = async () => {
    try {
      setIsSavingAssignments(true);

      const nextAssignments =
        await roleManagementService.replaceCurrentAdminAssignments(
          selectedRoleIds,
        );

      setAssignedRoles(nextAssignments);
      setSelectedRoleIds(nextAssignments.map((role) => role.id));
      showToast("Current admin role assignments were updated.");
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : "Unable to update current admin assignments.",
        "error",
      );
    } finally {
      setIsSavingAssignments(false);
    }
  };

  return (
    <div className="roles-management-page">
      <PageHeader
        title="Roles Management"
        description="Manage admin role definitions and review the roles assigned to the current signed-in admin."
        actionLabel="+ Add Role"
        onActionClick={openAddModal}
      />

      <div className="roles-management-summary-grid">
        <StatCard
          title="Total Roles"
          value={String(roles.length)}
          subtitle="Role definitions available to the admin system"
        />
        <StatCard
          title="Assigned To Me"
          value={String(assignedRoles.length)}
          subtitle="Roles currently attached to this admin account"
        />
        <StatCard
          title="Current Admin"
          value={adminProfile?.name || "Admin"}
          subtitle={adminProfile?.email || "No email"}
        />
      </div>

      <SearchToolbar
        placeholder="Search by role code or title"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
        filterSummaryItems={[`${filteredRoles.length} roles shown`]}
      />

      <div className="roles-management-grid">
        <SectionCard
          title="Role Catalog"
          description="Create, update, and remove admin roles."
        >
          {isLoading ? (
            <EmptyState
              title="Loading roles"
              description="Fetching role definitions from the admin API."
            />
          ) : error ? (
            <EmptyState title="Unable to load roles" description={error} />
          ) : filteredRoles.length === 0 ? (
            <EmptyState
              title="No roles found"
              description="No roles match your current search."
            />
          ) : (
            <div className="roles-management-list">
              {filteredRoles.map((role) => (
                <div key={role.id} className="roles-management-card">
                  <div className="roles-management-card__content">
                    <strong>{role.title}</strong>
                    <span>{role.code}</span>
                    <small>Created {role.createdAt}</small>
                  </div>
                  <div className="roles-management-card__actions">
                    <button type="button" onClick={() => openEditModal(role)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="roles-management-card__delete"
                      onClick={() => setDeleteTarget(role)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Current Admin Assignments"
          description="Review and replace the roles attached to the currently signed-in admin account."
        >
          {isLoading ? (
            <EmptyState
              title="Loading assignments"
              description="Fetching current admin assignments from the role API."
            />
          ) : error ? (
            <EmptyState title="Unable to load assignments" description={error} />
          ) : roles.length === 0 ? (
            <EmptyState
              title="No roles available"
              description="Create roles first before assigning them."
            />
          ) : (
            <div className="roles-assignment-panel">
              <div className="roles-assignment-panel__list">
                {roles.map((role) => (
                  <label
                    key={role.id}
                    className="roles-assignment-panel__item"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRoleIds.includes(role.id)}
                      onChange={() => handleToggleAssignment(role.id)}
                    />
                    <div>
                      <strong>{role.title}</strong>
                      <span>{role.code}</span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="roles-assignment-panel__footer">
                <p>
                  Assigned role count: <strong>{selectedRoleIds.length}</strong>
                </p>
                <button
                  type="button"
                  onClick={() => void handleSaveAssignments()}
                  disabled={isSavingAssignments}
                >
                  {isSavingAssignments ? "Saving..." : "Save My Assignments"}
                </button>
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      <BaseModal
        isOpen={isModalOpen}
        title={modalMode === "add" ? "Add Role" : "Edit Role"}
        description="Maintain role code and role title used by admin RBAC."
        onClose={closeModal}
        maxWidth="520px"
      >
        <form className="roles-management-form" onSubmit={handleSubmit}>
          <div className="roles-management-form__field">
            <label htmlFor="role-code">Role Code</label>
            <input
              id="role-code"
              name="code"
              type="text"
              value={formData.code}
              onChange={handleFormChange}
              placeholder="ROLE_ADMIN"
            />
          </div>

          <div className="roles-management-form__field">
            <label htmlFor="role-title">Role Title</label>
            <input
              id="role-title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleFormChange}
              placeholder="Administrator"
            />
          </div>

          <div className="roles-management-form__actions">
            <button type="button" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit">
              {modalMode === "add" ? "Create Role" : "Save Changes"}
            </button>
          </div>
        </form>
      </BaseModal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Delete Role"
        message={`Are you sure you want to delete ${
          deleteTarget?.title ?? "this role"
        }?`}
        confirmText="Delete Role"
        cancelText="Cancel"
        tone="danger"
        onConfirm={() => void handleDeleteRole()}
        onCancel={() => setDeleteTarget(null)}
      />

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default RolesManagementPage;
