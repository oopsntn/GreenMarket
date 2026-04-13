import { Router } from "express";
import { createPayment, createShopRegistrationPayment, createShopVipPayment, createPersonalPackagePayment, vnpayReturn, vnpayIpn, vnpayMockExec } from "../../controllers/user/payment.controller.ts";
import { verifyToken } from "../../middlewares/authMiddleware.ts";

const router = Router();

// Create Payment URL (Requires Auth)
router.post("/buy-package", verifyToken, createPayment);
router.post("/register-shop", verifyToken, createShopRegistrationPayment);
router.post("/buy-shop-vip", verifyToken, createShopVipPayment);
router.post("/buy-personal", verifyToken, createPersonalPackagePayment);


// VNPay Callback Routes (Public)
router.get("/vnpay-return", vnpayReturn);
router.post("/vnpay-ipn", vnpayIpn);
router.get("/vnpay-mock-exec", vnpayMockExec);



export default router;
