import { pgTable, integer, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { posts } from "./posts";
import { categories } from "./categories";

export const postCategories = pgTable("post_categories", {
    postCategoryPostId: integer("post_category_post_id").references(() => posts.postId, { onDelete: "cascade" }).notNull(),
    postCategoryCategoryId: integer("post_category_category_id").references(() => categories.categoryId, { onDelete: "cascade" }).notNull(),
}, (table) => {
    return {
        pk: primaryKey({ columns: [table.postCategoryPostId, table.postCategoryCategoryId] }),
    };
});

export type PostCategory = InferSelectModel<typeof postCategories>;
export type NewPostCategory = InferInsertModel<typeof postCategories>;
