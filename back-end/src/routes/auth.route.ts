import { Router } from "express";
import { adminLogin, userRequestOtp, userVerifyOtp } from "../controllers/auth.controller";
import { generateQR, checkQRStatus, scanQR, authorizeQR } from "../controllers/user/qrAuth.controller";
import { verifyToken } from "../middlewares/authMiddleware";

const router = Router();

// Admin
router.post("/admin/login", adminLogin);

// User OTP
router.post("/user/request-otp", userRequestOtp);
router.post("/user/verify-otp", userVerifyOtp);

// User QR Auth (Web side)
router.post("/qr/generate", generateQR);
router.get("/qr/status/:sessionId", checkQRStatus);

// User QR Auth (Mobile side - requires token)
router.post("/qr/scan", verifyToken, scanQR);
router.post("/qr/authorize", verifyToken, authorizeQR);

export default router;
