import crypto from "crypto";

export type VNPayConfig = {
    tmnCode: string;
    hashSecret: string;
    apiUrl: string;
    redirectUrl: string;
    ipnUrl: string;
    frontendUrl: string;
    frontendPaymentResultPath: string;
    mobileUrl: string;
    mobilePaymentResultPath: string;
};

const getEnv = (key: string, defaultValue = ""): string => {
    return (process.env[key] || defaultValue).trim();
};

export const getVNPayConfig = (): VNPayConfig => {
    return {
        tmnCode: getEnv("VNPAY_TMN_CODE").trim(),
        hashSecret: getEnv("VNPAY_HASH_SECRET").trim(),
        apiUrl: getEnv("VNPAY_URL", "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html").trim(),
        redirectUrl: getEnv("VNPAY_RETURN_URL").trim(),
        ipnUrl: getEnv("VNPAY_IPN_URL").trim(),
        frontendUrl: getEnv("FRONTEND_URL", "http://localhost:5173").trim(),
        frontendPaymentResultPath: getEnv("FRONTEND_PAYMENT_RESULT_PATH", "/payment-result").trim(),
        mobileUrl: getEnv("MOBILE_URL", "greenmarket://").trim(),
        mobilePaymentResultPath: getEnv("MOBILE_PAYMENT_RESULT_PATH", "/payment-result").trim(),
    };
};

export const validateVNPayConfig = (): { isValid: boolean; missingFields: string[] } => {
    const config = getVNPayConfig();
    const missingFields: string[] = [];

    if (!config.tmnCode) missingFields.push("VNPAY_TMN_CODE");
    if (!config.hashSecret) missingFields.push("VNPAY_HASH_SECRET");
    if (!config.redirectUrl) missingFields.push("VNPAY_RETURN_URL");

    return {
        isValid: missingFields.length === 0,
        missingFields,
    };
};

export const sortObject = (obj: any): any => {
    const sorted: any = {};
    const str = [];
    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
};

export const createVNPayPaymentRequest = async (
    amount: number,
    orderId: string,
    orderInfo: string,
    ipAddr: string,
    platform: "web" | "mobile" = "web",
    options?: {
        mobileRedirectUrl?: string;
    }
): Promise<{ payUrl: string }> => {
    const config = getVNPayConfig();

    if (!config.hashSecret) {
        throw new Error("VNPAY_HASH_SECRET is missing in environmental variables.");
    }


    const tmnCode = config.tmnCode;
    const secretKey = config.hashSecret;
    const vnpUrl = config.apiUrl;
    let returnUrl = config.redirectUrl;

    if (platform === "mobile") {
        const urlObj = new URL(returnUrl);
        urlObj.searchParams.set("platform", "mobile");
        if (options?.mobileRedirectUrl) {
            urlObj.searchParams.set("mobile_redirect_url", options.mobileRedirectUrl);
        }
        returnUrl = urlObj.toString();
    }

    const date = new Date();
    // format to yyyyMMddHHmmss
    const createDate = 
        date.getFullYear().toString() + 
        (date.getMonth() + 1).toString().padStart(2, '0') + 
        date.getDate().toString().padStart(2, '0') + 
        date.getHours().toString().padStart(2, '0') + 
        date.getMinutes().toString().padStart(2, '0') + 
        date.getSeconds().toString().padStart(2, '0');

    // Expected amount multiplied by 100 for VNPAY
    const vnpAmount = Math.round(amount) * 100;

    let vnp_Params: any = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = orderId;
    vnp_Params['vnp_OrderInfo'] = orderInfo;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = vnpAmount;
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr || '127.0.0.1';
    vnp_Params['vnp_CreateDate'] = createDate;

    vnp_Params = sortObject(vnp_Params);

    const signData = Object.entries(vnp_Params)
        .map(([key, value]) => `${key}=${value}`)
        .join("&");
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex"); 
    
    vnp_Params['vnp_SecureHash'] = signed;
    
    const queryString = Object.entries(vnp_Params)
        .map(([key, value]) => `${key}=${value}`)
        .join("&");
    
    const paymentUrl = vnpUrl + '?' + queryString;

    return { payUrl: paymentUrl };
};

export const verifyVNPaySignature = (query: Record<string, any>): boolean => {
    const config = getVNPayConfig();
    // VNPay only signs its own `vnp_` parameters.
    // Our return URL may include extra params (e.g. `platform=mobile`) which must be excluded,
    // otherwise signature verification will always fail.
    const secureHashRaw = query["vnp_SecureHash"];
    const secureHash = typeof secureHashRaw === "string" ? secureHashRaw : String(secureHashRaw ?? "");

    let vnp_Params: Record<string, any> = {};
    for (const [key, value] of Object.entries(query || {})) {
        if (!key.startsWith("vnp_")) continue;
        if (key === "vnp_SecureHash" || key === "vnp_SecureHashType") continue;
        vnp_Params[key] = value;
    }

    vnp_Params = sortObject(vnp_Params);

    const secretKey = config.hashSecret;
    const signData = Object.entries(vnp_Params)
        .map(([key, value]) => `${key}=${value}`)
        .join("&");
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");     

    return secureHash === signed;
};


export const buildPaymentResultRedirectUrl = (
    payload: {
        status: "success" | "failed";
        code?: string;
        txnRef?: string;
        message?: string;
    },
    platform: "web" | "mobile" = "web",
    mobileRedirectUrl?: string
): string => {
    const config = getVNPayConfig();
    const baseUrl =
        platform === "mobile" && mobileRedirectUrl
            ? new URL(mobileRedirectUrl)
            : new URL(
                  platform === "mobile" ? config.mobilePaymentResultPath : config.frontendPaymentResultPath,
                  platform === "mobile" ? config.mobileUrl : config.frontendUrl
              );
    baseUrl.searchParams.set("status", payload.status);

    if (payload.code) baseUrl.searchParams.set("code", payload.code);
    if (payload.txnRef) baseUrl.searchParams.set("txnRef", payload.txnRef);
    if (payload.message) baseUrl.searchParams.set("message", payload.message);

    return baseUrl.toString();
};
