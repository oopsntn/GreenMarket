import { Router } from "express";
import {
  getHostDashboard,
  getHostEarnings,
  getPayoutRequests,
  createPayoutRequest,
  getContents,
  getContentDetail,
  createContent,
  updateContent,
  deleteContent,
  getPublicContents,
  getPublicContentDetail,
  toggleFavoriteContent,
  getMyFavoriteContents,
  checkIsContentSaved,
} from "../../controllers/user/host.controller.ts";
import { verifyToken, requireBusinessRole } from "../../middlewares/authMiddleware";

const router = Router();

// Public APIs (no auth required)
router.get("/public/contents", getPublicContents);
router.get("/public/contents/:id", getPublicContentDetail);

// Authenticated user APIs (any logged-in user, not just HOST)
router.get("/favorites", verifyToken, getMyFavoriteContents);
router.get("/favorites/:id/check", verifyToken, checkIsContentSaved);
router.post("/favorites/:id", verifyToken, toggleFavoriteContent);

// Protected Host APIs (HOST role only)
router.use(verifyToken);
router.use(requireBusinessRole("HOST"));

router.get("/dashboard", getHostDashboard);
router.get("/earnings", getHostEarnings);
router.get("/payout-requests", getPayoutRequests);
router.post("/payout-requests", createPayoutRequest);

router.get("/contents", getContents);
router.get("/contents/:id", getContentDetail);
router.post("/contents", createContent);
router.patch("/contents/:id", updateContent);
router.delete("/contents/:id", deleteContent);

export default router;
