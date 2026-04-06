import { apiClient } from "../lib/apiClient";
import { getAdminProfile } from "../utils/adminSession";
import type {
  ApiAdminRoleAssignmentsResponse,
  ApiRoleResponse,
  RoleFormState,
  RoleManagementItem,
} from "../types/roleManagement";

const formatDate = (value: string | null) => {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toISOString().slice(0, 10);
};

const mapRoleToUi = (item: ApiRoleResponse): RoleManagementItem => {
  return {
    id: item.roleId,
    code: item.roleCode?.trim() || `ROLE_${item.roleId}`,
    title: item.roleTitle?.trim() || "Untitled role",
    createdAt: formatDate(item.roleCreatedAt),
  };
};

export const roleManagementService = {
  getEmptyForm(): RoleFormState {
    return {
      code: "",
      title: "",
    };
  },

  async fetchRoles(): Promise<RoleManagementItem[]> {
    const data = await apiClient.request<ApiRoleResponse[]>("/api/admin/roles", {
      defaultErrorMessage: "Unable to load roles.",
    });

    return data.map(mapRoleToUi);
  },

  async createRole(formData: RoleFormState): Promise<RoleManagementItem> {
    const data = await apiClient.request<ApiRoleResponse>("/api/admin/roles", {
      method: "POST",
      includeJsonContentType: true,
      defaultErrorMessage: "Unable to create role.",
      body: JSON.stringify({
        roleCode: formData.code.trim(),
        roleTitle: formData.title.trim(),
      }),
    });

    return mapRoleToUi(data);
  },

  async updateRole(
    roleId: number,
    formData: RoleFormState,
  ): Promise<RoleManagementItem> {
    const data = await apiClient.request<ApiRoleResponse>(
      `/api/admin/roles/${roleId}`,
      {
        method: "PATCH",
        includeJsonContentType: true,
        defaultErrorMessage: "Unable to update role.",
        body: JSON.stringify({
          roleCode: formData.code.trim(),
          roleTitle: formData.title.trim(),
        }),
      },
    );

    return mapRoleToUi(data);
  },

  async deleteRole(roleId: number): Promise<void> {
    await apiClient.request(`/api/admin/roles/${roleId}`, {
      method: "DELETE",
      defaultErrorMessage: "Unable to delete role.",
    });
  },

  async fetchCurrentAdminAssignments(): Promise<RoleManagementItem[]> {
    const adminProfile = getAdminProfile();

    if (!adminProfile?.id) {
      return [];
    }

    const data = await apiClient.request<ApiAdminRoleAssignmentsResponse>(
      `/api/admin/roles/admins/${adminProfile.id}/roles`,
      {
        defaultErrorMessage: "Unable to load current admin role assignments.",
      },
    );

    return (data.roles ?? []).map(mapRoleToUi);
  },

  async replaceCurrentAdminAssignments(roleIds: number[]) {
    const adminProfile = getAdminProfile();

    if (!adminProfile?.id) {
      throw new Error("Current admin profile is not available.");
    }

    const data = await apiClient.request<ApiAdminRoleAssignmentsResponse>(
      `/api/admin/roles/admins/${adminProfile.id}/roles`,
      {
        method: "PUT",
        includeJsonContentType: true,
        defaultErrorMessage: "Unable to update current admin role assignments.",
        body: JSON.stringify({ roleIds }),
      },
    );

    return (data.roles ?? []).map(mapRoleToUi);
  },
};
