import { pgTable, serial, integer, numeric, date, timestamp } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { placementSlots } from "./placement-slots";
import { categories } from "./categories";

export const dailyPlacementMetrics = pgTable("daily_placement_metrics", {
    dailyPlacementMetricId: serial("daily_placement_metric_id").primaryKey(),
    dailyPlacementMetricDate: date("daily_placement_metric_date"),
    dailyPlacementMetricSlotId: integer("daily_placement_metric_slot_id").references(() => placementSlots.placementSlotId, { onDelete: "cascade" }).notNull(),
    dailyPlacementMetricCategoryId: integer("daily_placement_metric_category_id").references(() => categories.categoryId, { onDelete: "set null" }),
    dailyPlacementMetricImpressions: integer("daily_placement_metric_impressions").default(0),
    dailyPlacementMetricClicks: integer("daily_placement_metric_clicks").default(0),
    dailyPlacementMetricDetailViews: integer("daily_placement_metric_detail_views").default(0),
    dailyPlacementMetricContacts: integer("daily_placement_metric_contacts").default(0),
    dailyPlacementMetricCtr: numeric("daily_placement_metric_ctr", { precision: 5, scale: 4 }),
    dailyPlacementMetricCreatedAt: timestamp("daily_placement_metric_created_at").defaultNow(),
});

export type DailyPlacementMetric = InferSelectModel<typeof dailyPlacementMetrics>;
export type NewDailyPlacementMetric = InferInsertModel<typeof dailyPlacementMetrics>;
