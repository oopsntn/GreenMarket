import {
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { users } from "./users";

export const jobs = pgTable(
  "jobs",
  {
    jobId: serial("job_id").primaryKey(),
    jobCustomerId: integer("job_customer_id")
      .references(() => users.userId, { onDelete: "cascade" })
      .notNull(),
    jobCollaboratorId: integer("job_collaborator_id").references(
      () => users.userId,
      { onDelete: "set null" },
    ),
    jobTitle: varchar("job_title", { length: 255 }).notNull(),
    jobCategory: varchar("job_category", { length: 100 }),
    jobLocation: varchar("job_location", { length: 255 }),
    jobDeadline: timestamp("job_deadline"),
    jobPrice: numeric("job_price", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    jobDescription: text("job_description"),
    jobRequirements: jsonb("job_requirements").$type<string[]>().default([]),
    jobStatus: varchar("job_status", { length: 20 }).notNull().default("open"),
    jobDeclineReason: text("job_decline_reason"),
    jobCompletedAt: timestamp("job_completed_at"),
    jobCreatedAt: timestamp("job_created_at").defaultNow(),
    jobUpdatedAt: timestamp("job_updated_at").defaultNow(),
  },
  (table) => ({
    statusDeadlineIdx: index("jobs_status_deadline_idx").on(
      table.jobStatus,
      table.jobDeadline,
    ),
    collaboratorStatusIdx: index("jobs_collaborator_status_idx").on(
      table.jobCollaboratorId,
      table.jobStatus,
    ),
  }),
);

export type Job = InferSelectModel<typeof jobs>;
export type NewJob = InferInsertModel<typeof jobs>;

