import { pgTable, serial, varchar, text, timestamp, integer, decimal, boolean } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { users } from "./users";

export const shops = pgTable("shops", {
    shopId: integer("shop_id").primaryKey().references(() => users.userId, { onDelete: "cascade" }),
    shopName: varchar("shop_name", { length: 150 }).notNull(),
    shopPhone: varchar("shop_phone", { length: 50 }),
    shopEmail: varchar("shop_email", { length: 255 }).unique(),
    shopEmailVerified: boolean("shop_email_verified").default(false),
    shopFacebook: varchar("shop_facebook", { length: 255 }),
    shopInstagram: varchar("shop_instagram", { length: 255 }),
    shopYoutube: varchar("shop_youtube", { length: 255 }),
    shopLocation: varchar("shop_location", { length: 255 }), // Can be a Google Maps link or address
    shopDescription: text("shop_description"),
    shopLogoUrl: varchar("shop_logo_url", { length: 255 }),
    shopCoverUrl: varchar("shop_cover_url", { length: 255 }),
    shopStatus: varchar("shop_status", { length: 20 }).default("pending"), // pending, active, blocked, closed
    shopLat: decimal("shop_lat", { precision: 10, scale: 8 }),
    shopLng: decimal("shop_lng", { precision: 11, scale: 8 }),
    shopCreatedAt: timestamp("shop_created_at").defaultNow(),
    shopUpdatedAt: timestamp("shop_updated_at").defaultNow(),
});

export type Shop = InferSelectModel<typeof shops>;
export type NewShop = InferInsertModel<typeof shops>;
