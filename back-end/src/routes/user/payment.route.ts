import { Router } from "express";
import { createPayment, createShopRegistrationPayment, createShopVipPayment, createPersonalPackagePayment, vnpayReturn, vnpayIpn, getTransactionHistory } from "../../controllers/user/payment.controller";
import { verifyToken } from "../../middlewares/authMiddleware";

const router = Router();

// Create Payment URL (Requires Auth)
router.post("/buy-package", verifyToken, createPayment);
router.post("/register-shop", verifyToken, createShopRegistrationPayment);
router.post("/buy-shop-vip", verifyToken, createShopVipPayment);
router.post("/buy-personal", verifyToken, createPersonalPackagePayment);

router.get("/history", verifyToken, getTransactionHistory);

// VNPay Callback Routes (Public)
router.get("/vnpay-return", vnpayReturn);
router.post("/vnpay-ipn", vnpayIpn);



export default router;
