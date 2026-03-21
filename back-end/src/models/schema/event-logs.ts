import { pgTable, serial, integer, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { users } from "./users";

export const eventLogs = pgTable("event_logs", {
    eventLogId: serial("event_log_id").primaryKey(),
    eventLogUserId: integer("event_log_user_id").references(() => users.userId, { onDelete: "set null" }),
    eventLogPostId: integer("event_log_post_id"),
    eventLogShopId: integer("event_log_shop_id"),
    eventLogSlotId: integer("event_log_slot_id"),
    eventLogCategoryId: integer("event_log_category_id"),
    eventLogEventType: varchar("event_log_event_type", { length: 50 }),
    eventLogEventTime: timestamp("event_log_event_time").defaultNow(),
    eventLogMeta: jsonb("event_log_meta"),
});

export type EventLog = InferSelectModel<typeof eventLogs>;
export type NewEventLog = InferInsertModel<typeof eventLogs>;
