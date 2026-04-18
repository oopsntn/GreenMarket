import {
  index,
  integer,
  numeric,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { users } from "./users.ts";

export const earnings = pgTable(
  "earnings",
  {
    earningId: serial("earning_id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.userId, { onDelete: "cascade" })
      .notNull(),
    amount: numeric("amount", {
      precision: 15,
      scale: 2,
    })
      .notNull()
      .default("0"),
    status: varchar("status", { length: 20 })
      .notNull()
      .default("available"), // pending | available
    type: varchar("type", { length: 50 }).notNull(), // job, article_payout, performance_bonus
    sourceId: integer("source_id"), // linked job_id, host_content_id, etc.
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    userIdIdx: index("idx_earnings_user").on(table.userId),
    typeIdx: index("idx_earnings_type").on(table.type),
  }),
);

export type Earning = InferSelectModel<typeof earnings>;
export type NewEarning = InferInsertModel<typeof earnings>;
