import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";

export const otpRequests = pgTable("otp_requests", {
    otpRequestId: serial("otp_request_id").primaryKey(),
    otpRequestMobile: varchar("otp_request_mobile", { length: 15 }),
    otpRequestOtpCode: varchar("otp_request_otp_code", { length: 10 }),
    otpRequestExpireAt: timestamp("otp_request_expire_at"),
    otpRequestStatus: varchar("otp_request_status", { length: 20 }),
    otpRequestCreatedAt: timestamp("otp_request_created_at").defaultNow(),
});

export type OTPRequest = InferSelectModel<typeof otpRequests>;
export type NewOTPRequest = InferInsertModel<typeof otpRequests>;
