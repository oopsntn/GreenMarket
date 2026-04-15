import { pgTable, serial, integer, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { users } from "./users.ts";

export const moderationFeedback = pgTable("moderation_feedback", {
    feedbackId: serial("feedback_id").primaryKey(),
    targetType: varchar("target_type", { length: 50 }).notNull(),
    targetId: integer("target_id").notNull(),
    senderId: integer("sender_id").references(() => users.userId, { onDelete: "cascade" }).notNull(),
    recipientId: integer("recipient_id").references(() => users.userId, { onDelete: "cascade" }).notNull(),
    message: text("message").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

export type ModerationFeedback = InferSelectModel<typeof moderationFeedback>;
export type NewModerationFeedback = InferInsertModel<typeof moderationFeedback>;
