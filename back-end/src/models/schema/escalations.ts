import { pgTable, serial, integer, varchar, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { users } from "./users.ts";
import { operationTasks } from "./operation-tasks.ts";

export const escalations = pgTable("escalations", {
    escalationId: serial("escalation_id").primaryKey(),
    sourceTaskId: integer("source_task_id").references(() => operationTasks.taskId, { onDelete: "set null" }),
    targetType: varchar("target_type", { length: 50 }).notNull(),
    targetId: integer("target_id").notNull(),
    createdBy: integer("created_by").references(() => users.userId, { onDelete: "cascade" }).notNull(),
    severity: varchar("severity", { length: 20 }).notNull().default("medium"),
    reason: text("reason").notNull(),
    evidenceUrls: jsonb("evidence_urls").default('[]'),
    status: varchar("status", { length: 20 }).notNull().default("open"),
    resolutionNote: text("resolution_note"),
    createdAt: timestamp("created_at").defaultNow(),
    resolvedAt: timestamp("resolved_at"),
});

export type Escalation = InferSelectModel<typeof escalations>;
export type NewEscalation = InferInsertModel<typeof escalations>;
