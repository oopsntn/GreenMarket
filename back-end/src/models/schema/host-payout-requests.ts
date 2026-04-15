import { pgTable, serial, varchar, text, timestamp, integer, decimal } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { users } from "./users.ts";

export const hostPayoutRequests = pgTable("host_payout_requests", {
  hostPayoutId: serial("host_payout_id").primaryKey(),
  hostPayoutHostId: integer("host_payout_host_id").references(() => users.userId, { onDelete: "cascade" }),
  hostPayoutAmount: decimal("host_payout_amount", { precision: 15, scale: 2 }).notNull(),
  hostPayoutMethod: varchar("host_payout_method", { length: 50 }).notNull(),
  hostPayoutStatus: varchar("host_payout_status", { length: 20 }).default("pending"), // 'pending', 'completed', 'rejected'
  hostPayoutNote: text("host_payout_note"),
  hostPayoutProcessedAt: timestamp("host_payout_processed_at"),
  hostPayoutCreatedAt: timestamp("host_payout_created_at").defaultNow(),
});

export type HostPayoutRequest = InferSelectModel<typeof hostPayoutRequests>;
export type NewHostPayoutRequest = InferInsertModel<typeof hostPayoutRequests>;
