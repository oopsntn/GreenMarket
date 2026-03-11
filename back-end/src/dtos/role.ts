export interface RoleDTO {
    roleId: number;
    roleCode?: string | null;
    roleTitle?: string | null;
    roleCreatedAt: Date;
}

export type CreateRoleDTO = Omit<RoleDTO, "roleId" | "roleCreatedAt">;
export type UpdateRoleDTO = Partial<CreateRoleDTO>;

export interface RoleParams {
    id: string;
}
