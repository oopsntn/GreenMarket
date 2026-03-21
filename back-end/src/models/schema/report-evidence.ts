import { pgTable, serial, integer, varchar, timestamp } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { reports } from "./reports";

export const reportEvidence = pgTable("report_evidence", {
    reportEvidenceId: serial("report_evidence_id").primaryKey(),
    reportEvidenceReportId: integer("report_evidence_report_id").references(() => reports.reportId, { onDelete: "cascade" }).notNull(),
    reportEvidenceUrl: varchar("report_evidence_url", { length: 255 }),
    reportEvidenceCreatedAt: timestamp("report_evidence_created_at").defaultNow(),
});

export type ReportEvidence = InferSelectModel<typeof reportEvidence>;
export type NewReportEvidence = InferInsertModel<typeof reportEvidence>;
