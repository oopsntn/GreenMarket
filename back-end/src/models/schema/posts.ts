import { pgTable, serial, varchar, text, timestamp, integer, numeric, boolean, index } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel, sql } from "drizzle-orm";
import { categories } from "./categories";
import { users } from "./users";
import { shops } from "./shops";

export const posts = pgTable("posts", {
    postId: serial("post_id").primaryKey(),
    postAuthorId: integer("post_author_id").references(() => users.userId, { onDelete: "cascade" }).notNull(),
    postShopId: integer("post_shop_id").references(() => shops.shopId, { onDelete: "set null" }),
    categoryId: integer("category_id").references(() => categories.categoryId, { onDelete: "cascade" }),
    postTitle: varchar("post_title", { length: 255 }).notNull(),
    postSlug: varchar("post_slug", { length: 255 }).unique().notNull(),
    postPrice: numeric("post_price", { precision: 12, scale: 2 }),
    postLocation: varchar("post_location", { length: 255 }),
    postStatus: varchar("post_status", { length: 20 }).default("pending").notNull(), // pending, approved, rejected, hidden, draft
    postRejectedReason: text("post_rejected_reason"),
    postContactPhone: varchar("post_contact_phone", { length: 20 }),
    postPublished: boolean("post_published").default(false),
    postViewCount: integer("post_view_count").default(0),
    postContactCount: integer("post_contact_count").default(0),
    postSubmittedAt: timestamp("post_submitted_at"),
    postPublishedAt: timestamp("post_published_at"),
    postDeletedAt: timestamp("post_deleted_at"),
    postModeratedAt: timestamp("post_moderated_at"),
    postCreatedAt: timestamp("post_created_at").defaultNow(),
    postUpdatedAt: timestamp("post_updated_at").defaultNow(),
}, (table) => {
    return {
        // PostgreSQL Full-Text Search Index wrapper over Title and Content
        searchIdx: index("post_search_idx").using(
            "gin", 
            sql`to_tsvector('simple', ${table.postTitle})`
        ),
        // B-Tree indexes for high-cardinality filters
        categoryIdx: index("post_category_idx").on(table.categoryId),
        statusIdx: index("post_status_idx").on(table.postStatus),
        priceIdx: index("post_price_idx").on(table.postPrice),
        locationIdx: index("post_location_idx").on(table.postLocation)
    };
});

export type Post = InferSelectModel<typeof posts>;
export type NewPost = InferInsertModel<typeof posts>;
