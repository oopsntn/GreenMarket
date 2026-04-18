import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  text,
  jsonb,
} from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { businessRoles } from "./business-roles.ts";

export const users = pgTable("users", {
  userId: serial("user_id").primaryKey(),
  userMobile: varchar("user_mobile", { length: 15 }).unique().notNull(),
  userDisplayName: varchar("user_display_name", { length: 80 }),
  userAvatarUrl: text("user_avatar_url"),
  userEmail: varchar("user_email", { length: 255 }),
  userLocation: varchar("user_location", { length: 255 }),
  userBio: text("user_bio"),
  userAvailabilityStatus: varchar("user_availability_status", { length: 20 })
    .notNull()
    .default("available"),
  userAvailabilityNote: text("user_availability_note"),
  userStatus: varchar("user_status", { length: 20 }).default("active"),
  userBusinessRoleId: integer("user_business_role_id").references(
    () => businessRoles.businessRoleId,
    { onDelete: "set null" },
  ),
  userSpecialistData: jsonb("user_specialist_data"),
  userRegisteredAt: timestamp("user_registered_at").defaultNow(),
  userLastLoginAt: timestamp("user_last_login_at"),
  userCreatedAt: timestamp("user_created_at").defaultNow(),
  userUpdatedAt: timestamp("user_updated_at").defaultNow(),
});

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
