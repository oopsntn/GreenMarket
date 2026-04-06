import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";

export const otpRequests = pgTable("otp_requests", {
  otpRequestId: serial("otp_request_id").primaryKey(),
  otpRequestMobile: varchar("otp_request_mobile", { length: 20 }),
  otpRequestOtpCode: varchar("otp_request_otp_code", { length: 20 }),
  otpRequestExpireAt: timestamp("otp_request_expire_at"),
  otpRequestStatus: varchar("otp_request_status", { length: 30 }),
  otpRequestCreatedAt: timestamp("otp_request_created_at").defaultNow(),
});

export type OtpRequest = InferSelectModel<typeof otpRequests>;
export type NewOtpRequest = InferInsertModel<typeof otpRequests>;
