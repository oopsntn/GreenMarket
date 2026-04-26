import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { pgTable, serial, integer, varchar, decimal, timestamp, jsonb, text } from "drizzle-orm/pg-core";
import { users } from "./users";

export const ledgers = pgTable("ledgers", {
    ledgerId: serial("ledger_id").primaryKey(),
    ledgerUserId: integer("ledger_user_id").notNull().references(() => users.userId, { onDelete: "cascade" }),
    ledgerAmount: decimal("ledger_amount", { precision: 15, scale: 2 }).notNull(),
    ledgerType: varchar("ledger_type", { length: 50 }).notNull(), // earning, fee_debit
    ledgerDirection: varchar("ledger_direction", { length: 10 }).notNull(), // CREDIT, DEBIT
    ledgerStatus: varchar("ledger_status", { length: 20 }).notNull().default("available"),
    ledgerReferenceType: varchar("ledger_reference_type", { length: 50 }),
    ledgerReferenceId: integer("ledger_reference_id"),
    ledgerNote: text("ledger_note"),
    ledgerMeta: jsonb("ledger_meta").default({}),
    ledgerCreatedAt: timestamp("ledger_created_at").defaultNow(),
});

export type Ledger = InferSelectModel<typeof ledgers>;
export type NewLedger = InferInsertModel<typeof ledgers>;
