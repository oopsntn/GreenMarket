import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core";

export const otpRequests = pgTable("otp_requests", {
    otpRequestId: serial("otpRequestId").primaryKey(),
    otpRequestMobile: varchar("otpRequestMobile", { length: 15 }),
    otpRequestOtpCode: varchar("otpRequestOtpCode", { length: 10 }),
    otpRequestExpireAt: timestamp("otpRequestExpireAt"),
    otpRequestStatus: varchar("otpRequestStatus", { length: 20 }),
    otpRequestCreatedAt: timestamp("otpRequestCreatedAt").defaultNow(),
});
