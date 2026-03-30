import crypto from "crypto";

export const vnpayConfig = {
    vnp_TmnCode: process.env.VNPAY_TMN_CODE || "TESTVNP1",
    vnp_HashSecret: process.env.VNPAY_HASH_SECRET || "DUMMY_SECRET_FOR_SANDBOX_1234",
    vnp_Url: process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    vnp_ReturnUrl: process.env.VNPAY_RETURN_URL || "http://localhost:5000/api/payment/vnpay-return",
};

export const createVNPayUrl = (
    ipAddr: string,
    amount: number,
    orderInfo: string,
    txnRef: string
): string => {
    const tmnCode = vnpayConfig.vnp_TmnCode;
    const secretKey = vnpayConfig.vnp_HashSecret;
    const vnpUrl = vnpayConfig.vnp_Url;
    const returnUrl = vnpayConfig.vnp_ReturnUrl;

    const date = new Date();
    // Use proper VNPay date format "yyyyMMddHHmmss"
    const createDate = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
        String(date.getHours()).padStart(2, '0'),
        String(date.getMinutes()).padStart(2, '0'),
        String(date.getSeconds()).padStart(2, '0')
    ].join('');

    const vnp_Params: Record<string, string | number> = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: tmnCode,
        vnp_Locale: "vn",
        vnp_CurrCode: "VND",
        vnp_TxnRef: txnRef,
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: "other",
        vnp_Amount: amount * 100, // VNPay expects amount * 100
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: createDate,
    };

    const searchParams = new URLSearchParams();
    
    // VNPay requires parameters to be sorted alphabetically by key
    const sortedKeys = Object.keys(vnp_Params).sort();
    for (const key of sortedKeys) {
        if (vnp_Params[key] !== undefined && vnp_Params[key] !== null && vnp_Params[key] !== "") {
            searchParams.append(key, String(vnp_Params[key]));
        }
    }

    const signData = searchParams.toString();
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
    
    searchParams.append("vnp_SecureHash", signed);

    return `${vnpUrl}?${searchParams.toString()}`;
};

export const verifyVNPayCallback = (query: any): boolean => {
    const vnp_Params = { ...query };
    const secureHash = vnp_Params["vnp_SecureHash"];
    
    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    const searchParams = new URLSearchParams();
    
    const sortedKeys = Object.keys(vnp_Params).sort();
    for (const key of sortedKeys) {
        if (vnp_Params[key] !== undefined && vnp_Params[key] !== null && vnp_Params[key] !== "") {
            searchParams.append(key, String(vnp_Params[key]));
        }
    }

    const secretKey = vnpayConfig.vnp_HashSecret;
    const signData = searchParams.toString();
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    return secureHash === signed;
};
