import { pgTable, serial, integer, numeric, date, jsonb, timestamp } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { placementSlots } from "./placement-slots";

export const trendScores = pgTable("trend_scores", {
    trendScoreId: serial("trend_score_id").primaryKey(),
    trendScoreAsOfDate: date("trend_score_as_of_date"),
    trendScoreSlotId: integer("trend_score_slot_id").references(() => placementSlots.placementSlotId, { onDelete: "cascade" }).notNull(),
    trendScoreScore: numeric("trend_score_score", { precision: 10, scale: 4 }),
    trendScoreComponents: jsonb("trend_score_components"),
    trendScoreCreatedAt: timestamp("trend_score_created_at").defaultNow(),
});

export type TrendScore = InferSelectModel<typeof trendScores>;
export type NewTrendScore = InferInsertModel<typeof trendScores>;
