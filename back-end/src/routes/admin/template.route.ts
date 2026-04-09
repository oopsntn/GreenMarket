import { Router } from "express";
import { requireRoles } from "../../middlewares/authMiddleware.ts";
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  updateTemplateStatus,
} from "../../controllers/admin/template.controller.ts";

const router = Router();

router.get("/", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), getTemplates);
router.post(
  "/",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  createTemplate,
);
router.put(
  "/:id",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  updateTemplate,
);
router.patch(
  "/:id/status",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  updateTemplateStatus,
);

export default router;
