import { pgTable, serial, varchar, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const admins = pgTable("admins", {
    adminId: serial("adminId").primaryKey(),
    adminEmail: varchar("adminEmail", { length: 150 }).notNull(),
    adminUsername: varchar("adminUsername", { length: 50 }),
    adminPasswordHash: varchar("adminPasswordHash", { length: 255 }).notNull(),
    adminFullName: varchar("adminFullName", { length: 100 }),
    adminAvatarUrl: varchar("adminAvatarUrl", { length: 255 }),
    adminStatus: varchar("adminStatus", { length: 20 }),
    adminLastLoginAt: timestamp("adminLastLoginAt"),
    adminCreatedAt: timestamp("adminCreatedAt").defaultNow(),
    adminUpdatedAt: timestamp("adminUpdatedAt").defaultNow(),
}, (table) => ({
    adminEmailUnique: uniqueIndex("adminEmailUnique").on(table.adminEmail),
    adminUsernameUnique: uniqueIndex("adminUsernameUnique").on(table.adminUsername),
}));
