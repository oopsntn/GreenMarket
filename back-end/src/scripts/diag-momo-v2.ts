import "dotenv/config";
import crypto from "crypto";

async function diag() {
    const config = {
        partnerCode: "MOMOIQA420180417",
        accessKey: "E9p3pZW6p9pP66c8",
        secretKey: "8ivS7Hx26R9S5su4f06s0696Ien23w1f",
        apiUrl: "https://test-payment.momo.vn/v2/gateway/api/create"
    };

    const amount = 50000;
    const orderId = "GM" + Date.now();
    const requestId = orderId;
    const orderInfo = "TestPay";
    const redirectUrl = "http://localhost:5000/api/payment/momo-return";
    const ipnUrl = "http://localhost:5000/api/payment/momo-ipn";
    const requestType = "captureWallet";
    const extraData = "";

    const rawSignature = `accessKey=${config.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${config.partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    
    const signature = crypto.createHmac("sha256", config.secretKey).update(rawSignature).digest("hex");

    const body = {
        partnerCode: config.partnerCode,
        requestId,
        amount,
        orderId,
        orderInfo,
        redirectUrl,
        ipnUrl,
        extraData,
        requestType,
        signature,
        lang: "vi"
    };

    console.log("Raw Signature:", rawSignature);

    try {
        const response = await fetch(config.apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const text = await response.text();
        console.log("Status:", response.status);
        console.log("Response:", text);
    } catch (err: any) {
        console.error("Error:", err.message);
    }
}

diag();
