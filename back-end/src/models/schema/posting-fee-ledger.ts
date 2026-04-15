import {
  index,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { users } from "./users.ts";
import { posts } from "./posts.ts";
import { userPostingPlans } from "./user-posting-plans.ts";

export const postingFeeLedger = pgTable(
  "posting_fee_ledger",
  {
    postingFeeId: serial("posting_fee_id").primaryKey(),
    postingFeeUserId: integer("posting_fee_user_id")
      .references(() => users.userId, { onDelete: "cascade" })
      .notNull(),
    postingFeePostId: integer("posting_fee_post_id").references(
      () => posts.postId,
      { onDelete: "set null" },
    ),
    postingFeePlanId: integer("posting_fee_plan_id").references(
      () => userPostingPlans.postingPlanId,
      { onDelete: "set null" },
    ),
    postingFeeActionType: varchar("posting_fee_action_type", {
      length: 30,
    }).notNull(), // POST_CREATE | POST_EDIT
    postingFeeQuantity: integer("posting_fee_quantity").notNull().default(1),
    postingFeeUnitAmount: numeric("posting_fee_unit_amount", {
      precision: 15,
      scale: 2,
    })
      .notNull()
      .default("0"),
    postingFeeTotalAmount: numeric("posting_fee_total_amount", {
      precision: 15,
      scale: 2,
    })
      .notNull()
      .default("0"),
    postingFeeCurrency: varchar("posting_fee_currency", { length: 10 })
      .notNull()
      .default("VND"),
    postingFeeNote: text("posting_fee_note"),
    postingFeeCreatedAt: timestamp("posting_fee_created_at").defaultNow(),
  },
  (table) => ({
    userCreatedIdx: index("posting_fee_ledger_user_created_idx").on(
      table.postingFeeUserId,
      table.postingFeeCreatedAt,
    ),
    postCreatedIdx: index("posting_fee_ledger_post_created_idx").on(
      table.postingFeePostId,
      table.postingFeeCreatedAt,
    ),
  }),
);

export type PostingFeeLedger = InferSelectModel<typeof postingFeeLedger>;
export type NewPostingFeeLedger = InferInsertModel<typeof postingFeeLedger>;

