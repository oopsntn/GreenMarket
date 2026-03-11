import { pgTable, integer, primaryKey } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";

import { admins } from "./admins";
import { roles } from "./roles";

export const adminRoles = pgTable("admin_roles", {
    adminRoleAdminId: integer("admin_role_admin_id")
        .notNull()
        .references(() => admins.adminId, { onDelete: "cascade" }),
    adminRoleRoleId: integer("admin_role_role_id")
        .notNull()
        .references(() => roles.roleId, { onDelete: "cascade" }),
}, (table) => [
    primaryKey({ columns: [table.adminRoleAdminId, table.adminRoleRoleId] }),
]
);

export type AdminRole = InferSelectModel<typeof adminRoles>;
export type NewAdminRole = InferInsertModel<typeof adminRoles>;