import { Router } from "express";
import {
  getHostDashboard,
  getHostEarnings,
  getPayoutRequests,
  createPayoutRequest,
  getContents,
  createContent,
  updateContent,
  deleteContent,
  trackContentClick,
} from "../../controllers/user/host.controller.ts";
import { verifyToken, requireBusinessRole } from "../../middlewares/authMiddleware.ts";

const router = Router();

// Public Tracking (no auth required to click a link)
router.get("/tracking/:id", trackContentClick);

// Protected Host APIs
router.use(verifyToken);
router.use(requireBusinessRole("HOST"));

router.get("/dashboard", getHostDashboard);
router.get("/earnings", getHostEarnings);
router.get("/payout-requests", getPayoutRequests);
router.post("/payout-requests", createPayoutRequest);

router.get("/contents", getContents);
router.post("/contents", createContent);
router.patch("/contents/:id", updateContent);
router.delete("/contents/:id", deleteContent);

export default router;
