/**
 * Service for handling OTP (One-Time Password) operations.
 * This pattern allows switching between different providers (SMS, Email, Telegram)
 * without changing the business logic in controllers.
 */
export class OTPService {
    /**
     * Generates a random 6-digit OTP code.
     */
    generateOTP(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * Sends the OTP code to the specified mobile number.
     * Currently implemented as a "mock" for development (free).
     */
    async sendOTP(mobile: string, code: string): Promise<{ success: boolean; message: string }> {
        // --- REAL-WORLD IMPLEMENTATION POINTS ---
        // 1. Telegram Bot API
        // 2. SMS Gateway (eSMS, SpeedSMS, Twilio)
        // 3. Firebase Auth Admin SDK
        
        console.log(`[OTP SERVICE] Sending code ${code} to mobile ${mobile}`);
        
        // Mocking a successful send
        return {
            success: true,
            message: "OTP sent successfully (mocked)",
        };
    }
}

export const otpService = new OTPService();
