import {
  index,
  integer,
  pgTable,
  primaryKey,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { users } from "./users";

export const userFavorites = pgTable(
  "user_favorites",
  {
    userId: integer("user_id")
      .references(() => users.userId, { onDelete: "cascade" })
      .notNull(),
    targetId: integer("target_id").notNull(),
    targetType: varchar("target_type", { length: 50 }).notNull(), // post, host_content
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.targetId, table.targetType] }),
    userIdIdx: index("idx_user_favorites_user").on(table.userId),
  }),
);

export type UserFavorite = InferSelectModel<typeof userFavorites>;
export type NewUserFavorite = InferInsertModel<typeof userFavorites>;
