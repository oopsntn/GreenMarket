import { Router } from "express";
import { requireRoles } from "../../middlewares/authMiddleware";
import {
  getTemplateBuilderPreset,
  resetTemplateBuilderPreset,
  saveTemplateBuilderPreset,
} from "../../controllers/admin/template-builder.controller.ts";

const router = Router();

router.get(
  "/preset",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  getTemplateBuilderPreset,
);
router.put(
  "/preset",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  saveTemplateBuilderPreset,
);
router.post(
  "/preset/reset",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  resetTemplateBuilderPreset,
);

export default router;
