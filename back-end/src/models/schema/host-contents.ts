import { pgTable, serial, varchar, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { users } from "./users.ts";

export const hostContents = pgTable("host_contents", {
  hostContentId: serial("host_content_id").primaryKey(),
  hostContentAuthorId: integer("host_content_author_id").references(() => users.userId, { onDelete: "cascade" }),
  hostContentTitle: varchar("host_content_title", { length: 255 }).notNull(),
  hostContentDescription: text("host_content_description"),
  hostContentBody: text("host_content_body"),
  hostContentTargetType: varchar("host_content_target_type", { length: 50 }).notNull(), // 'post', 'shop', 'external'
  hostContentTargetId: integer("host_content_target_id"), // post_id or shop_id
  hostContentTrackingUrl: text("host_content_tracking_url"),
  hostContentMediaUrls: jsonb("host_content_media_urls").default([]),
  // Moderation flow:
  // - host creates -> pending
  // - manager approves -> approved (becomes publicly visible)
  // - manager rejects -> rejected
  // - optional: draft (saved but not submitted)
  hostContentStatus: varchar("host_content_status", { length: 20 }).default("pending"), // 'draft' | 'pending' | 'approved' | 'rejected'
  hostContentViewCount: integer("host_content_view_count").default(0),
  hostContentClickCount: integer("host_content_click_count").default(0),
  hostContentCreatedAt: timestamp("host_content_created_at").defaultNow(),
  hostContentUpdatedAt: timestamp("host_content_updated_at").defaultNow(),
  hostContentDeletedAt: timestamp("host_content_deleted_at"),
});

export type HostContent = InferSelectModel<typeof hostContents>;
export type NewHostContent = InferInsertModel<typeof hostContents>;
