import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { admins } from "./admins.ts";

export const adminTemplates = pgTable("admin_templates", {
  templateId: serial("template_id").primaryKey(),
  templateName: varchar("template_name", { length: 150 }).notNull(),
  templateType: varchar("template_type", { length: 50 }).notNull(),
  templateContent: text("template_content").notNull(),
  templateStatus: varchar("template_status", { length: 30 }),
  templateCreatedBy: integer("template_created_by").references(
    () => admins.adminId,
    {
      onDelete: "set null",
    },
  ),
  templateCreatedAt: timestamp("template_created_at").defaultNow(),
  templateUpdatedBy: integer("template_updated_by").references(
    () => admins.adminId,
    {
      onDelete: "set null",
    },
  ),
  templateUpdatedAt: timestamp("template_updated_at").defaultNow(),
});

export type AdminTemplate = InferSelectModel<typeof adminTemplates>;
export type NewAdminTemplate = InferInsertModel<typeof adminTemplates>;
