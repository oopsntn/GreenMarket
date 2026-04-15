import { pgTable, integer, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { users } from "./users.ts";
import { hostContents } from "./host-contents.ts";

export const favoriteContents = pgTable("favorite_contents", {
  favoriteContentUserId: integer("favorite_content_user_id")
    .references(() => users.userId, { onDelete: "cascade" })
    .notNull(),
  favoriteContentId: integer("favorite_content_id")
    .references(() => hostContents.hostContentId, { onDelete: "cascade" })
    .notNull(),
  favoriteContentCreatedAt: timestamp("favorite_content_created_at").defaultNow(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.favoriteContentUserId, table.favoriteContentId] }),
  };
});

export type FavoriteContent = InferSelectModel<typeof favoriteContents>;
export type NewFavoriteContent = InferInsertModel<typeof favoriteContents>;
