import crypto from "crypto";

type MoMoConfig = {
    partnerCode: string;
    accessKey: string;
    secretKey: string;
    apiUrl: string;
    redirectUrl: string;
    ipnUrl: string;
    frontendUrl: string;
    frontendPaymentResultPath: string;
};

const getBackendOrigin = (redirectUrl: string): string => {
    try {
        return new URL(redirectUrl).origin;
    } catch {
        return "http://localhost:5000";
    }
};

const getEnv = (key: string, defaultValue = ""): string => {
    return (process.env[key] || defaultValue).trim();
};

export const getMoMoConfig = (): MoMoConfig => {
    return {
        partnerCode: getEnv("MOMO_PARTNER_CODE").trim(),
        accessKey: getEnv("MOMO_ACCESS_KEY").trim(),
        secretKey: getEnv("MOMO_SECRET_KEY").trim(),
        apiUrl: getEnv("MOMO_API_URL", "https://test-payment.momo.vn/v2/gateway/api/create").trim(),
        redirectUrl: getEnv("MOMO_REDIRECT_URL").trim(),
        ipnUrl: getEnv("MOMO_IPN_URL").trim(),
        frontendUrl: getEnv("FRONTEND_URL", "http://localhost:5173").trim(),
        frontendPaymentResultPath: getEnv("FRONTEND_PAYMENT_RESULT_PATH", "/payment-result").trim(),
    };
};

export const validateMoMoConfig = (): { isValid: boolean; missingFields: string[] } => {
    const config = getMoMoConfig();
    const missingFields: string[] = [];

    if (!config.partnerCode) missingFields.push("MOMO_PARTNER_CODE");
    if (!config.accessKey) missingFields.push("MOMO_ACCESS_KEY");
    if (!config.secretKey) missingFields.push("MOMO_SECRET_KEY");
    if (!config.redirectUrl) missingFields.push("MOMO_REDIRECT_URL");
    if (!config.ipnUrl) missingFields.push("MOMO_IPN_URL");

    return {
        isValid: missingFields.length === 0,
        missingFields,
    };
};

export const createMoMoSignature = (rawHash: string, secretKey: string): string => {
    return crypto.createHmac("sha256", secretKey).update(rawHash).digest("hex");
};

export const createMoMoPaymentRequest = async (
    amount: number,
    orderId: string,
    orderInfo: string,
    requestId: string,
    extraData = ""
): Promise<{ payUrl: string }> => {
    const config = getMoMoConfig();
    const requestType = "captureWallet"; 
    
    if (!config.secretKey) {
        throw new Error("MOMO_SECRET_KEY is missing in environmental variables.");
    }

    // MoMo expects amount to be an integer
    const finalAmount = Math.round(amount);

    // Ensure extraData is at least an empty string
    const normalizedExtraData = extraData || "";

    // Order of fields is CRITICAL for MoMo signature (Alphabetical)
    const rawSignature = 
        `accessKey=${config.accessKey}&` +
        `amount=${finalAmount}&` +
        `extraData=${normalizedExtraData}&` +
        `ipnUrl=${config.ipnUrl}&` +
        `orderId=${orderId}&` +
        `orderInfo=${orderInfo}&` +
        `partnerCode=${config.partnerCode}&` +
        `redirectUrl=${config.redirectUrl}&` +
        `requestId=${requestId}&` +
        `requestType=${requestType}`;

    console.log("--- Generating MoMo Signature ---");
    console.log("Raw String:", rawSignature);

    const signature = createMoMoSignature(rawSignature, config.secretKey);

    const requestBody = {
        partnerCode: config.partnerCode,
        requestId,
        amount: finalAmount,
        orderId,
        orderInfo,
        redirectUrl: config.redirectUrl,
        ipnUrl: config.ipnUrl,
        extraData: normalizedExtraData,
        requestType,
        signature,
        lang: "vi"
    };

    console.log("Resulting Signature:", signature);

    if (process.env.MOMO_MOCK === "true") {
        console.log("--- MOMO_MOCK is TRUE: Bypassing real MoMo API ---");
        const backendOrigin = getBackendOrigin(config.redirectUrl);
        const mockPayUrl = `${backendOrigin}/api/payment/mock-gate?orderId=${encodeURIComponent(orderId)}&amount=${finalAmount}&orderInfo=${encodeURIComponent(orderInfo)}&requestId=${encodeURIComponent(requestId)}&extraData=${encodeURIComponent(normalizedExtraData)}`;
        return { payUrl: mockPayUrl };
    }

    const response = await fetch(config.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    let result: any;
    try {
        result = JSON.parse(responseText);
    } catch (e) {
        throw new Error(`MoMo returned non-JSON response (Status ${response.status}): ${responseText.substring(0, 500)}`);
    }

    if (result.resultCode !== 0) {
        // Detailed error for debugging
        throw new Error(`MoMo Error (${result.resultCode}): ${result.message}`);
    }

    return { payUrl: result.payUrl };
};

export const verifyMoMoSignature = (body: Record<string, any>): boolean => {
    const config = getMoMoConfig();
    const { signature, ...rest } = body;
    
    // MoMo callback signature fields
    const rawSignature = 
        `accessKey=${config.accessKey}&` +
        `amount=${rest.amount}&` +
        `extraData=${rest.extraData || ""}&` +
        `message=${rest.message}&` +
        `orderId=${rest.orderId}&` +
        `orderInfo=${rest.orderInfo}&` +
        `partnerCode=${rest.partnerCode}&` +
        `requestId=${rest.requestId}&` +
        `responseTime=${rest.responseTime}&` +
        `resultCode=${rest.resultCode}&` +
        `transId=${rest.transId}`;

    const computedSignature = createMoMoSignature(rawSignature, config.secretKey);
    return computedSignature === signature;
};

export const buildFrontendPaymentResultUrl = (payload: {
    status: "success" | "failed";
    code?: string;
    txnRef?: string;
    message?: string;
}): string => {
    const config = getMoMoConfig();
    const baseUrl = new URL(config.frontendPaymentResultPath, config.frontendUrl);
    baseUrl.searchParams.set("status", payload.status);

    if (payload.code) baseUrl.searchParams.set("code", payload.code);
    if (payload.txnRef) baseUrl.searchParams.set("txnRef", payload.txnRef);
    if (payload.message) baseUrl.searchParams.set("message", payload.message);

    return baseUrl.toString();
};
