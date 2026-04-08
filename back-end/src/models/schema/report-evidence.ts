import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { reports } from "./reports";

export const reportEvidence = pgTable("report_evidence", {
    reportEvidenceId: serial("report_evidence_id").primaryKey(),
    reportEvidenceReportId: integer("report_evidence_report_id").references(() => reports.reportId, { onDelete: "cascade" }).notNull(),
    reportEvidenceUrl: text("report_evidence_url"),
    reportEvidenceCreatedAt: timestamp("report_evidence_created_at").defaultNow(),
});

export type ReportEvidence = InferSelectModel<typeof reportEvidence>;
export type NewReportEvidence = InferInsertModel<typeof reportEvidence>;
