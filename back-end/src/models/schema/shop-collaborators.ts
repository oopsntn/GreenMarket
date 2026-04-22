import { pgTable, serial, timestamp, integer, varchar, uniqueIndex } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { users } from "./users";
import { shops } from "./shops";

export const shopCollaborators = pgTable("shop_collaborators", {
  shopCollaboratorsId: serial("shop_collaborators_id").primaryKey(),
  shopCollaboratorsShopId: integer("shop_collaborators_shop_id").references(() => shops.shopId, { onDelete: "cascade" }).notNull(),
  collaboratorId: integer("collaborator_id").references(() => users.userId, { onDelete: "cascade" }).notNull(),
  shopCollaboratorsStatus: varchar("shop_collaborators_status", { length: 20 }).default("pending").notNull(), // 'active', 'pending', 'removed'
  shopCollaboratorsCreatedAt: timestamp("shop_collaborators_created_at").defaultNow(),
}, (table) => {
  return {
    shopCollaboratorUnique: uniqueIndex("shop_collaborator_unique_idx").on(table.shopCollaboratorsShopId, table.collaboratorId),
  };
});

export type ShopCollaborator = InferSelectModel<typeof shopCollaborators>;
export type NewShopCollaborator = InferInsertModel<typeof shopCollaborators>;
