import { pgTable, serial, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { products } from "./products";

export const productImages = pgTable("product_images", {
    imageId: serial("image_id").primaryKey(),
    productId: integer("product_id").references(() => products.productId, { onDelete: "cascade" }),
    imageUrl: varchar("image_url", { length: 500 }).notNull(),
    imageSortOrder: integer("image_sort_order").default(0),
    imageCreatedAt: timestamp("image_created_at").defaultNow(),
});

export type ProductImage = InferSelectModel<typeof productImages>;
export type NewProductImage = InferInsertModel<typeof productImages>;
