import { pgTable, serial, integer, varchar, timestamp } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { posts } from "./posts";
import { promotionPackages } from "./promotion-packages";
import { placementSlots } from "./placement-slots";

export const postPromotions = pgTable("post_promotions", {
    postPromotionId: serial("post_promotion_id").primaryKey(),
    postPromotionPostId: integer("post_promotion_post_id").references(() => posts.postId, { onDelete: "cascade" }).notNull(),
    postPromotionBuyerId: integer("post_promotion_buyer_id").notNull(),
    postPromotionPackageId: integer("post_promotion_package_id").references(() => promotionPackages.promotionPackageId, { onDelete: "cascade" }).notNull(),
    postPromotionSlotId: integer("post_promotion_slot_id").references(() => placementSlots.placementSlotId, { onDelete: "cascade" }).notNull(),
    postPromotionStartAt: timestamp("post_promotion_start_at"),
    postPromotionEndAt: timestamp("post_promotion_end_at"),
    postPromotionStatus: varchar("post_promotion_status", { length: 20 }),
    postPromotionCreatedAt: timestamp("post_promotion_created_at").defaultNow(),
});

export type PostPromotion = InferSelectModel<typeof postPromotions>;
export type NewPostPromotion = InferInsertModel<typeof postPromotions>;
