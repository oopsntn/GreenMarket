import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { pgTable, serial, integer, varchar, decimal, timestamp, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users.ts";

export const transactions = pgTable("transactions", {
    transactionId: serial("transaction_id").primaryKey(),
    transactionUserId: integer("transaction_user_id").notNull().references(() => users.userId, { onDelete: "cascade" }),
    transactionAmount: decimal("transaction_amount", { precision: 15, scale: 2 }).notNull(),
    transactionCurrency: varchar("transaction_currency", { length: 10 }).default("VND"),
    transactionType: varchar("transaction_type", { length: 50 }).notNull(), // payment, payout
    transactionStatus: varchar("transaction_status", { length: 20 }).notNull().default("pending"),
    transactionProvider: varchar("transaction_provider", { length: 50 }),
    transactionProviderTxnId: varchar("transaction_provider_txn_id", { length: 100 }).unique(),
    transactionReferenceType: varchar("transaction_reference_type", { length: 50 }),
    transactionReferenceId: integer("transaction_reference_id"),
    transactionMeta: jsonb("transaction_meta").default({}),
    transactionCreatedAt: timestamp("transaction_created_at").defaultNow(),
    transactionUpdatedAt: timestamp("transaction_updated_at").defaultNow(),
    transactionProcessedAt: timestamp("transaction_processed_at"),
});

export type Transaction = InferSelectModel<typeof transactions>;
export type NewTransaction = InferInsertModel<typeof transactions>;
