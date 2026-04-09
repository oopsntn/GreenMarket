import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { jobs } from "./jobs";
import { users } from "./users";

export const jobDeliverables = pgTable(
  "job_deliverables",
  {
    deliverableId: serial("deliverable_id").primaryKey(),
    deliverableJobId: integer("deliverable_job_id")
      .references(() => jobs.jobId, { onDelete: "cascade" })
      .notNull(),
    deliverableCollaboratorId: integer("deliverable_collaborator_id")
      .references(() => users.userId, { onDelete: "cascade" })
      .notNull(),
    deliverableFileUrls: jsonb("deliverable_file_urls")
      .$type<string[]>()
      .notNull()
      .default([]),
    deliverableNote: text("deliverable_note"),
    deliverableSubmittedAt: timestamp("deliverable_submitted_at").defaultNow(),
  },
  (table) => ({
    jobSubmittedIdx: index("job_deliverables_job_submitted_idx").on(
      table.deliverableJobId,
      table.deliverableSubmittedAt,
    ),
  }),
);

export type JobDeliverable = InferSelectModel<typeof jobDeliverables>;
export type NewJobDeliverable = InferInsertModel<typeof jobDeliverables>;

