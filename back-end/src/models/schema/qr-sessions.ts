import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { users } from "./users";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";

export const qrSessions = pgTable("qr_sessions", {
    id: uuid("id").primaryKey().defaultRandom(),
    status: text("status", { enum: ['pending', 'scanned', 'authorized', 'expired'] }).notNull().default("pending"),
    userId: integer("user_id").references(() => users.userId),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
});

export type QRSession = InferSelectModel<typeof qrSessions>;
export type NewQRSession = InferInsertModel<typeof qrSessions>;
