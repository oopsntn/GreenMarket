import { pgTable, serial, integer, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { users } from "./users";

export const eventLogs = pgTable("event_logs", {
    eventLogId: serial("event_log_id").primaryKey(),
    eventLogUserId: integer("event_log_user_id").references(() => users.userId, { onDelete: "set null" }), // Performed by
    eventLogTargetType: varchar("event_log_target_type", { length: 50 }), // post, shop, package, slot, category, user, system
    eventLogTargetId: integer("event_log_target_id"),
    eventLogEventType: varchar("event_log_event_type", { length: 50 }).notNull(), // admin_report_resolved, package_updated, etc.
    eventLogEventTime: timestamp("event_log_event_time").defaultNow(),
    eventLogMeta: jsonb("event_log_meta").default('{}'), // Snapshot states, notes, etc.
});

export type EventLog = InferSelectModel<typeof eventLogs>;
export type NewEventLog = InferInsertModel<typeof eventLogs>;
