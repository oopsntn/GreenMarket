import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { products } from "./products";
import { attributes } from "./attributes";

export const productAttributeValues = pgTable("product_attribute_values", {
    valueId: serial("value_id").primaryKey(),
    productId: integer("product_id").references(() => products.productId, { onDelete: "cascade" }),
    attributeId: integer("attribute_id").references(() => attributes.attributeId, { onDelete: "cascade" }),
    attributeValue: text("attribute_value").notNull(), // Stores the specific value (e.g., "5 years old", "Ficus", "50cm")
    valueCreatedAt: timestamp("value_created_at").defaultNow(),
});

export type ProductAttributeValue = InferSelectModel<typeof productAttributeValues>;
export type NewProductAttributeValue = InferInsertModel<typeof productAttributeValues>;
