import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";

export const admins = pgTable("admins", {
    adminId: serial("admin_id").primaryKey(),
    adminEmail: varchar("admin_email", { length: 150 }).notNull().unique(),
    adminUsername: varchar("admin_username", { length: 50 }).unique(),
    adminPasswordHash: varchar("admin_password_hash", { length: 255 }).notNull(),
    adminFullName: varchar("admin_full_name", { length: 100 }),
    adminAvatarUrl: varchar("admin_avatar_url", { length: 255 }),
    adminStatus: varchar("admin_status", { length: 20 }),
    adminLastLoginAt: timestamp("admin_last_login_at"),
    adminCreatedAt: timestamp("admin_created_at").defaultNow(),
    adminUpdatedAt: timestamp("admin_updated_at").defaultNow(),
});

export type Admin = InferSelectModel<typeof admins>;
export type NewAdmin = InferInsertModel<typeof admins>;
