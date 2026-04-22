import { pgTable, serial, varchar, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { users } from "./users";

export const tickets = pgTable("tickets", {
    ticketId: serial("ticket_id").primaryKey(),
    ticketType: varchar("ticket_type", { length: 50 }).notNull(), // SUPPORT, REPORT, ESCALATION
    ticketCreatorId: integer("ticket_creator_id").notNull().references(() => users.userId, { onDelete: "cascade" }),
    ticketAssigneeId: integer("ticket_assignee_id").references(() => users.userId, { onDelete: "set null" }),
    ticketStatus: varchar("ticket_status", { length: 20 }).notNull().default("open"),
    ticketPriority: varchar("ticket_priority", { length: 20 }).notNull().default("medium"),
    ticketTargetType: varchar("ticket_target_type", { length: 50 }), // post, shop, user, order
    ticketTargetId: integer("ticket_target_id"),
    ticketTitle: varchar("ticket_title", { length: 255 }),
    ticketContent: text("ticket_content").notNull(),
    ticketResolutionNote: text("ticket_resolution_note"),
    ticketMetaData: jsonb("ticket_meta_data").default({}),
    ticketCreatedAt: timestamp("ticket_created_at").defaultNow(),
    ticketUpdatedAt: timestamp("ticket_updated_at").defaultNow(),
    ticketResolvedAt: timestamp("ticket_resolved_at"),
});

export type Ticket = InferSelectModel<typeof tickets>;
export type NewTicket = InferInsertModel<typeof tickets>;
