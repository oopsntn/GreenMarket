import { pgTable, serial, integer, varchar, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { users } from "./users.ts";

export const systemNotifications = pgTable("system_notifications", {
    notificationId: serial("notification_id").primaryKey(),
    recipientId: integer("recipient_id").references(() => users.userId, { onDelete: "cascade" }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    type: varchar("type", { length: 50 }).notNull().default("system"),
    metaData: jsonb("meta_data").default('{}'),
    isRead: boolean("is_read").default(false),
    createdAt: timestamp("created_at").defaultNow(),
});

export type SystemNotification = InferSelectModel<typeof systemNotifications>;
export type NewSystemNotification = InferInsertModel<typeof systemNotifications>;
