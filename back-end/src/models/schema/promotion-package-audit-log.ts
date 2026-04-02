import { pgTable, serial, integer, varchar, jsonb, timestamp, text } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { promotionPackages } from "./promotion-packages";
import { promotionPackagePrices } from "./promotion-package-prices";
import { admins } from "./admins";

/**
 * Audit log toàn bộ hành động admin lên gói quảng cáo và bảng giá.
 * Tự động được ghi bởi PostgreSQL triggers (không cần app gọi trực tiếp).
 *
 * Action types:
 *   PACKAGE_CREATED          → Admin thêm gói mới
 *   PACKAGE_UPDATED          → Admin sửa tên / thời hạn / published
 *   PACKAGE_DELETED          → Soft delete (deleted_at được set)
 *   PACKAGE_RESTORED         → Admin khôi phục gói đã xóa
 *   PRICE_ADDED              → Thêm bảng giá có hiệu lực ngay
 *   PRICE_SCHEDULED          → Lên lịch giá tương lai (effective_from > now())
 *   PRICE_SUPERSEDED         → Giá cũ bị đóng lại khi giá mới thay thế
 *   PRICE_SCHEDULED_CANCELLED → Hủy lịch giá tương lai trước khi có hiệu lực
 */
export const promotionPackageAuditLog = pgTable("promotion_package_audit_log", {
    auditId: serial("audit_id").primaryKey(),
    actionType: varchar("action_type", { length: 50 }).notNull(),
    packageId: integer("package_id")
        .references(() => promotionPackages.promotionPackageId, { onDelete: "set null" }),
    priceId: integer("price_id")
        .references(() => promotionPackagePrices.priceId, { onDelete: "set null" }),
    beforeState: jsonb("before_state"),  // Snapshot trạng thái TRƯỚC khi thay đổi
    afterState: jsonb("after_state"),    // Snapshot trạng thái SAU khi thay đổi
    changedBy: integer("changed_by")
        .references(() => admins.adminId, { onDelete: "set null" }),
    changedAt: timestamp("changed_at").defaultNow(),
    note: text("note"),
});

export type PromotionPackageAuditLog = InferSelectModel<typeof promotionPackageAuditLog>;
export type NewPromotionPackageAuditLog = InferInsertModel<typeof promotionPackageAuditLog>;
