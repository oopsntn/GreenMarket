import { Router } from "express";
import { requireRoles } from "../../middlewares/authMiddleware.ts";
import {
  getSettings,
  resetSettings,
  updateSettings,
} from "../../controllers/admin/settings.controller.ts";

const router = Router();

router.get("/", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), getSettings);
router.put("/", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), updateSettings);
router.post(
  "/reset",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  resetSettings,
);

export default router;
