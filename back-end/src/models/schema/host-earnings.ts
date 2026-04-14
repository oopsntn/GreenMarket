import { pgTable, serial, varchar, timestamp, integer, decimal } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { users } from "./users.ts";

export const hostEarnings = pgTable("host_earnings", {
  hostEarningId: serial("host_earning_id").primaryKey(),
  hostEarningHostId: integer("host_earning_host_id").references(() => users.userId, { onDelete: "cascade" }),
  hostEarningAmount: decimal("host_earning_amount", { precision: 15, scale: 2 }).notNull(),
  hostEarningStatus: varchar("host_earning_status", { length: 20 }).default("pending"), // 'pending', 'available'
  hostEarningSourceType: varchar("host_earning_source_type", { length: 50 }).notNull(), // 'view', 'click', 'bonus'
  hostEarningSourceId: integer("host_earning_source_id"), // linked to host_content_id or other
  hostEarningCreatedAt: timestamp("host_earning_created_at").defaultNow(),
});

export type HostEarning = InferSelectModel<typeof hostEarnings>;
export type NewHostEarning = InferInsertModel<typeof hostEarnings>;
