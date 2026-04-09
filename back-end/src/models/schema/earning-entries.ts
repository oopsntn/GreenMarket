import {
  index,
  integer,
  numeric,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { jobs } from "./jobs";
import { users } from "./users";

export const earningEntries = pgTable(
  "earning_entries",
  {
    earningEntryId: serial("earning_entry_id").primaryKey(),
    earningEntryCollaboratorId: integer("earning_entry_collaborator_id")
      .references(() => users.userId, { onDelete: "cascade" })
      .notNull(),
    earningEntryJobId: integer("earning_entry_job_id").references(
      () => jobs.jobId,
      { onDelete: "set null" },
    ),
    earningEntryAmount: numeric("earning_entry_amount", {
      precision: 15,
      scale: 2,
    })
      .notNull()
      .default("0"),
    earningEntryType: varchar("earning_entry_type", { length: 30 })
      .notNull()
      .default("job"),
    earningEntryCreatedAt: timestamp("earning_entry_created_at").defaultNow(),
  },
  (table) => ({
    collaboratorCreatedIdx: index("earning_entries_collaborator_created_idx").on(
      table.earningEntryCollaboratorId,
      table.earningEntryCreatedAt,
    ),
  }),
);

export type EarningEntry = InferSelectModel<typeof earningEntries>;
export type NewEarningEntry = InferInsertModel<typeof earningEntries>;

