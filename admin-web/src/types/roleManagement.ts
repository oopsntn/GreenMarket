export type RoleAudienceGroup = "Marketplace" | "Operations";

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
  status: "Core";
};

export type RoleFormState = {
  title: string;
  audienceGroup: RoleAudienceGroup;
  accessScope: string;
  summary: string;
  responsibilitiesText: string;
  capabilitiesText: string;
};
