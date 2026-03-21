import { pgTable, integer, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { users } from "./users";
import { shops } from "./shops";

export const blockedShops = pgTable("blocked_shops", {
    blockedShopUserId: integer("blocked_shop_user_id").references(() => users.userId, { onDelete: "cascade" }).notNull(),
    blockedShopShopId: integer("blocked_shop_shop_id").references(() => shops.shopId, { onDelete: "cascade" }).notNull(),
    blockedShopCreatedAt: timestamp("blocked_shop_created_at").defaultNow(),
}, (table) => {
    return {
        pk: primaryKey({ columns: [table.blockedShopUserId, table.blockedShopShopId] }),
    };
});

export type BlockedShop = InferSelectModel<typeof blockedShops>;
export type NewBlockedShop = InferInsertModel<typeof blockedShops>;
