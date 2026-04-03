export type ApiRoleResponse = {
  roleId: number;
  roleCode: string | null;
  roleTitle: string | null;
  roleCreatedAt: string | null;
};

export type ApiAdminRoleAssignmentsResponse = {
  adminId: number;
  roles: ApiRoleResponse[];
};

export type RoleManagementItem = {
  id: number;
  code: string;
  title: string;
  createdAt: string;
};

export type RoleFormState = {
  code: string;
  title: string;
};
