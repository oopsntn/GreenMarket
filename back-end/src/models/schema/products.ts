import { pgTable, serial, varchar, text, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { categories } from "./categories";

export const products = pgTable("products", {
    productId: serial("product_id").primaryKey(),
    categoryId: integer("category_id").references(() => categories.categoryId, { onDelete: "cascade" }),
    productTitle: varchar("product_title", { length: 255 }).notNull(),
    productSlug: varchar("product_slug", { length: 255 }).unique().notNull(),
    productDescription: text("product_description"),
    productPrice: numeric("product_price", { precision: 12, scale: 2 }).notNull(),
    productStock: integer("product_stock").default(0).notNull(),
    productStatus: varchar("product_status", { length: 50 }).default("draft").notNull(), // draft, published, out_of_stock
    productCreatedAt: timestamp("product_created_at").defaultNow(),
    productUpdatedAt: timestamp("product_updated_at").defaultNow(),
});

export type Product = InferSelectModel<typeof products>;
export type NewProduct = InferInsertModel<typeof products>;
