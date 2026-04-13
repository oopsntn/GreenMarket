import { pgTable, serial, varchar, text, timestamp, integer } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { users } from "./users.ts";

export const operationTasks = pgTable("operation_tasks", {
    taskId: serial("task_id").primaryKey(),
    taskTitle: varchar("task_title", { length: 255 }).notNull(),
    taskType: varchar("task_type", { length: 50 }).notNull(),
    taskStatus: varchar("task_status", { length: 20 }).notNull().default("open"),
    taskPriority: varchar("task_priority", { length: 20 }).notNull().default("medium"),
    assigneeId: integer("assignee_id").references(() => users.userId, { onDelete: "set null" }),
    customerId: integer("customer_id").references(() => users.userId, { onDelete: "set null" }),
    relatedTargetId: integer("related_target_id"),
    taskNote: text("task_note"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export type OperationTask = InferSelectModel<typeof operationTasks>;
export type NewOperationTask = InferInsertModel<typeof operationTasks>;
