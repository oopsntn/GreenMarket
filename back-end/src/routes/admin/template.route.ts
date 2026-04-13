import { Router } from "express";
import { requireRoles } from "../../middlewares/authMiddleware.ts";
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  cloneTemplate,
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
router.post(
  "/:id/clone",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  cloneTemplate,
);
router.patch(
  "/:id/status",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  updateTemplateStatus,
);

export default router;
