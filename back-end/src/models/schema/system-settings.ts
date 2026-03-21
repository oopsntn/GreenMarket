import { pgTable, serial, varchar, text, integer, timestamp } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { admins } from "./admins";

export const systemSettings = pgTable("system_settings", {
    systemSettingId: serial("system_setting_id").primaryKey(),
    systemSettingKey: varchar("system_setting_key", { length: 100 }).unique(),
    systemSettingValue: text("system_setting_value"),
    systemSettingUpdatedBy: integer("system_setting_updated_by").references(() => admins.adminId, { onDelete: "set null" }),
    systemSettingUpdatedAt: timestamp("system_setting_updated_at").defaultNow(),
});

export type SystemSetting = InferSelectModel<typeof systemSettings>;
export type NewSystemSetting = InferInsertModel<typeof systemSettings>;
