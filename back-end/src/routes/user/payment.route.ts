import { Router } from "express";
import { createPayment, momoReturn, momoIpn, mockGate, mockGateProcess } from "../../controllers/user/payment.controller.ts";
import { verifyToken } from "../../middlewares/authMiddleware.ts";

const router = Router();

// Create Payment URL (Requires Auth)
router.post("/buy-package", verifyToken, createPayment);

// MoMo Callback Routes (Public)
router.get("/momo-return", momoReturn);
router.post("/momo-ipn", momoIpn);

// Mock Gateway Routes (Development only)
router.get("/mock-gate", mockGate);
router.post("/mock-gate-process", mockGateProcess);

export default router;
