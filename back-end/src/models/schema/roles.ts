import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";

export const roles = pgTable("roles", {
    roleId: serial("role_id").primaryKey(),
    roleCode: varchar("role_code", { length: 50 }),
    roleTitle: varchar("role_title", { length: 100 }),
    roleCreatedAt: timestamp("role_created_at").defaultNow(),
});

export type Role = InferSelectModel<typeof roles>;
export type NewRole = InferInsertModel<typeof roles>;