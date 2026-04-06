import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BaseModal from "../components/BaseModal";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { roleManagementService } from "../services/roleManagementService";
import type {
  RoleFormState,
  RoleManagementItem,
} from "../types/roleManagement";
import "./RolesManagementPage.css";

const capabilityRows = [
  {
    capability: "Browse and buy listings",
    roles: ["USER"],
  },
  {
    capability: "Manage shop profile and plant posts",
    roles: ["HOST", "COLLABORATOR"],
  },
  {
    capability: "Purchase and track promotion packages",
    roles: ["HOST", "MANAGER"],
  },
  {
    capability: "Handle moderation and report actions",
    roles: ["MANAGER", "OPERATION_STAFF"],
  },
  {
    capability: "Review analytics and exports",
    roles: ["MANAGER", "OPERATION_STAFF"],
  },
];

function RolesManagementPage() {
  const [roles, setRoles] = useState<RoleManagementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedRole, setSelectedRole] = useState<RoleManagementItem | null>(
    null,
  );
  const [formData, setFormData] = useState<RoleFormState | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

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

  const loadRoles = async (showSuccessToast = false) => {
    try {
      setIsLoading(true);
      setError("");

      const data = await roleManagementService.fetchRoles();
      setRoles(data);

      if (showSuccessToast) {
        showToast("Marketplace role catalog refreshed successfully.");
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to load marketplace role catalog.";
      setError(message);
      showToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRoles();
  }, []);

  const filteredRoles = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return roles.filter((role) => {
      return (
        !keyword ||
        role.code.toLowerCase().includes(keyword) ||
        role.title.toLowerCase().includes(keyword) ||
        role.summary.toLowerCase().includes(keyword)
      );
    });
  }, [roles, searchKeyword]);

  const marketplaceRoleCount = roles.filter(
    (role) => role.audienceGroup === "Marketplace",
  ).length;
  const operationsRoleCount = roles.filter(
    (role) => role.audienceGroup === "Operations",
  ).length;

  const openEditModal = (role: RoleManagementItem) => {
    setSelectedRole(role);
    setFormData(roleManagementService.mapRoleToForm(role));
  };

  const closeModal = () => {
    setSelectedRole(null);
    setFormData(null);
  };

  const handleFormChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = event.target;

    setFormData((prev) =>
      prev
        ? {
            ...prev,
            [name]: value,
          }
        : prev,
    );
  };

  const handleSaveRole = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedRole || !formData) return;

    try {
      const updatedRole = await roleManagementService.updateRole(
        selectedRole.id,
        selectedRole,
        formData,
      );

      setRoles((prev) =>
        prev.map((role) => (role.id === updatedRole.id ? updatedRole : role)),
      );

      closeModal();
      showToast(`Role definition for ${updatedRole.title} was updated.`);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Unable to update role.",
        "error",
      );
    }
  };

  const handleResetCatalog = async () => {
    try {
      setIsLoading(true);
      const syncedRoles = await roleManagementService.syncDefaultRoles();
      setRoles(syncedRoles);
      showToast(
        "Marketplace role catalog was synced to the report-aligned defaults.",
        "info",
      );
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Unable to sync default roles.",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="roles-management-page">
      <PageHeader
        title="Roles Management"
        description="Admin maintains the official marketplace role catalog used across the GreenMarket system. This screen is about business roles, not admin login accounts."
        actionLabel="Sync Default Roles"
        onActionClick={() => void handleResetCatalog()}
      />

      <div className="roles-management-summary-grid">
        <StatCard
          title="Total Managed Roles"
          value={String(roles.length)}
          subtitle="Core role definitions maintained by admin"
        />
        <StatCard
          title="Marketplace Roles"
          value={String(marketplaceRoleCount)}
          subtitle="User-facing roles in the buying and selling flow"
        />
        <StatCard
          title="Operations Roles"
          value={String(operationsRoleCount)}
          subtitle="Internal execution and oversight roles"
        />
      </div>

      <SearchToolbar
        placeholder="Search by role name, code, or responsibility"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
        filterSummaryItems={[
          `${filteredRoles.length} roles shown`,
          `${roles.filter((role) => role.status === "Active").length} active`,
        ]}
      />

      <SectionCard
        title="Where Role Assignment Happens"
        description="This screen defines the role catalog only. User-by-user role assignment is handled in the Users Management screen."
        actions={
          <Link className="roles-management-link" to="/users">
            Open Users Management
          </Link>
        }
      >
        <p className="roles-management-note">
          Use this page to maintain the meaning of each business role. Open the
          Users screen when you need to assign one of these roles to a specific
          marketplace account.
        </p>
      </SectionCard>

      <SectionCard
        title="Role Catalog"
        description="Review the business meaning, access scope, and key responsibilities of each system role described in the project report."
      >
        {isLoading ? (
          <div className="roles-management-empty-state">
            Loading marketplace role catalog...
          </div>
        ) : error ? (
          <EmptyState title="Unable to load roles" description={error} />
        ) : filteredRoles.length === 0 ? (
          <EmptyState
            title="No roles found"
            description="No role matches the current search keyword."
          />
        ) : (
          <div className="roles-management-list">
            {filteredRoles.map((role) => (
              <div key={role.id} className="roles-management-card">
                <div className="roles-management-card__header">
                  <div>
                    <strong>{role.title}</strong>
                    <p>{role.summary}</p>
                  </div>

                  <button type="button" onClick={() => openEditModal(role)}>
                    Edit Definition
                  </button>
                </div>

                <div className="roles-management-card__meta">
                  <StatusBadge label={role.code} variant="type" />
                  <StatusBadge
                    label={role.audienceGroup}
                    variant="processing"
                  />
                  <StatusBadge
                    label={role.status}
                    variant={role.status === "Active" ? "active" : "locked"}
                  />
                </div>

                <div className="roles-management-card__details">
                  <div>
                    <label>Access Scope</label>
                    <p>{role.accessScope}</p>
                  </div>

                  <div>
                    <label>Main Responsibilities</label>
                    <ul>
                      {role.responsibilities.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <label>Typical Capabilities</label>
                    <ul>
                      {role.capabilities.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Role Capability Matrix"
        description="Use this matrix to verify which business role should handle each core function in the system."
      >
        <div className="roles-capability-table-wrapper">
          <table className="roles-capability-table">
            <thead>
              <tr>
                <th>Capability</th>
                {roles.map((role) => (
                  <th key={role.code}>{role.title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {capabilityRows.map((row) => (
                <tr key={row.capability}>
                  <td>{row.capability}</td>
                  {roles.map((role) => (
                    <td key={`${row.capability}-${role.code}`}>
                      {row.roles.includes(role.code) ? "Yes" : "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <BaseModal
        isOpen={selectedRole !== null && formData !== null}
        title={selectedRole ? `Edit ${selectedRole.title}` : "Edit Role"}
        description="Update the role description used by the admin-maintained marketplace role catalog."
        onClose={closeModal}
        maxWidth="720px"
      >
        {selectedRole && formData ? (
          <form className="roles-management-form" onSubmit={handleSaveRole}>
            <div className="roles-management-form__field">
              <label>Role Code</label>
              <input type="text" value={selectedRole.code} disabled />
            </div>

            <div className="roles-management-form__grid">
              <div className="roles-management-form__field">
                <label htmlFor="role-title">Role Title</label>
                <input
                  id="role-title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleFormChange}
                />
              </div>

              <div className="roles-management-form__field">
                <label htmlFor="role-audience-group">Audience Group</label>
                <select
                  id="role-audience-group"
                  name="audienceGroup"
                  value={formData.audienceGroup}
                  onChange={handleFormChange}
                >
                  <option value="Marketplace">Marketplace</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>
            </div>

            <div className="roles-management-form__field">
              <label htmlFor="role-scope">Access Scope</label>
              <textarea
                id="role-scope"
                name="accessScope"
                rows={3}
                value={formData.accessScope}
                onChange={handleFormChange}
              />
            </div>

            <div className="roles-management-form__field">
              <label htmlFor="role-summary">Role Summary</label>
              <textarea
                id="role-summary"
                name="summary"
                rows={3}
                value={formData.summary}
                onChange={handleFormChange}
              />
            </div>

            <div className="roles-management-form__grid">
              <div className="roles-management-form__field">
                <label htmlFor="role-responsibilities">Responsibilities</label>
                <textarea
                  id="role-responsibilities"
                  name="responsibilitiesText"
                  rows={6}
                  value={formData.responsibilitiesText}
                  onChange={handleFormChange}
                />
              </div>

              <div className="roles-management-form__field">
                <label htmlFor="role-capabilities">Capabilities</label>
                <textarea
                  id="role-capabilities"
                  name="capabilitiesText"
                  rows={6}
                  value={formData.capabilitiesText}
                  onChange={handleFormChange}
                />
              </div>
            </div>

            <div className="roles-management-form__actions">
              <button type="button" onClick={closeModal}>
                Cancel
              </button>
              <button type="submit">Save Role Definition</button>
            </div>
          </form>
        ) : null}
      </BaseModal>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default RolesManagementPage;
