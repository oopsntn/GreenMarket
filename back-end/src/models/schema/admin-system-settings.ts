import {
  pgTable,
  serial,
  integer,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { admins } from "./admins.ts";

export const adminSystemSettings = pgTable("admin_system_settings", {
  settingId: serial("setting_id").primaryKey(),
  otpSandboxEnabled: boolean("otp_sandbox_enabled"),
  maxImagesPerPost: integer("max_images_per_post"),
  postRateLimitPerHour: integer("post_rate_limit_per_hour"),
  bannedKeywords: jsonb("banned_keywords").$type<string[]>(),
  autoModerationEnabled: boolean("auto_moderation_enabled"),
  keywordFilterEnabled: boolean("keyword_filter_enabled"),
  reportRateLimit: integer("report_rate_limit"),
  postExpiryDays: integer("post_expiry_days"),
  restoreWindowDays: integer("restore_window_days"),
  autoExpireEnabled: boolean("auto_expire_enabled"),
  maxFileSizeMb: integer("max_file_size_mb"),
  imageCompressionEnabled: boolean("image_compression_enabled"),
  updatedBy: integer("updated_by").references(() => admins.adminId, {
    onDelete: "set null",
  }),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type AdminSystemSetting = InferSelectModel<typeof adminSystemSettings>;
export type NewAdminSystemSetting = InferInsertModel<
  typeof adminSystemSettings
>;
