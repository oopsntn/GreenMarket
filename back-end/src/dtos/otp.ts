
export interface RequestOTPBody {
    mobile: string;
}

export interface VerifyOTPBody {
    mobile: string;
    otp: string;
}
