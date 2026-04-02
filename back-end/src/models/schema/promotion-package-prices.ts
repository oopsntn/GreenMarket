import { pgTable, serial, integer, decimal, timestamp, text } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { promotionPackages } from "./promotion-packages";
import { admins } from "./admins";

/**
 * Lịch sử & lên lịch giá cho từng gói quảng cáo.
 *
 * Mỗi dòng là 1 mức giá trong 1 khoảng thời gian:
 *   - effective_from ≤ now() AND (effective_to IS NULL OR effective_to > now())
 *     → giá đang áp dụng
 *   - effective_from > now()
 *     → giá được lên lịch sẵn cho tương lai
 *   - effective_to đã được set
 *     → giá đã hết hiệu lực (bị thay thế bởi dòng mới)
 *
 * Dùng để:
 *   - Đối chiếu hóa đơn: payment_txn.payment_txn_price_id → price_id
 *   - Admin tra cứu lịch sử điều chỉnh giá theo thời gian
 */
export const promotionPackagePrices = pgTable("promotion_package_prices", {
    priceId: serial("price_id").primaryKey(),
    packageId: integer("package_id")
        .references(() => promotionPackages.promotionPackageId, { onDelete: "cascade" })
        .notNull(),
    price: decimal("price", { precision: 15, scale: 2 }).notNull(),
    // Thời điểm giá bắt đầu có hiệu lực (có thể là tương lai → admin lên lịch trước)
    effectiveFrom: timestamp("effective_from").notNull().defaultNow(),
    // Thời điểm giá hết hiệu lực; NULL = chưa bị thay thế hoặc chưa tới
    effectiveTo: timestamp("effective_to"),
    note: text("note"),           // Lý do điều chỉnh giá
    createdBy: integer("created_by")
        .references(() => admins.adminId, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow(),
});

export type PromotionPackagePrice = InferSelectModel<typeof promotionPackagePrices>;
export type NewPromotionPackagePrice = InferInsertModel<typeof promotionPackagePrices>;
