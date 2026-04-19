import {
  index,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { users } from "./users";

export const payoutRequests = pgTable(
  "payout_requests",
  {
    payoutRequestId: serial("payout_request_id").primaryKey(),
    payoutRequestUserId: integer("payout_request_user_id")
      .references(() => users.userId, { onDelete: "cascade" })
      .notNull(),
    payoutRequestAmount: numeric("payout_request_amount", {
      precision: 15,
      scale: 2,
    }).notNull(),
    payoutRequestMethod: varchar("payout_request_method", { length: 50 })
      .notNull(),
    payoutRequestStatus: varchar("payout_request_status", { length: 20 })
      .notNull()
      .default("pending"),
    payoutRequestNote: text("payout_request_note"),
    payoutRequestCreatedAt: timestamp("payout_request_created_at").defaultNow(),
    payoutRequestProcessedAt: timestamp("payout_request_processed_at"),
  },
  (table) => ({
    userCreatedIdx: index("payout_requests_user_created_idx").on(
      table.payoutRequestUserId,
      table.payoutRequestCreatedAt,
    ),
  }),
);

export type PayoutRequest = InferSelectModel<typeof payoutRequests>;
export type NewPayoutRequest = InferInsertModel<typeof payoutRequests>;

