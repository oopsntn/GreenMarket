import {
    pgTable,
    serial,
    integer,
    varchar,
    boolean,
    timestamp,
    numeric,
    text,
} from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { placementSlots } from "./placement-slots";

export const promotionPackages = pgTable("promotion_packages", {
    promotionPackageId: serial("promotion_package_id").primaryKey(),
    promotionPackageSlotId: integer("promotion_package_slot_id").references(() => placementSlots.placementSlotId, { onDelete: "cascade" }).notNull(),
    promotionPackageTitle: varchar("promotion_package_title", { length: 150 }),
    promotionPackageDurationDays: integer("promotion_package_duration_days"),
    promotionPackagePrice: numeric("promotion_package_price", { precision: 15, scale: 2 }),
    promotionPackageMaxPosts: integer("promotion_package_max_posts").default(1),
    promotionPackageDisplayQuota: integer("promotion_package_display_quota").default(0),
    promotionPackageDescription: text("promotion_package_description"),
    promotionPackagePublished: boolean("promotion_package_published").default(false),
    // Soft delete: NULL = đang hoạt động; có giá trị = đã xóa
    promotionPackageDeletedAt: timestamp("promotion_package_deleted_at"),
    promotionPackageCreatedAt: timestamp("promotion_package_created_at").defaultNow(),
});

export type PromotionPackage = InferSelectModel<typeof promotionPackages>;
export type NewPromotionPackage = InferInsertModel<typeof promotionPackages>;
