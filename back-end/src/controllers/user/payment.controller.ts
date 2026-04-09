import { Request, Response } from "express";
import { AuthRequest } from "../../dtos/auth.ts";
import {
  buildFrontendPaymentResultUrl,
  createMoMoSignature,
  getMoMoConfig,
} from "../../utils/momo.ts";
import {
  MoMoCallbackResult,
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

const mapCallbackToFrontend = (result: MoMoCallbackResult) => {
  const isSuccess = result.status === "success" || result.status === "already_success";

  const fallbackCode =
    result.status === "invalid_signature"
      ? "97"
      : result.status === "not_found"
        ? "11"
        : isSuccess
          ? "0"
          : "99";

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
      "MoMo payment initiation failed.",
    );
  }
};

export const momoReturn = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await paymentService.processMoMoCallback(
      asRecord(req.query),
    );
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

export const momoIpn = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await paymentService.processMoMoCallback(asRecord(req.body));

    if (result.status === "invalid_signature") {
      res.status(200).json({ resultCode: 97, message: "Invalid signature" });
      return;
    }

    if (result.status === "not_found") {
      res.status(200).json({ resultCode: 11, message: "Order not found" });
      return;
    }

    if (result.status === "invalid_amount") {
      res.status(200).json({ resultCode: 12, message: "Invalid amount" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error("MoMo IPN Error:", error);
    res.status(500).send();
  }
};

export const mockGate = async (req: Request, res: Response): Promise<void> => {
  const orderId = asString(req.query.orderId);
  const amount = Number(req.query.amount || 0);
  const orderInfo = asString(req.query.orderInfo);
  const requestId = asString(req.query.requestId);
  const extraData = asString(req.query.extraData);

  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>MoMo Mock Gateway</title>
      <style>
          body { font-family: Arial, sans-serif; background: #f4f4f5; margin: 0; }
          .wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
          .card { width: 100%; max-width: 420px; background: #fff; border: 1px solid #e4e4e7; border-radius: 16px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
          .logo { width: 72px; height: 72px; border-radius: 16px; background: #a50064; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: bold; margin: 0 auto 16px; }
          h1 { font-size: 20px; margin: 0 0 8px; text-align: center; }
          p { margin: 0 0 8px; color: #52525b; text-align: center; }
          .amount { color: #a50064; font-size: 28px; font-weight: bold; text-align: center; margin: 12px 0 20px; }
          .meta { font-size: 12px; color: #71717a; margin-bottom: 16px; text-align: center; }
          .btn { display: block; width: 100%; border: 0; border-radius: 10px; font-weight: bold; padding: 12px; cursor: pointer; margin-top: 10px; }
          .btn-success { background: #a50064; color: #fff; }
          .btn-cancel { background: #f4f4f5; color: #18181b; }
      </style>
  </head>
  <body>
      <div class="wrap">
          <div class="card">
              <div class="logo">MoMo</div>
              <h1>Sandbox Payment</h1>
              <p>Mock gateway for local testing.</p>
              <div class="amount">${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount)}</div>
              <div class="meta">Order: <strong>${escapeHtml(orderId)}</strong></div>
              <div class="meta">${escapeHtml(orderInfo)}</div>

              <form action="/api/payment/mock-gate-process" method="POST">
                  <input type="hidden" name="orderId" value="${escapeHtml(orderId)}">
                  <input type="hidden" name="amount" value="${escapeHtml(String(amount))}">
                  <input type="hidden" name="extraData" value="${escapeHtml(extraData)}">
                  <input type="hidden" name="orderInfo" value="${escapeHtml(orderInfo)}">
                  <input type="hidden" name="requestId" value="${escapeHtml(requestId)}">
                  <input type="hidden" name="action" value="success">
                  <button type="submit" class="btn btn-success">Approve Payment</button>
              </form>

              <form action="/api/payment/mock-gate-process" method="POST">
                  <input type="hidden" name="orderId" value="${escapeHtml(orderId)}">
                  <input type="hidden" name="amount" value="${escapeHtml(String(amount))}">
                  <input type="hidden" name="extraData" value="${escapeHtml(extraData)}">
                  <input type="hidden" name="orderInfo" value="${escapeHtml(orderInfo)}">
                  <input type="hidden" name="requestId" value="${escapeHtml(requestId)}">
                  <input type="hidden" name="action" value="cancel">
                  <button type="submit" class="btn btn-cancel">Cancel Payment</button>
              </form>
          </div>
      </div>
  </body>
  </html>
  `;

  res.send(html);
};

export const mockGateProcess = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const body = asRecord(req.body);
    const orderId = asString(body.orderId);
    const amount = asString(body.amount);
    const orderInfo = asString(body.orderInfo);
    const requestId = asString(body.requestId);
    const extraData = asString(body.extraData);
    const action = asString(body.action);

    if (!orderId || !amount || !orderInfo || !requestId) {
      sendPaymentError(
        res,
        400,
        "MOCK_PAYLOAD_INVALID",
        "Mock payment payload is incomplete.",
      );
      return;
    }

    const config = getMoMoConfig();
    const resultCode = action === "success" ? 0 : 1006;
    const message = action === "success" ? "Successful." : "Transaction denied by user.";
    const responseTime = Date.now().toString();
    const transId = Math.floor(Math.random() * 10000000000).toString();

    const rawSignature =
      `accessKey=${config.accessKey}&` +
      `amount=${amount}&` +
      `extraData=${extraData}&` +
      `message=${message}&` +
      `orderId=${orderId}&` +
      `orderInfo=${orderInfo}&` +
      `partnerCode=${config.partnerCode}&` +
      `requestId=${requestId}&` +
      `responseTime=${responseTime}&` +
      `resultCode=${resultCode}&` +
      `transId=${transId}`;

    const signature = createMoMoSignature(rawSignature, config.secretKey);

    const callbackPayload = {
      partnerCode: config.partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType: "momo_wallet",
      transId,
      resultCode,
      message,
      payType: "qr",
      responseTime,
      extraData,
      signature,
    };

    try {
      await fetch(config.ipnUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(callbackPayload),
      });
    } catch (ipnError) {
      console.error("Mock IPN dispatch failed:", ipnError);
    }

    const redirectUrl = new URL(config.redirectUrl);
    Object.entries(callbackPayload).forEach(([key, value]) => {
      redirectUrl.searchParams.append(key, String(value));
    });

    res.redirect(302, redirectUrl.toString());
  } catch (error) {
    console.error("Mock gate process error:", error);
    sendPaymentError(
      res,
      500,
      "MOCK_GATE_PROCESS_FAILED",
      "Unable to process mock payment.",
    );
  }
};
