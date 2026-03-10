import { Router } from "express";
import {
    adminLogin,
    userRequestOtp,
    userVerifyOtp
} from "../controllers/authController";

const router = Router();

// Admin Auth
router.post("/admin/login", adminLogin);

// User Auth
router.post("/user/request-otp", userRequestOtp);
router.post("/user/verify-otp", userVerifyOtp);

export default router;
