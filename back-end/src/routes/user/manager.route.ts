import { Router } from "express";
import {
  createManagerEscalation,
  createModerationFeedback,
  getHostContentById,
  getManagerHistory,
  getManagerReports,
  getManagerStatistics,
  getModerationQueue,
  getPendingHostContents,
  resolveManagerReport,
  updateManagerHostContentStatus,
  updateManagerPostStatus,
  updateManagerShopStatus,
} from "../../controllers/user/manager.controller.ts";
import {
  requireBusinessRole,
  verifyToken,
} from "../../middlewares/authMiddleware.ts";

const router = Router();

router.use(verifyToken, requireBusinessRole("MANAGER"));

router.get("/moderation/queue", getModerationQueue);
router.patch("/posts/:id/status", updateManagerPostStatus);
router.patch("/shops/:id/status", updateManagerShopStatus);
router.get("/reports", getManagerReports);
router.patch("/reports/:id/resolve", resolveManagerReport);
router.get("/host-contents/pending", getPendingHostContents);
router.get("/host-contents/:id", getHostContentById);
router.patch("/host-contents/:id/status", updateManagerHostContentStatus);
router.post("/moderation-feedback", createModerationFeedback);
router.get("/history", getManagerHistory);
router.get("/statistics", getManagerStatistics);
router.post("/escalations", createManagerEscalation);

export default router;
