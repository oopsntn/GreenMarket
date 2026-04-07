import crypto from "crypto";

// Sample from MoMo official docs
const sample = {
    partnerCode: "MOMOBKUN20180529",
    accessKey: "klm056dS9pP66c8B",
    secretKey: "at67qH6vSR9S5su4f06s0696Ien237Y3",
    requestId: "MM1540456472575",
    amount: "50000",
    orderId: "MM1540456472575",
    orderInfo: "SDK team",
    redirectUrl: "https://momo.vn",
    ipnUrl: "https://momo.vn",
    extraData: "",
    requestType: "captureWallet",
    expectedSignature: "4849137dca975f850d53c5cd621376839352e00f9f38166d3a958d55ff352a12"
};

const rawSignature = `accessKey=${sample.accessKey}&amount=${sample.amount}&extraData=${sample.extraData}&ipnUrl=${sample.ipnUrl}&orderId=${sample.orderId}&orderInfo=${sample.orderInfo}&partnerCode=${sample.partnerCode}&redirectUrl=${sample.redirectUrl}&requestId=${sample.requestId}&requestType=${sample.requestType}`;

const signature = crypto.createHmac("sha256", sample.secretKey).update(rawSignature).digest("hex");

console.log("Raw String:", rawSignature);
console.log("Computed Signature:", signature);
console.log("Expected Signature:", sample.expectedSignature);
console.log("Match:", signature === sample.expectedSignature);
