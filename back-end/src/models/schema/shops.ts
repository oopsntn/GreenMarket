import { pgTable, serial, varchar, text, timestamp, integer, decimal } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { users } from "./users";

export const shops = pgTable("shops", {
    shopId: serial("shop_id").primaryKey(),
    shopOwnerId: integer("shop_owner_id").references(() => users.userId, { onDelete: "cascade" }).notNull().unique(),
    shopName: varchar("shop_name", { length: 150 }).notNull(),
    shopPhone: varchar("shop_phone", { length: 20 }),
    shopLocation: varchar("shop_location", { length: 255 }), // Can be a Google Maps link or address
    shopDescription: text("shop_description"),
    shopStatus: varchar("shop_status", { length: 20 }).default("pending"), // pending, active, blocked, closed
    shopLat: decimal("shop_lat", { precision: 10, scale: 8 }),
    shopLng: decimal("shop_lng", { precision: 11, scale: 8 }),
    shopCreatedAt: timestamp("shop_created_at").defaultNow(),
    shopUpdatedAt: timestamp("shop_updated_at").defaultNow(),
});

export type Shop = InferSelectModel<typeof shops>;
export type NewShop = InferInsertModel<typeof shops>;
