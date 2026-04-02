import { Router } from "express";
import { createPayment, vnpayReturn, vnpayIpn } from "../../controllers/user/payment.controller";
import { verifyToken } from "../../middlewares/authMiddleware";

const router = Router();

// Create VNPay payment URL (Requires Auth)
router.post("/buy-package", verifyToken, createPayment);

// VNPay Callback Routes (Public, no auth since VNPay calls these directly or redirect happens)
router.get("/vnpay-return", vnpayReturn);
router.get("/vnpay-ipn", vnpayIpn);

export default router;
