import "dotenv/config";
import crypto from "crypto";

async function diag() {
    const config = {
        partnerCode: "MOMOBKUN20180529",
        accessKey: "klm056dS9pP66c8B",
        secretKey: "at67qH6vSR9S5su4f06s0696Ien237Y3",
        apiUrl: "https://test-payment.momo.vn/v2/gateway/api/create"
    };

    const amount = 50000;
    const orderId = "GM" + Date.now();
    const requestId = orderId;
    const orderInfo = "TestPay";
    const redirectUrl = "http://localhost:5000/api/payment/momo-return";
    const ipnUrl = "http://localhost:5000/api/payment/momo-ipn";
    const requestType = "captureWallet";

    const attempts = [
        { name: "Standard (extraData empty string)", extraData: "" },
        { name: "extraData omitted from JSON", extraData: "", omitFromJSON: true },
        { name: "extraData omitted from Signature", extraData: "", omitFromSig: true }
    ];

    for (const attempt of attempts) {
        console.log(`--- Attempting: ${attempt.name} ---`);
        
        let signatureFields: any = {
            accessKey: config.accessKey,
            amount: amount,
            extraData: attempt.extraData,
            ipnUrl: ipnUrl,
            orderId: orderId,
            orderInfo: orderInfo,
            partnerCode: config.partnerCode,
            redirectUrl: redirectUrl,
            requestId: requestId,
            requestType: requestType
        };

        if (attempt.omitFromSig) delete signatureFields.extraData;

        const rawSignature = Object.keys(signatureFields)
            .sort()
            .map(key => `${key}=${signatureFields[key]}`)
            .join("&");

        const signature = crypto.createHmac("sha256", config.secretKey).update(rawSignature).digest("hex");

        let body: any = {
            partnerCode: config.partnerCode,
            requestId,
            amount,
            orderId,
            orderInfo,
            redirectUrl,
            ipnUrl,
            extraData: attempt.extraData,
            requestType,
            signature,
            lang: "vi"
        };

        if (attempt.omitFromJSON) delete body.extraData;

        try {
            const response = await fetch(config.apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            const text = await response.text();
            console.log("Status:", response.status);
            console.log("Response:", text);
            if (response.status === 200) {
                console.log("✅ SUCCESS with attempt:", attempt.name);
                break;
            }
        } catch (err: any) {
            console.error("Error:", err.message);
        }
    }
}

diag();
