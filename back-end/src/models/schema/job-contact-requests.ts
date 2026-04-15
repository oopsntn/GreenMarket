import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { jobs } from "./jobs";
import { users } from "./users";

export const jobContactRequests = pgTable(
  "job_contact_requests",
  {
    contactRequestId: serial("contact_request_id").primaryKey(),
    contactRequestJobId: integer("contact_request_job_id")
      .references(() => jobs.jobId, { onDelete: "cascade" })
      .notNull(),
    contactRequestCollaboratorId: integer("contact_request_collaborator_id")
      .references(() => users.userId, { onDelete: "cascade" })
      .notNull(),
    contactRequestCustomerId: integer("contact_request_customer_id")
      .references(() => users.userId, { onDelete: "cascade" })
      .notNull(),
    contactRequestMessage: text("contact_request_message").notNull(),
    contactRequestStatus: varchar("contact_request_status", { length: 20 })
      .notNull()
      .default("sent"),
    contactRequestCreatedAt: timestamp("contact_request_created_at").defaultNow(),
    contactRequestRepliedAt: timestamp("contact_request_replied_at"),
  },
  (table) => ({
    collaboratorCreatedIdx: index(
      "job_contact_requests_collaborator_created_idx",
    ).on(table.contactRequestCollaboratorId, table.contactRequestCreatedAt),
    jobCreatedIdx: index("job_contact_requests_job_created_idx").on(
      table.contactRequestJobId,
      table.contactRequestCreatedAt,
    ),
  }),
);

export type JobContactRequest = InferSelectModel<typeof jobContactRequests>;
export type NewJobContactRequest = InferInsertModel<typeof jobContactRequests>;
