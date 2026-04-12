import { Router } from "express";
import {
  createManagerEscalation,
  createModerationFeedback,
  getManagerHistory,
  getManagerReports,
  getManagerStatistics,
  getModerationQueue,
  resolveManagerReport,
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
router.post("/moderation-feedback", createModerationFeedback);
router.get("/history", getManagerHistory);
router.get("/statistics", getManagerStatistics);
router.post("/escalations", createManagerEscalation);

export default router;
