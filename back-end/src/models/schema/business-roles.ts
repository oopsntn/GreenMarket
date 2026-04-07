import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { type InferInsertModel, type InferSelectModel } from "drizzle-orm";

export const businessRoles = pgTable("business_roles", {
  businessRoleId: serial("business_role_id").primaryKey(),
  businessRoleCode: varchar("business_role_code", { length: 50 })
    .notNull()
    .unique(),
  businessRoleTitle: varchar("business_role_title", { length: 100 }).notNull(),
  businessRoleAudienceGroup: varchar("business_role_audience_group", {
    length: 50,
  }),
  businessRoleAccessScope: varchar("business_role_access_scope", {
    length: 100,
  }),
  businessRoleSummary: text("business_role_summary"),
  businessRoleResponsibilities: jsonb("business_role_responsibilities")
    .$type<string[]>()
    .default([]),
  businessRoleCapabilities: jsonb("business_role_capabilities")
    .$type<string[]>()
    .default([]),
  businessRoleStatus: varchar("business_role_status", { length: 20 })
    .notNull()
    .default("active"),
  businessRoleCreatedAt: timestamp("business_role_created_at").defaultNow(),
  businessRoleUpdatedAt: timestamp("business_role_updated_at").defaultNow(),
});

export type BusinessRole = InferSelectModel<typeof businessRoles>;
export type NewBusinessRole = InferInsertModel<typeof businessRoles>;
