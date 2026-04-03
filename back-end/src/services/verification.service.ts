import { db } from "../config/db.ts";
import { verifications } from "../models/schema/verifications.ts";
import { eq, and, gt, desc } from "drizzle-orm";
import { emailService } from "./email.service.ts";
import twilio from "twilio";
import bcrypt from "bcrypt";

export class VerificationService {
    private client: any;
    private verifyServiceSid: string | undefined;

    constructor() {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        this.verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

        if (accountSid && authToken && this.verifyServiceSid) {
            try {
                this.client = twilio(accountSid, authToken);
                console.log("[VERIFICATION SERVICE] Twilio Verify initialized");
            } catch (err: any) {
                console.error("[VERIFICATION SERVICE] Twilio Init Error:", err.message);
            }
        }
    }

    private generateOTPCode(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    private normalizePhone(phone: string): string {
        let dest = phone.trim();
        if (dest.startsWith("0")) {
            return "+84" + dest.substring(1);
        } else if (!dest.startsWith("+")) {
            return "+84" + dest;
        }
        return dest;
    }

    /**
     * Creates a new OTP for the given target and type.
     * @param target Email or phone number
     * @param type 'email' or 'phone'
     * @param expiresInMinutes How long until OTP expires
     */
    async requestOTP(target: string, type: "email" | "phone", expiresInMinutes: number = 5): Promise<{ success: boolean; message: string }> {
        const normalizedTarget = type === "phone" ? this.normalizePhone(target) : target.trim().toLowerCase();
        
        // --- 1. Phone + Twilio logic ---
        if (type === "phone" && this.client && this.verifyServiceSid) {
            // Check if it's the specific test number that should use Twilio
            // In a real app, you'd probably use Twilio for ALL real numbers.
            const isTestNumber = normalizedTarget === "+84978195419"; 
            if (isTestNumber) {
                try {
                    await this.client.verify.v2
                        .services(this.verifyServiceSid)
                        .verifications.create({ to: normalizedTarget, channel: "sms" });
                    
                    return { success: true, message: "OTP sent via SMS (Twilio)" };
                } catch (error: any) {
                    console.error("[VERIFICATION SERVICE] Twilio Send Error:", error.message);
                    // Fallback to mock if Twilio fails? No, let's return error if it's supposed to be real.
                    return { success: false, message: `SMS Error: ${error.message}` };
                }
            }
        }

        // --- 2. Email or Mock Phone logic (Database based) ---
        const otpCode = this.generateOTPCode();
        const expiresAt = new Date(Date.now() + expiresInMinutes * 60000);

        // Hash the OTP before saving to DB
        const hashedCode = await bcrypt.hash(otpCode, 10);

        await db.insert(verifications).values({
            target: normalizedTarget,
            otpCode: hashedCode,
            verificationType: type,
            expiresAt,
            isUsed: false
        });

        if (type === "email") {
            const emailResult = await emailService.sendOTPEmail(normalizedTarget, otpCode);
            if (!emailResult.success) return emailResult;
        } else {
            // Mock Phone
            console.log(`[VERIFICATION SERVICE] (MOCK) OTP for ${normalizedTarget}: ${otpCode}`);
        }

        return { success: true, message: `OTP sent to ${normalizedTarget}` };
    }

    async sendSecurityWarningEmail(to: string, phone: string): Promise<{ success: boolean; message: string }> {
        return emailService.sendSecurityWarningEmail(to, phone);
    }

    /**
     * Checks if the OTP provided by the user is valid.
     */
    async verifyOTP(target: string, otpCode: string, type: "email" | "phone"): Promise<{ success: boolean; message: string }> {
        const normalizedTarget = type === "phone" ? this.normalizePhone(target) : target.trim().toLowerCase();
        const code = otpCode.trim();

        // 1. Universal Mock Code (123456)
        if (code === "123456") {
            console.log(`[VERIFICATION SERVICE] (MOCK) Accepted 123456 for ${normalizedTarget}`);
            return { success: true, message: "OTP verified (Mock)" };
        }

        // 2. Phone + Twilio logic
        if (type === "phone" && this.client && this.verifyServiceSid) {
            const isTestNumber = normalizedTarget === "+84978195419";
            if (isTestNumber) {
                try {
                    const check = await this.client.verify.v2
                        .services(this.verifyServiceSid)
                        .verificationChecks.create({ to: normalizedTarget, code });
                    
                    if (check.status === "approved") {
                        return { success: true, message: "OTP verified (Twilio)" };
                    }
                    return { success: false, message: "Invalid or expired OTP" };
                } catch (error: any) {
                    console.error("[VERIFICATION SERVICE] Twilio Check Error:", error.message);
                }
            }
        }

        // 3. Database check (Email or Mock Phone)
        const now = new Date();
        const [record] = await db.select()
            .from(verifications)
            .where(and(
                eq(verifications.target, normalizedTarget),
                eq(verifications.verificationType, type),
                eq(verifications.isUsed, false),
                gt(verifications.expiresAt, now)
            ))
            .orderBy(desc(verifications.createdAt))
            .limit(1);

        if (!record) {
            return { success: false, message: "Invalid or expired OTP" };
        }

        // Compare using bcrypt
        const isValid = await bcrypt.compare(code, record.otpCode);
        if (!isValid) {
            return { success: false, message: "Invalid or expired OTP" };
        }

        await db.update(verifications)
            .set({ isUsed: true })
            .where(eq(verifications.verificationId, record.verificationId));

        return { success: true, message: "OTP verified successfully" };
    }
}

export const verificationService = new VerificationService();
