import { pgTable, serial, integer, varchar, boolean, timestamp } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { placementSlots } from "./placement-slots";

export const promotionPackages = pgTable("promotion_packages", {
    promotionPackageId: serial("promotion_package_id").primaryKey(),
    promotionPackageSlotId: integer("promotion_package_slot_id").references(() => placementSlots.placementSlotId, { onDelete: "cascade" }).notNull(),
    promotionPackageTitle: varchar("promotion_package_title", { length: 150 }),
    promotionPackageDurationDays: integer("promotion_package_duration_days"),
    promotionPackagePublished: boolean("promotion_package_published").default(false),
    // Soft delete: NULL = đang hoạt động; có giá trị = đã xóa
    promotionPackageDeletedAt: timestamp("promotion_package_deleted_at"),
    promotionPackageCreatedAt: timestamp("promotion_package_created_at").defaultNow(),
});

export type PromotionPackage = InferSelectModel<typeof promotionPackages>;
export type NewPromotionPackage = InferInsertModel<typeof promotionPackages>;
