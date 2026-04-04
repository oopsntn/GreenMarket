import { readStoredJson, writeStoredJson } from "../utils/browserStorage";
import type { RoleFormState, RoleManagementItem } from "../types/roleManagement";

const ROLE_CATALOG_STORAGE_KEY = "adminBusinessRoleCatalog";

const defaultRoles: RoleManagementItem[] = [
  {
    id: 1,
    code: "USER",
    title: "User",
    audienceGroup: "Marketplace",
    accessScope: "Browse listings, save favorites, contact sellers, and submit abuse reports.",
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
    createdAt: "2026-03-29",
    status: "Core",
  },
  {
    id: 2,
    code: "HOST",
    title: "Host",
    audienceGroup: "Marketplace",
    accessScope: "Operate a plant shop, publish listings, manage profile, and purchase promotion packages.",
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
    createdAt: "2026-03-29",
    status: "Core",
  },
  {
    id: 3,
    code: "COLLABORATOR",
    title: "Collaborator",
    audienceGroup: "Marketplace",
    accessScope: "Support a host with content preparation, listing updates, and media management.",
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
    createdAt: "2026-03-29",
    status: "Core",
  },
  {
    id: 4,
    code: "MANAGER",
    title: "Manager",
    audienceGroup: "Operations",
    accessScope: "Oversee moderation, promotion follow-up, policy execution, and high-level business review.",
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
    createdAt: "2026-03-29",
    status: "Core",
  },
  {
    id: 5,
    code: "OPERATION_STAFF",
    title: "Operation Staff",
    audienceGroup: "Operations",
    accessScope: "Execute daily moderation, support promotion reopening, export reports, and handle admin workflows.",
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
    createdAt: "2026-03-29",
    status: "Core",
  },
];

const toMultilineText = (values: string[]) => values.join("\n");

const parseMultilineText = (value: string) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

export const roleManagementService = {
  getRoles(): RoleManagementItem[] {
    return readStoredJson<RoleManagementItem[]>(
      ROLE_CATALOG_STORAGE_KEY,
      defaultRoles,
    );
  },

  getDefaultRoles(): RoleManagementItem[] {
    return defaultRoles.map((role) => ({
      ...role,
      responsibilities: [...role.responsibilities],
      capabilities: [...role.capabilities],
    }));
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

  updateRole(
    roles: RoleManagementItem[],
    roleId: number,
    formData: RoleFormState,
  ): RoleManagementItem[] {
    const updatedRoles = roles.map((role) =>
      role.id === roleId
        ? {
            ...role,
            title: formData.title.trim(),
            audienceGroup: formData.audienceGroup,
            accessScope: formData.accessScope.trim(),
            summary: formData.summary.trim(),
            responsibilities: parseMultilineText(formData.responsibilitiesText),
            capabilities: parseMultilineText(formData.capabilitiesText),
          }
        : role,
    );

    writeStoredJson(ROLE_CATALOG_STORAGE_KEY, updatedRoles);
    return updatedRoles;
  },

  resetRoles(): RoleManagementItem[] {
    const resetRoles = this.getDefaultRoles();
    writeStoredJson(ROLE_CATALOG_STORAGE_KEY, resetRoles);
    return resetRoles;
  },
};
