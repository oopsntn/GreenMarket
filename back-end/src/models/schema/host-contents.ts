import { pgTable, serial, varchar, text, timestamp, integer, jsonb, numeric } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { users } from "./users.ts";

export const hostContents = pgTable("host_contents", {
  hostContentId: serial("host_content_id").primaryKey(),
  hostContentAuthorId: integer("host_content_author_id").references(() => users.userId, { onDelete: "cascade" }),
  hostContentTitle: varchar("host_content_title", { length: 255 }).notNull(),
  hostContentDescription: text("host_content_description"),
  hostContentBody: text("host_content_body"),
  hostContentCategory: varchar("host_content_category", { length: 50 }), // 'Tin tức', 'Mẹo vặt', 'Sự kiện'
  hostContentMediaUrls: jsonb("host_content_media_urls").default([]),
  hostContentStatus: varchar("host_content_status", { length: 20 }).default("pending_admin"), // 'pending_admin', 'published', 'rejected'
  hostContentPayoutAmount: numeric("host_content_payout_amount", { precision: 12, scale: 2 }),
  hostContentViewCount: integer("host_content_view_count").default(0),
  hostContentCreatedAt: timestamp("host_content_created_at").defaultNow(),
  hostContentUpdatedAt: timestamp("host_content_updated_at").defaultNow(),
  hostContentDeletedAt: timestamp("host_content_deleted_at"),
});

export type HostContent = InferSelectModel<typeof hostContents>;
export type NewHostContent = InferInsertModel<typeof hostContents>;
