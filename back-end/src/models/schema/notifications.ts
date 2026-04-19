import { pgTable, serial, integer, varchar, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { users } from "./users.ts";

export const notifications = pgTable("notifications", {
    notificationId: serial("notification_id").primaryKey(),
    recipientId: integer("recipient_id").references(() => users.userId, { onDelete: "cascade" }).notNull(),
    senderId: integer("sender_id").references(() => users.userId, { onDelete: "cascade" }), // NULL = System
    title: varchar("title", { length: 255 }),
    message: text("message").notNull(),
    type: varchar("type", { length: 50 }).notNull().default("system"), // system, moderation, job, promotion, etc.
    metaData: jsonb("meta_data").default('{}'), // { target_type, target_id, action_url, etc. }
    isRead: boolean("is_read").default(false),
    createdAt: timestamp("created_at").defaultNow(),
});

export type Notification = InferSelectModel<typeof notifications>;
export type NewNotification = InferInsertModel<typeof notifications>;
