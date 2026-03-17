import { pgTable, serial, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { posts } from "./posts";

export const postVideos = pgTable("post_videos", {
    postVideoId: serial("post_video_id").primaryKey(),
    postId: integer("post_id").references(() => posts.postId, { onDelete: "cascade" }).notNull(),
    videoUrl: varchar("video_url", { length: 255 }).notNull(),
    videoPosition: integer("video_position").default(0),
    videoCreatedAt: timestamp("video_created_at").defaultNow(),
});

export type PostVideo = InferSelectModel<typeof postVideos>;
export type NewPostVideo = InferInsertModel<typeof postVideos>;
