const fs = require('fs');

function updateService() {
  const file = 'src/services/payment.service.ts';
  let content = fs.readFileSync(file, 'utf8');

  // Replace imports
  content = content.replace(/import \{?\s*createMoMoPaymentRequest,\s*validateMoMoConfig,\s*verifyMoMoSignature,?\s*\} from "\.\.\/utils\/momo\.ts";/m, `import {
  createVNPayPaymentRequest,
  validateVNPayConfig,
  verifyVNPaySignature,
} from "../utils/vnpay.ts";`);

  // Replace types
  content = content.replace(/MoMoCallbackStatus/g, 'VNPayCallbackStatus');
  content = content.replace(/MoMoCallbackResult/g, 'VNPayCallbackResult');
  
  // Replace methods
  content = content.replace(/validateMoMoConfig/g, 'validateVNPayConfig');
  content = content.replace(/createMoMoPaymentRequest/g, 'createVNPayPaymentRequest');
  content = content.replace(/verifyMoMoSignature/g, 'verifyVNPaySignature');
  content = content.replace(/processMoMoCallback/g, 'processVNPayCallback');

  // Replace MOMO strings
  content = content.replace(/"MOMO_CONFIG_MISSING"/g, '"VNPAY_CONFIG_MISSING"');
  content = content.replace(/"MoMo configuration is missing\."/g, '"VNPay configuration is missing."');
  content = content.replace(/paymentTxnProvider: "MOMO"/g, 'paymentTxnProvider: "VNPAY"');
  content = content.replace(/provider: "MOMO"/g, 'provider: "VNPAY"');

  // Add ipAddr to method signatures
  content = content.replace(/createShopPaymentIntent\(userId: number\):/g, 'createShopPaymentIntent(userId: number, ipAddr: string):');
  content = content.replace(/createPersonalPackagePaymentIntent\(userId: number\):/g, 'createPersonalPackagePaymentIntent(userId: number, ipAddr: string):');
  content = content.replace(/createShopVipPaymentIntent\(userId: number\):/g, 'createShopVipPaymentIntent(userId: number, ipAddr: string):');
  
  content = content.replace(/async createPaymentIntent\(params: \{\s*userId: number;\s*postIdRaw: unknown;\s*packageIdRaw: unknown;\s*\}\):/m, `async createPaymentIntent(params: {\n    userId: number;\n    postIdRaw: unknown;\n    packageIdRaw: unknown;\n    ipAddr: string;\n  }):`);
  
  // Fix params usage in createPaymentIntent
  content = content.replace(/const \{ userId, postIdRaw, packageIdRaw \} = params;/g, 'const { userId, postIdRaw, packageIdRaw, ipAddr } = params;');

  // Now, pass ipAddr to createVNPayPaymentRequest
  content = content.replace(/createVNPayPaymentRequest\(\s*finalAmount,\s*orderId,\s*orderInfo,\s*orderId\s*\)/g, 'createVNPayPaymentRequest(finalAmount, orderId, orderInfo, ipAddr)');
  content = content.replace(/createVNPayPaymentRequest\(\s*finalAmount,\s*orderId,\s*orderInfo,\s*requestId,?\s*\)/g, 'createVNPayPaymentRequest(finalAmount, orderId, orderInfo, ipAddr)');

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated service');
}

function updateController() {
  const file = 'src/controllers/user/payment.controller.ts';
  let content = fs.readFileSync(file, 'utf8');

  // Imports
  content = content.replace(/import \{?\s*buildFrontendPaymentResultUrl,\s*createMoMoSignature,\s*getMoMoConfig,?\s*\} from "\.\.\/\.\.\/utils\/momo\.ts";/, `import {
  buildFrontendPaymentResultUrl,
  getVNPayConfig,
} from "../../utils/vnpay.ts";`);
  content = content.replace(/MoMoCallbackResult/g, 'VNPayCallbackResult');
  
  // Pass IP
  content = content.replace(/paymentService\.createPaymentIntent\(\{([\s\S]*?)packageIdRaw: req\.body\?\.packageId,?\s*\}\);/m, 'paymentService.createPaymentIntent({$1packageIdRaw: req.body?.packageId,\n      ipAddr: req.ip || "127.0.0.1",\n    });');

  content = content.replace(/createShopPaymentIntent\(userId\)/g, 'createShopPaymentIntent(userId, req.ip || "127.0.0.1")');
  content = content.replace(/createShopVipPaymentIntent\(userId\)/g, 'createShopVipPaymentIntent(userId, req.ip || "127.0.0.1")');
  content = content.replace(/createPersonalPackagePaymentIntent\(userId\)/g, 'createPersonalPackagePaymentIntent(userId, req.ip || "127.0.0.1")');

  // Error messages
  content = content.replace(/"MoMo payment initiation failed\."/g, '"VNPay payment initiation failed."');

  // Controller function names
  content = content.replace(/momoReturn/g, 'vnpayReturn');
  content = content.replace(/momoIpn/g, 'vnpayIpn');
  content = content.replace(/processMoMoCallback/g, 'processVNPayCallback');
  
  // VNPay mapping status
  content = content.replace(/const isSuccess = result\.status === "success" \|\| result\.status === "already_success";([\s\S]*?)const fallbackCode =([\s\S]*?)return \{/m, `const isSuccess = result.status === "success" || result.status === "already_success";
  const fallbackCode = result.status === "invalid_signature" ? "97" : result.status === "not_found" ? "11" : isSuccess ? "00" : "99";
  
  return {`);

  // Update VNPay IPN response
  // VNPay expects HTTP 200 with JSON like { "RspCode": "00", "Message": "Confirm Success" }
  content = content.replace(/if \(result\.status === "invalid_signature"\) \{([\s\S]*?)\n    res\.status\(204\)\.send\(\);/m, `if (result.status === "invalid_signature") {
      res.status(200).json({ RspCode: "97", Message: "Invalid signature" });
      return;
    }

    if (result.status === "not_found") {
      res.status(200).json({ RspCode: "01", Message: "Order not found" });
      return;
    }

    if (result.status === "invalid_amount") {
      res.status(200).json({ RspCode: "04", Message: "Invalid amount" });
      return;
    }

    res.status(200).json({ RspCode: "00", Message: "Confirm Success" });`);

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated controller');
}

function updateRoute() {
  const file = 'src/routes/user/payment.route.ts';
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(/momoReturn/g, 'vnpayReturn');
  content = content.replace(/momoIpn/g, 'vnpayIpn');
  content = content.replace(/\/momo-return/g, '/vnpay-return');
  content = content.replace(/\/momo-ipn/g, '/vnpay-ipn');

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated route');
}

try {
  updateService();
  updateController();
  updateRoute();
} catch (e) {
  console.error(e);
}
