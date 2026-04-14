import { Request, Response } from "express";
import { AuthRequest } from "../../dtos/auth.ts";
import {
  buildFrontendPaymentResultUrl,
  getVNPayConfig,
  signVNPayResponse,
} from "../../utils/vnpay.ts";
import {
  VNPayCallbackResult,
  PaymentServiceError,
  paymentService,
} from "../../services/payment.service.ts";

const sendPaymentError = (
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, unknown>,
) => {
  res.status(statusCode).json({
    error: message,
    code,
    ...(details || {}),
  });
};

const mapCallbackToFrontend = (result: VNPayCallbackResult) => {
  const isSuccess = result.status === "success" || result.status === "already_success";
  const fallbackCode = result.status === "invalid_signature" ? "97" : result.status === "not_found" ? "11" : isSuccess ? "00" : "99";
  
  return {
    status: isSuccess ? "success" : "failed",
    code: result.responseCode || fallbackCode,
    txnRef: result.txnRef,
    message: result.status,
  } as const;
};

const asRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }
  return {};
};

const asString = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return String(value);
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const createPayment = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendPaymentError(res, 401, "UNAUTHORIZED", "Unauthorized");
      return;
    }

    const { paymentUrl } = await paymentService.createPaymentIntent({
      userId,
      postIdRaw: req.body?.postId,
      packageIdRaw: req.body?.packageId,
      ipAddr: req.ip || "127.0.0.1",
    });

    res.json({ paymentUrl });
  } catch (error) {
    if (error instanceof PaymentServiceError) {
      sendPaymentError(
        res,
        error.statusCode,
        error.code,
        error.message,
        error.details,
      );
      return;
    }

    console.error("Create Payment Error:", error);
    sendPaymentError(
      res,
      500,
      "PAYMENT_INTENT_FAILED",
      "VNPay payment initiation failed.",
    );
  }
};

export const createShopRegistrationPayment = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendPaymentError(res, 401, "UNAUTHORIZED", "Unauthorized");
      return;
    }

    const { paymentUrl } = await paymentService.createShopPaymentIntent(userId, req.ip || "127.0.0.1");
    res.json({ paymentUrl });
  } catch (error) {
    if (error instanceof PaymentServiceError) {
      sendPaymentError(res, error.statusCode, error.code, error.message, error.details);
      return;
    }
    console.error("Create Shop Payment Error:", error);
    sendPaymentError(res, 500, "PAYMENT_INTENT_FAILED", "VNPay payment initiation failed.");
  }
};

export const createShopVipPayment = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendPaymentError(res, 401, "UNAUTHORIZED", "Unauthorized");
      return;
    }

    const { paymentUrl } = await paymentService.createShopVipPaymentIntent(userId, req.ip || "127.0.0.1");
    res.json({ paymentUrl });
  } catch (error) {
    if (error instanceof PaymentServiceError) {
      sendPaymentError(res, error.statusCode, error.code, error.message, error.details);
      return;
    }
    console.error("Create Shop VIP Payment Error:", error);
    sendPaymentError(res, 500, "PAYMENT_INTENT_FAILED", "VNPay payment initiation failed.");
  }
};

export const createPersonalPackagePayment = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendPaymentError(res, 401, "UNAUTHORIZED", "Unauthorized");
      return;
    }

    const { paymentUrl } = await paymentService.createPersonalPackagePaymentIntent(userId, req.ip || "127.0.0.1");
    res.json({ paymentUrl });
  } catch (error) {
    if (error instanceof PaymentServiceError) {
      sendPaymentError(res, error.statusCode, error.code, error.message, error.details);
      return;
    }
    console.error("Create Personal Package Payment Error:", error);
    sendPaymentError(res, 500, "PAYMENT_INTENT_FAILED", "VNPay payment initiation failed.");
  }
};

export const vnpayReturn = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("vnpayReturn QUERY:", req.query);
    const result = await paymentService.processVNPayCallback(
      asRecord(req.query),
    );
    console.log("vnpayReturn RESULT:", result);
    
    const mapped = mapCallbackToFrontend(result);

    const redirectUrl = buildFrontendPaymentResultUrl({
      status: mapped.status,
      code: mapped.code,
      txnRef: mapped.txnRef,
      message: mapped.message,
    });

    res.redirect(302, redirectUrl);
  } catch (error) {
    console.error("MoMo Return Error:", error);

    const redirectUrl = buildFrontendPaymentResultUrl({
      status: "failed",
      code: "99",
      message: "system_error",
    });
    res.redirect(302, redirectUrl);
  }
};

export const vnpayIpn = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await paymentService.processVNPayCallback(asRecord(req.body));

    if (result.status === "invalid_signature") {
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

    res.status(200).json({ RspCode: "00", Message: "Confirm Success" });
  } catch (error) {
    console.error("MoMo IPN Error:", error);
    res.status(500).send();
  }
};

export const vnpayMockExec = async (req: Request, res: Response): Promise<void> => {
  try {
    const txnRef = asString(req.query.vnp_TxnRef);
    const amount = asString(req.query.vnp_Amount);
    const orderInfo = asString(req.query.vnp_OrderInfo);

    if (!txnRef) {
      res.status(400).send("Missing vnp_TxnRef");
      return;
    }

    // 1. Prepare Success Payload
    const mockParams: Record<string, string> = {
      vnp_Amount: String(Number(amount) * 100), // VNPAY amount is x100
      vnp_BankCode: "NCB",
      vnp_BankTranNo: "VNP12345678",
      vnp_CardType: "ATM",
      vnp_OrderInfo: orderInfo,
      vnp_PayDate: new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14),
      vnp_ResponseCode: "00",
      vnp_TmnCode: getVNPayConfig().tmnCode,
      vnp_TransactionNo: "12345678",
      vnp_TransactionStatus: "00",
      vnp_TxnRef: txnRef,
    };

    const secureHash = signVNPayResponse(mockParams);
    const fullPayload = { ...mockParams, vnp_SecureHash: secureHash };

    // 2. Internally trigger IPN logic
    console.log("vnpayMockExec MOCK PARAMS:", mockParams);
    const mockResult = await paymentService.processVNPayCallback(fullPayload);
    console.log("vnpayMockExec IPN RESULT:", mockResult);

    // 3. Redirect user to Return URL logic
    const returnUrl = `/api/payment/vnpay-return?${new URLSearchParams(fullPayload).toString()}`;
    res.redirect(302, returnUrl);
  } catch (error) {
    console.error("VNPay Mock Exec Error:", error);
    res.status(500).send("VNPay Mock Exec failed");
  }
};

