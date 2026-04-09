import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { posts } from "./posts";

export const postImages = pgTable("post_images", {
    imageId: serial("image_id").primaryKey(),
    postId: integer("post_id").references(() => posts.postId, { onDelete: "cascade" }),
    imageUrl: text("image_url").notNull(),
    imageSortOrder: integer("image_sort_order").default(0),
    imageCreatedAt: timestamp("image_created_at").defaultNow(),
});

export type PostImage = InferSelectModel<typeof postImages>;
export type NewPostImage = InferInsertModel<typeof postImages>;
