export interface OTPRequestDTO {
    otpRequestId: number;
    otpRequestMobile?: string | null;
    otpRequestOtpCode?: string | null;
    otpRequestExpireAt?: Date | null;
    otpRequestStatus?: string | null;
    otpRequestCreatedAt: Date;
}

export interface RequestOTPBody {
    mobile: string;
}

export interface VerifyOTPBody {
    mobile: string;
    otp: string;
}
