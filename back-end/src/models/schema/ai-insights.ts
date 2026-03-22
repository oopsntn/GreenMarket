import { pgTable, serial, integer, varchar, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { users } from "./users";

export const aiInsights = pgTable("ai_insights", {
    aiInsightId: serial("ai_insight_id").primaryKey(),
    aiInsightRequestedBy: integer("ai_insight_requested_by").references(() => users.userId, { onDelete: "cascade" }).notNull(),
    aiInsightScope: varchar("ai_insight_scope", { length: 50 }),
    aiInsightInputSnapshot: jsonb("ai_insight_input_snapshot"),
    aiInsightOutputText: text("ai_insight_output_text"),
    aiInsightProvider: varchar("ai_insight_provider", { length: 50 }),
    aiInsightCreatedAt: timestamp("ai_insight_created_at").defaultNow(),
});

export type AiInsight = InferSelectModel<typeof aiInsights>;
export type NewAiInsight = InferInsertModel<typeof aiInsights>;
