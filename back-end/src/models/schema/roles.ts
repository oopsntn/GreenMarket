import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core";

export const roles = pgTable("roles", {
    roleId: serial("roleId").primaryKey(),
    roleCode: varchar("roleCode", { length: 50 }),
    roleTitle: varchar("roleTitle", { length: 100 }),
    roleCreatedAt: timestamp("roleCreatedAt").defaultNow(),
});
