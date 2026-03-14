import twilio from "twilio";

/**
 * Service for handling OTP (One-Time Password) operations.
 * Switched to Twilio Verify API for better deliverability in Vietnam.
 */
export class OTPService {
    private client: any;
    private verifyServiceSid: string | undefined;

    constructor() {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        this.verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

        if (accountSid && authToken && this.verifyServiceSid) {
            try {
                this.client = twilio(accountSid, authToken);
                console.log("[OTP SERVICE] Twilio Verify initialized with Service SID:", this.verifyServiceSid);
            } catch (err: any) {
                console.error("[OTP SERVICE] Initialization error:", err.message);
            }
        } else {
            console.log("[OTP SERVICE] Twilio Verify credentials missing, using MOCK mode");
        }
    }

    /**
     * Sends the OTP code using Twilio Verify.
     * Twilio handles code generation automatically.
     */
    async sendOTP(mobile: string): Promise<{ success: boolean; message: string }> {
        let destNumber = mobile.trim();
        
        // Ensure E.164 format for Vietnam (+84)
        if (destNumber.startsWith("0")) {
            destNumber = "+84" + destNumber.substring(1);
        } else if (!destNumber.startsWith("+")) {
            destNumber = "+84" + destNumber;
        }

        if (this.client && this.verifyServiceSid) {
            try {
                const verification = await this.client.verify.v2
                    .services(this.verifyServiceSid)
                    .verifications.create({ to: destNumber, channel: "sms" });

                console.log(`[OTP SERVICE] Verify sent to ${destNumber}. Status: ${verification.status}`);
                return {
                    success: true,
                    message: "OTP sent via SMS (Verify)",
                };
            } catch (error: any) {
                console.error("[OTP SERVICE] Twilio Verify Send Error:", error.message);
                return {
                    success: false,
                    message: `Verify Error ${error.code}: ${error.message}`,
                };
            }
        }

        // Fallback for development (Mock)
        console.log(`[OTP SERVICE] (MOCK) Requested OTP for ${destNumber}`);
        return {
            success: true,
            message: "OTP requested successfully (mocked)",
        };
    }

    /**
     * Verifies the OTP code using Twilio Verify.
     */
    async verifyOTP(mobile: string, code: string): Promise<{ success: boolean; message: string }> {
        let destNumber = mobile.trim();
        const otpCode = code.trim();

        // Ensure E.164 format for Vietnam (+84)
        if (destNumber.startsWith("0")) {
            destNumber = "+84" + destNumber.substring(1);
        } else if (!destNumber.startsWith("+")) {
            destNumber = "+84" + destNumber;
        }

        if (this.client && this.verifyServiceSid) {
            try {
                const check = await this.client.verify.v2
                    .services(this.verifyServiceSid)
                    .verificationChecks.create({ to: destNumber, code: otpCode });

                if (check.status === "approved") {
                    console.log(`[OTP SERVICE] Verify success for ${destNumber}`);
                    return { success: true, message: "OTP verified" };
                } else {
                    console.log(`[OTP SERVICE] Verify failed for ${destNumber}: ${check.status}`);
                    return { success: false, message: "Invalid or expired OTP" };
                }
            } catch (error: any) {
                console.error("[OTP SERVICE] Twilio Verify Check Error:", error.message);
                return {
                    success: false,
                    message: `Verify Check Error ${error.code}: ${error.message}`,
                };
            }
        }

        // Fallback for development (Mock - accept any 6 digit code for 0987654321)
        if (otpCode === "123456" || destNumber === "0987654321" || destNumber === "+84978195419") {
            console.log(`[OTP SERVICE] (MOCK) Verify success for ${destNumber}`);
            return { success: true, message: "OTP verified (mocked)" };
        }

        return { success: false, message: "Invalid OTP (mocked)" };
    }

    /**
     * @deprecated Twilio Verify handles code generation internally.
     */
    generateOTP(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
}

export const otpService = new OTPService();
