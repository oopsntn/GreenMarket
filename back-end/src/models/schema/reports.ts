import { pgTable, serial, varchar, text, timestamp, integer } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { users } from "./users.ts";
import { posts } from "./posts.ts";

export const reports = pgTable("reports", {
    reportId: serial("report_id").primaryKey(),
    reporterId: integer("reporter_id").references(() => users.userId, { onDelete: "set null" }),
    postId: integer("post_id").references(() => posts.postId, { onDelete: "cascade" }).notNull(),
    reportReason: text("report_reason").notNull(),
    reportStatus: varchar("report_status", { length: 20 }).default("pending").notNull(), // pending, resolved, dismissed
    adminNote: text("admin_note"),
    reportCreatedAt: timestamp("report_created_at").defaultNow(),
    reportUpdatedAt: timestamp("report_updated_at").defaultNow(),
});

export type Report = InferSelectModel<typeof reports>;
export type NewReport = InferInsertModel<typeof reports>;
