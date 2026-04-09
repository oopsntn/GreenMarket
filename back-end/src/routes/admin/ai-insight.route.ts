import { Router } from "express";
import { requireRoles } from "../../middlewares/authMiddleware.ts";
import {
  generateAIInsight,
  getAIInsightHistory,
  getAIInsightSettings,
  getAITrendRows,
  updateAIInsightSettings,
} from "../../controllers/admin/ai-insight.controller.ts";

const router = Router();

router.get(
  "/settings",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  getAIInsightSettings,
);
router.put(
  "/settings",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  updateAIInsightSettings,
);
router.get(
  "/trends",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  getAITrendRows,
);
router.get(
  "/history",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  getAIInsightHistory,
);
router.post(
  "/generate",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  generateAIInsight,
);

export default router;
