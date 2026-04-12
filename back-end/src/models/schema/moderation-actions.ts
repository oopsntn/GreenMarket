import { pgTable, serial, integer, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { admins } from "./admins";
import { posts } from "./posts";

export const moderationActions = pgTable("moderation_actions", {
    moderationActionId: serial("moderation_action_id").primaryKey(),
    moderationActionActionBy: integer("moderation_action_action_by").references(() => admins.adminId, { onDelete: "cascade" }).notNull(),
    moderationActionPostId: integer("moderation_action_post_id").references(() => posts.postId, { onDelete: "set null" }),
    moderationActionAction: varchar("moderation_action_action", { length: 50 }),
    moderationActionNote: text("moderation_action_note"),
    moderationActionCreatedAt: timestamp("moderation_action_created_at").defaultNow(),
});

export type ModerationAction = InferSelectModel<typeof moderationActions>;
export type NewModerationAction = InferInsertModel<typeof moderationActions>;
