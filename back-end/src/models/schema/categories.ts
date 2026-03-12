import { pgTable, serial, varchar, text, timestamp, integer, boolean, AnyPgColumn } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";

export const categories = pgTable("categories", {
    categoryId: serial("category_id").primaryKey(),
    categoryParentId: integer("category_parent_id").references((): AnyPgColumn => categories.categoryId, { onDelete: "cascade" }),
    categoryTitle: varchar("category_title", { length: 150 }),
    categorySlug: varchar("category_slug", { length: 150 }),
    categoryPublished: boolean("category_published").default(false),
    categoryCreatedAt: timestamp("category_created_at").defaultNow(),
    categoryUpdatedAt: timestamp("category_updated_at").defaultNow(),
});

export type Category = InferSelectModel<typeof categories>;
export type NewCategory = InferInsertModel<typeof categories>;
