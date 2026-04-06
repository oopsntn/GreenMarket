import { apiClient } from "../lib/apiClient";
import type {
  ApiBusinessRoleResponse,
  RoleFormState,
  RoleManagementItem,
} from "../types/roleManagement";

const defaultRoleCatalog: Array<{
  code: string;
  title: string;
  audienceGroup: "Marketplace" | "Operations";
  accessScope: string;
  summary: string;
  responsibilities: string[];
  capabilities: string[];
}> = [
  {
    code: "USER",
    title: "User",
    audienceGroup: "Marketplace",
    accessScope:
      "Browse listings, save favorites, contact sellers, and submit abuse reports.",
    summary:
      "Marketplace customer role used by buyers and visitors who explore ornamental plant listings.",
    responsibilities: [
      "Search and review ornamental plant listings",
      "Save posts and contact hosts",
      "Submit reports when content looks suspicious",
    ],
    capabilities: [
      "View approved posts",
      "Report listings",
      "Track personal purchase and contact history",
    ],
  },
  {
    code: "HOST",
    title: "Host",
    audienceGroup: "Marketplace",
    accessScope:
      "Operate a plant shop, publish listings, manage profile, and purchase promotion packages.",
    summary:
      "Seller-side business role for shop owners who list ornamental plants and manage promotion packages.",
    responsibilities: [
      "Create and maintain shop profile",
      "Publish and update product posts",
      "Buy promotion packages and monitor campaign delivery",
    ],
    capabilities: [
      "Manage shop and posts",
      "Purchase promotions",
      "Track shop analytics",
    ],
  },
  {
    code: "COLLABORATOR",
    title: "Collaborator",
    audienceGroup: "Marketplace",
    accessScope:
      "Support a host with content preparation, listing updates, and media management.",
    summary:
      "Operational support role delegated by a host to help maintain listing quality and shop content.",
    responsibilities: [
      "Prepare content and media for listings",
      "Update post details on behalf of the host",
      "Coordinate with manager or operations staff when moderation feedback appears",
    ],
    capabilities: [
      "Edit delegated posts",
      "Upload media",
      "Review moderation feedback",
    ],
  },
  {
    code: "MANAGER",
    title: "Manager",
    audienceGroup: "Operations",
    accessScope:
      "Oversee moderation, promotion follow-up, policy execution, and high-level business review.",
    summary:
      "Supervisory role that tracks operational quality, campaign handling, and staff coordination.",
    responsibilities: [
      "Review operational escalations",
      "Approve campaign handling decisions",
      "Monitor analytics and revenue summaries",
    ],
    capabilities: [
      "Review reports and moderation outcomes",
      "Supervise promotion handling",
      "Access management dashboards",
    ],
  },
  {
    code: "OPERATION_STAFF",
    title: "Operation Staff",
    audienceGroup: "Operations",
    accessScope:
      "Execute daily moderation, support promotion reopening, export reports, and handle admin workflows.",
    summary:
      "Execution-focused staff role that carries out the day-to-day actions delegated by manager or admin.",
    responsibilities: [
      "Moderate reported content and user issues",
      "Handle promotion reopening and package support",
      "Prepare exports and operational summaries",
    ],
    capabilities: [
      "Process moderation actions",
      "Support campaign handling",
      "Generate exports and logs",
    ],
  },
];

const ensureStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
};

const toMultilineText = (values: string[]) => values.join("\n");

const parseMultilineText = (value: string) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

const mapApiStatusToUi = (value: string | null | undefined) =>
  value?.toLowerCase() === "disabled" ? "Disabled" : "Active";

const mapApiAudienceGroup = (
  value: string | null | undefined,
): "Marketplace" | "Operations" => {
  return value?.toLowerCase() === "operations" ? "Operations" : "Marketplace";
};

const mapApiRoleToUi = (item: ApiBusinessRoleResponse): RoleManagementItem => ({
  id: item.businessRoleId,
  code: item.businessRoleCode,
  title: item.businessRoleTitle,
  audienceGroup: mapApiAudienceGroup(item.businessRoleAudienceGroup),
  accessScope: item.businessRoleAccessScope ?? "",
  summary: item.businessRoleSummary ?? "",
  responsibilities: ensureStringArray(item.businessRoleResponsibilities),
  capabilities: ensureStringArray(item.businessRoleCapabilities),
  createdAt: item.businessRoleCreatedAt?.slice(0, 10) ?? "",
  updatedAt: item.businessRoleUpdatedAt?.slice(0, 10) ?? "",
  status: mapApiStatusToUi(item.businessRoleStatus),
});

const mapFormToApiPayload = (
  existingRole: RoleManagementItem,
  formData: RoleFormState,
) => ({
  businessRoleCode: existingRole.code,
  businessRoleTitle: formData.title.trim(),
  businessRoleAudienceGroup: formData.audienceGroup,
  businessRoleAccessScope: formData.accessScope.trim(),
  businessRoleSummary: formData.summary.trim(),
  businessRoleResponsibilities: parseMultilineText(
    formData.responsibilitiesText,
  ),
  businessRoleCapabilities: parseMultilineText(formData.capabilitiesText),
  businessRoleStatus:
    existingRole.status === "Disabled" ? "disabled" : "active",
});

export const roleManagementService = {
  async fetchRoles(): Promise<RoleManagementItem[]> {
    const data = await apiClient.request<ApiBusinessRoleResponse[]>(
      "/api/admin/business-roles",
      {
        defaultErrorMessage: "Unable to load marketplace role catalog.",
      },
    );

    return data.map(mapApiRoleToUi);
  },

  mapRoleToForm(role: RoleManagementItem): RoleFormState {
    return {
      title: role.title,
      audienceGroup: role.audienceGroup,
      accessScope: role.accessScope,
      summary: role.summary,
      responsibilitiesText: toMultilineText(role.responsibilities),
      capabilitiesText: toMultilineText(role.capabilities),
    };
  },

  async updateRole(
    roleId: number,
    existingRole: RoleManagementItem,
    formData: RoleFormState,
  ): Promise<RoleManagementItem> {
    const data = await apiClient.request<ApiBusinessRoleResponse>(
      `/api/admin/business-roles/${roleId}`,
      {
        method: "PUT",
        includeJsonContentType: true,
        defaultErrorMessage: "Unable to update marketplace role.",
        body: JSON.stringify(mapFormToApiPayload(existingRole, formData)),
      },
    );

    return mapApiRoleToUi(data);
  },

  async syncDefaultRoles(): Promise<RoleManagementItem[]> {
    const existingRoles = await this.fetchRoles();
    const existingByCode = new Map(
      existingRoles.map((role) => [role.code, role]),
    );

    await Promise.all(
      defaultRoleCatalog.map(async (defaultRole) => {
        const matched = existingByCode.get(defaultRole.code);

        if (matched) {
          await apiClient.request<ApiBusinessRoleResponse>(
            `/api/admin/business-roles/${matched.id}`,
            {
              method: "PUT",
              includeJsonContentType: true,
              defaultErrorMessage: `Unable to sync ${defaultRole.title}.`,
              body: JSON.stringify({
                businessRoleCode: defaultRole.code,
                businessRoleTitle: defaultRole.title,
                businessRoleAudienceGroup: defaultRole.audienceGroup,
                businessRoleAccessScope: defaultRole.accessScope,
                businessRoleSummary: defaultRole.summary,
                businessRoleResponsibilities: defaultRole.responsibilities,
                businessRoleCapabilities: defaultRole.capabilities,
                businessRoleStatus: "active",
              }),
            },
          );
          return;
        }

        await apiClient.request<ApiBusinessRoleResponse>(
          "/api/admin/business-roles",
          {
            method: "POST",
            includeJsonContentType: true,
            defaultErrorMessage: `Unable to create ${defaultRole.title}.`,
            body: JSON.stringify({
              businessRoleCode: defaultRole.code,
              businessRoleTitle: defaultRole.title,
              businessRoleAudienceGroup: defaultRole.audienceGroup,
              businessRoleAccessScope: defaultRole.accessScope,
              businessRoleSummary: defaultRole.summary,
              businessRoleResponsibilities: defaultRole.responsibilities,
              businessRoleCapabilities: defaultRole.capabilities,
              businessRoleStatus: "active",
            }),
          },
        );
      }),
    );

    return this.fetchRoles();
  },

  async updateRoleStatus(
    roleId: number,
    status: RoleManagementItem["status"],
  ): Promise<RoleManagementItem> {
    const data = await apiClient.request<ApiBusinessRoleResponse>(
      `/api/admin/business-roles/${roleId}/status`,
      {
        method: "PATCH",
        includeJsonContentType: true,
        defaultErrorMessage: "Unable to update role status.",
        body: JSON.stringify({
          businessRoleStatus: status === "Disabled" ? "disabled" : "active",
        }),
      },
    );

    return mapApiRoleToUi(data);
  },
};
