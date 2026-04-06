export type RoleAudienceGroup = "Marketplace" | "Operations";
export type RoleCatalogStatus = "Active" | "Disabled";

export type RoleManagementItem = {
  id: number;
  code: string;
  title: string;
  audienceGroup: RoleAudienceGroup;
  accessScope: string;
  summary: string;
  responsibilities: string[];
  capabilities: string[];
  createdAt: string;
  updatedAt: string;
  status: RoleCatalogStatus;
};

export type RoleFormState = {
  title: string;
  audienceGroup: RoleAudienceGroup;
  accessScope: string;
  summary: string;
  responsibilitiesText: string;
  capabilitiesText: string;
};

export type ApiBusinessRoleResponse = {
  businessRoleId: number;
  businessRoleCode: string;
  businessRoleTitle: string;
  businessRoleAudienceGroup: string | null;
  businessRoleAccessScope: string | null;
  businessRoleSummary: string | null;
  businessRoleResponsibilities: unknown;
  businessRoleCapabilities: unknown;
  businessRoleStatus: string | null;
  businessRoleCreatedAt: string | null;
  businessRoleUpdatedAt: string | null;
};
