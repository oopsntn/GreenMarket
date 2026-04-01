import crypto from "crypto";

type VNPayConfig = {
    vnp_TmnCode: string;
    vnp_HashSecret: string;
    vnp_Url: string;
    vnp_ReturnUrl: string;
    frontendUrl: string;
    frontendPaymentResultPath: string;
};

const getEnv = (...keys: string[]): string | undefined => {
    for (const key of keys) {
        const value = process.env[key];
        if (value && value.trim().length > 0) return value.trim();
    }
    return undefined;
};

const getVNPayConfig = (): VNPayConfig => {
    return {
        vnp_TmnCode: getEnv("VNPAY_TMN_CODE", "vnp_TmnCode") || "",
        vnp_HashSecret: getEnv("VNPAY_HASH_SECRET", "vnp_HashSecret") || "",
        vnp_Url: getEnv("VNPAY_URL", "vnp_Url") || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
        vnp_ReturnUrl: getEnv("VNPAY_RETURN_URL", "vnp_ReturnUrl") || "http://localhost:5000/api/payment/vnpay-return",
        frontendUrl: getEnv("FRONTEND_URL") || "http://localhost:5173",
        frontendPaymentResultPath: getEnv("FRONTEND_PAYMENT_RESULT_PATH") || "/payment-result",
    };
};

const normalizeQueryValue = (value: unknown): string => {
    if (Array.isArray(value)) return value.length > 0 ? String(value[0]) : "";
    if (value === null || value === undefined) return "";
    return String(value);
};

const buildSortedQuery = (params: Record<string, unknown>): URLSearchParams => {
    const searchParams = new URLSearchParams();
    const sortedKeys = Object.keys(params).sort();

    for (const key of sortedKeys) {
        const value = normalizeQueryValue(params[key]);
        if (value !== "") {
            searchParams.append(key, value);
        }
    }

    return searchParams;
};

const createDateInVNTimezone = (): string => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));

    return `${map.year}${map.month}${map.day}${map.hour}${map.minute}${map.second}`;
};

export const validateVNPayConfig = (): { isValid: boolean; missingFields: string[] } => {
    const config = getVNPayConfig();
    const missingFields: string[] = [];

    if (!config.vnp_TmnCode) missingFields.push("VNPAY_TMN_CODE (or vnp_TmnCode)");
    if (!config.vnp_HashSecret) missingFields.push("VNPAY_HASH_SECRET (or vnp_HashSecret)");
    if (!config.vnp_Url) missingFields.push("VNPAY_URL (or vnp_Url)");
    if (!config.vnp_ReturnUrl) missingFields.push("VNPAY_RETURN_URL (or vnp_ReturnUrl)");

    return {
        isValid: missingFields.length === 0,
        missingFields,
    };
};

export const createVNPayUrl = (
    ipAddr: string,
    amount: number,
    orderInfo: string,
    txnRef: string
): string => {
    const config = getVNPayConfig();
    const amountInVnp = Math.round(Number(amount) * 100);

    const vnpParams: Record<string, unknown> = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: config.vnp_TmnCode,
        vnp_Locale: "vn",
        vnp_CurrCode: "VND",
        vnp_TxnRef: txnRef,
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: "other",
        vnp_Amount: amountInVnp,
        vnp_ReturnUrl: config.vnp_ReturnUrl,
        vnp_IpAddr: ipAddr || "127.0.0.1",
        vnp_CreateDate: createDateInVNTimezone(),
    };

    const unsignedQuery = buildSortedQuery(vnpParams);
    const signData = unsignedQuery.toString();
    const hmac = crypto.createHmac("sha512", config.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
    unsignedQuery.append("vnp_SecureHash", signed);

    return `${config.vnp_Url}?${unsignedQuery.toString()}`;
};

export const verifyVNPayCallback = (query: Record<string, unknown>): boolean => {
    const config = getVNPayConfig();
    const secureHash = normalizeQueryValue(query["vnp_SecureHash"]);

    if (!secureHash) return false;

    const cloned: Record<string, unknown> = { ...query };
    delete cloned["vnp_SecureHash"];
    delete cloned["vnp_SecureHashType"];

    const unsignedQuery = buildSortedQuery(cloned);
    const signData = unsignedQuery.toString();
    const hmac = crypto.createHmac("sha512", config.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    return secureHash === signed;
};

export const buildFrontendPaymentResultUrl = (payload: {
    status: "success" | "failed";
    code?: string;
    txnRef?: string;
    message?: string;
}): string => {
    const config = getVNPayConfig();
    const baseUrl = new URL(config.frontendPaymentResultPath, config.frontendUrl);
    baseUrl.searchParams.set("status", payload.status);

    if (payload.code) baseUrl.searchParams.set("code", payload.code);
    if (payload.txnRef) baseUrl.searchParams.set("txnRef", payload.txnRef);
    if (payload.message) baseUrl.searchParams.set("message", payload.message);

    return baseUrl.toString();
};
