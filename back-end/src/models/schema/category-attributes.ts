import { pgTable, integer, boolean, primaryKey } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { categories } from "./categories";
import { attributes } from "./attributes";

export const categoryAttributes = pgTable("category_attributes", {
    categoryId: integer("category_attribute_category_id").references(() => categories.categoryId, { onDelete: "cascade" }).notNull(),
    attributeId: integer("category_attribute_attribute_id").references(() => attributes.attributeId, { onDelete: "cascade" }).notNull(),
    required: boolean("category_attribute_required").default(false),
}, (table) => {
    return {
        pk: primaryKey({ columns: [table.categoryId, table.attributeId] }),
    };
});

export type CategoryAttribute = InferSelectModel<typeof categoryAttributes>;
export type NewCategoryAttribute = InferInsertModel<typeof categoryAttributes>;
