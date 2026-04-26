import { pgTable, serial, integer, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { tickets } from "./tickets";
import { users } from "./users";

export const taskReplies = pgTable("task_replies", {
    replyId: serial("reply_id").primaryKey(),
    ticketId: integer("ticket_id").references(() => tickets.ticketId, { onDelete: "cascade" }).notNull(),
    senderId: integer("sender_id").references(() => users.userId, { onDelete: "cascade" }).notNull(),
    message: text("message").notNull(),
    attachments: jsonb("attachments").default('[]'),
    visibility: varchar("visibility", { length: 20 }).default("internal"),
    createdAt: timestamp("created_at").defaultNow(),
});

export type TaskReply = InferSelectModel<typeof taskReplies>;
export type NewTaskReply = InferInsertModel<typeof taskReplies>;
