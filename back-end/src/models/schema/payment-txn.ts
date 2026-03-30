import { pgTable, serial, integer, varchar, numeric, timestamp } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { users } from "./users";
import { promotionPackages } from "./promotion-packages";
import { posts } from "./posts";

export const paymentTxn = pgTable("payment_txn", {
    paymentTxnId: serial("payment_txn_id").primaryKey(),
    paymentTxnUserId: integer("payment_txn_user_id").references(() => users.userId, { onDelete: "cascade" }).notNull(),
    paymentTxnPackageId: integer("payment_txn_package_id").references(() => promotionPackages.promotionPackageId, { onDelete: "cascade" }).notNull(),
    paymentTxnPostId: integer("payment_txn_post_id").references(() => posts.postId, { onDelete: "cascade" }),
    paymentTxnAmount: numeric("payment_txn_amount", { precision: 15, scale: 2 }),
    paymentTxnProvider: varchar("payment_txn_provider", { length: 50 }),
    paymentTxnProviderTxnId: varchar("payment_txn_provider_txn_id", { length: 100 }).unique(),
    paymentTxnStatus: varchar("payment_txn_status", { length: 20 }),
    paymentTxnCreatedAt: timestamp("payment_txn_created_at").defaultNow(),
});

export type PaymentTxn = InferSelectModel<typeof paymentTxn>;
export type NewPaymentTxn = InferInsertModel<typeof paymentTxn>;
