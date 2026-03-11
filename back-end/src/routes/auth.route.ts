import { Router } from "express";
import { adminLogin, userRequestOtp, userVerifyOtp } from "../controllers/auth.controller";

const router = Router();

// Admin
router.post("/admin/login", adminLogin);

// User
router.post("/user/request-otp", userRequestOtp);
router.post("/user/verify-otp", userVerifyOtp);

export default router;
