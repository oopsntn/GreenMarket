import { Router } from "express";
import { requireRoles } from "../../middlewares/authMiddleware.ts";
import {
  getAdminHostContentDetail,
  getAdminHostContents,
  updateAdminHostContentStatus,
} from "../../controllers/admin/host-content.controller.ts";

const router = Router();

router.get(
  "/",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  getAdminHostContents,
);

router.get(
  "/:id",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  getAdminHostContentDetail,
);

router.patch(
  "/:id/status",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  updateAdminHostContentStatus,
);

export default router;
