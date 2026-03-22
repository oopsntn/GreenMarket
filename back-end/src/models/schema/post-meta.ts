import { pgTable, serial, integer, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { posts } from "./posts";

export const postMeta = pgTable("post_meta", {
    postMetaId: serial("post_meta_id").primaryKey(),
    postMetaPostId: integer("post_meta_post_id").references(() => posts.postId, { onDelete: "cascade" }).notNull(),
    postMetaKey: varchar("post_meta_key", { length: 100 }),
    postMetaContent: text("post_meta_content"),
    postMetaCreatedAt: timestamp("post_meta_created_at").defaultNow(),
});

export type PostMeta = InferSelectModel<typeof postMeta>;
export type NewPostMeta = InferInsertModel<typeof postMeta>;
