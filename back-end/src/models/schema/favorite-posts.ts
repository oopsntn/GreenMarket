import { pgTable, integer, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { users } from "./users";
import { posts } from "./posts";

export const favoritePosts = pgTable("favorite_posts", {
    favoritePostUserId: integer("favorite_post_user_id").references(() => users.userId, { onDelete: "cascade" }).notNull(),
    favoritePostPostId: integer("favorite_post_post_id").references(() => posts.postId, { onDelete: "cascade" }).notNull(),
    favoritePostCreatedAt: timestamp("favorite_post_created_at").defaultNow(),
}, (table) => {
    return {
        pk: primaryKey({ columns: [table.favoritePostUserId, table.favoritePostPostId] }),
    };
});

export type FavoritePost = InferSelectModel<typeof favoritePosts>;
export type NewFavoritePost = InferInsertModel<typeof favoritePosts>;
