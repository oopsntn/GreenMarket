import { pgTable, serial, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";

export const verifications = pgTable("verifications", {
    verificationId: serial("verification_id").primaryKey(),
    target: varchar("target", { length: 255 }).notNull(), // email or phone number
    otpCode: varchar("otp_code", { length: 255 }).notNull(),
    verificationType: varchar("verification_type", { length: 20 }).notNull(), // 'email' or 'phone'
    expiresAt: timestamp("expires_at").notNull(),
    isUsed: boolean("is_used").default(false),
    createdAt: timestamp("created_at").defaultNow(),
});

export type Verification = InferSelectModel<typeof verifications>;
export type NewVerification = InferInsertModel<typeof verifications>;
