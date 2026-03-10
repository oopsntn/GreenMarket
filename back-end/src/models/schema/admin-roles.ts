import { pgTable, integer, primaryKey } from "drizzle-orm/pg-core";

import { admins } from "./admins";
import { roles } from "./roles";

export const adminRoles = pgTable("admin_roles", {
    adminRoleAdminId: integer("adminRoleAdminId")
        .notNull()
        .references(() => admins.adminId, { onDelete: "cascade" }),
    adminRoleRoleId: integer("adminRoleRoleId")
        .notNull()
        .references(() => roles.roleId, { onDelete: "cascade" }),
}, (table) => ({
    pk: primaryKey(table.adminRoleAdminId, table.adminRoleRoleId),
}));
