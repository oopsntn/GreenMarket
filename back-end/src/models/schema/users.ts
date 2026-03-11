import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";

export const users = pgTable("users", {
    userId: serial("user_id").primaryKey(),
    userMobile: varchar("user_mobile", { length: 15 }),
    userDisplayName: varchar("user_display_name", { length: 80 }),
    userAvatarUrl: varchar("user_avatar_url", { length: 255 }),
    userStatus: varchar("user_status", { length: 20 }),
    userRegisteredAt: timestamp("user_registered_at"),
    userLastLoginAt: timestamp("user_last_login_at"),
    userCreatedAt: timestamp("user_created_at").defaultNow(),
    userUpdatedAt: timestamp("user_updated_at").defaultNow(),
});

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
