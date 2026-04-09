import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { users } from "./users.ts";

export const userPostingPlans = pgTable(
  "user_posting_plans",
  {
    postingPlanId: serial("posting_plan_id").primaryKey(),
    postingPlanUserId: integer("posting_plan_user_id")
      .references(() => users.userId, { onDelete: "cascade" })
      .notNull(),
    postingPlanCode: varchar("posting_plan_code", { length: 50 }).notNull(),
    postingPlanTitle: varchar("posting_plan_title", { length: 120 }).notNull(),
    postingPlanCycle: varchar("posting_plan_cycle", { length: 20 })
      .notNull()
      .default("monthly"), // monthly | lifetime
    postingPlanStatus: varchar("posting_plan_status", { length: 20 })
      .notNull()
      .default("active"), // active | expired | cancelled
    postingPlanAutoApprove: boolean("posting_plan_auto_approve")
      .notNull()
      .default(false),
    postingPlanDailyPostLimit: integer("posting_plan_daily_post_limit"),
    postingPlanPostFeeAmount: numeric("posting_plan_post_fee_amount", {
      precision: 15,
      scale: 2,
    })
      .notNull()
      .default("0"),
    postingPlanFreeEditQuota: integer("posting_plan_free_edit_quota")
      .notNull()
      .default(0),
    postingPlanEditFeeAmount: numeric("posting_plan_edit_fee_amount", {
      precision: 15,
      scale: 2,
    })
      .notNull()
      .default("0"),
    postingPlanStartedAt: timestamp("posting_plan_started_at")
      .notNull()
      .defaultNow(),
    postingPlanExpiresAt: timestamp("posting_plan_expires_at"),
    postingPlanCreatedAt: timestamp("posting_plan_created_at").defaultNow(),
    postingPlanUpdatedAt: timestamp("posting_plan_updated_at").defaultNow(),
  },
  (table) => ({
    userStatusIdx: index("user_posting_plans_user_status_idx").on(
      table.postingPlanUserId,
      table.postingPlanStatus,
    ),
    codeStatusIdx: index("user_posting_plans_code_status_idx").on(
      table.postingPlanCode,
      table.postingPlanStatus,
    ),
  }),
);

export type UserPostingPlan = InferSelectModel<typeof userPostingPlans>;
export type NewUserPostingPlan = InferInsertModel<typeof userPostingPlans>;

