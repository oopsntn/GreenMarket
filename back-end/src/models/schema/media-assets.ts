import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";

export const mediaAssets = pgTable("media_assets", {
    assetId: serial("asset_id").primaryKey(),
    targetType: text("target_type").notNull(), // post, report, job_deliverable, host_content, user, shop
    targetId: integer("target_id").notNull(),
    mediaType: text("media_type").notNull(), // image, video, document
    url: text("url").notNull(),
    sortOrder: integer("sort_order").default(0),
    metaData: jsonb("meta_data").default({}),
    createdAt: timestamp("created_at").defaultNow(),
});

export type MediaAsset = InferSelectModel<typeof mediaAssets>;
export type NewMediaAsset = InferInsertModel<typeof mediaAssets>;
