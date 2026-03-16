import { pgTable, serial, integer, text, timestamp, index } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { posts } from "./posts";
import { attributes } from "./attributes";

export const postAttributeValues = pgTable("post_attribute_values", {
    valueId: serial("value_id").primaryKey(),
    postId: integer("post_id").references(() => posts.postId, { onDelete: "cascade" }),
    attributeId: integer("attribute_id").references(() => attributes.attributeId, { onDelete: "cascade" }),
    attributeValue: text("attribute_value").notNull(), // Stores the specific value (e.g., "5 years old", "Ficus", "50cm")
    valueCreatedAt: timestamp("value_created_at").defaultNow(),
}, (table) => {
    return {
        attributeFilterIdx: index("attribute_filter_idx").on(table.postId, table.attributeId, table.attributeValue),
    }
});

export type PostAttributeValue = InferSelectModel<typeof postAttributeValues>;
export type NewPostAttributeValue = InferInsertModel<typeof postAttributeValues>;
