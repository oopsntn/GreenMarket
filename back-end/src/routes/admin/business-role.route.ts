import { Router } from "express";
import {
  createBusinessRole,
  deleteBusinessRole,
  getBusinessRoleById,
  getBusinessRoles,
  updateBusinessRole,
  updateBusinessRoleStatus,
} from "../../controllers/admin/business-role.controller.ts";
import { requireRoles } from "../../middlewares/authMiddleware";

const router = Router();

router.get(
  "/",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  getBusinessRoles,
);
router.get(
  "/:id",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  getBusinessRoleById,
);
router.post(
  "/",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  createBusinessRole,
);
router.put(
  "/:id",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  updateBusinessRole,
);
router.patch(
  "/:id/status",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  updateBusinessRoleStatus,
);
router.delete(
  "/:id",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  deleteBusinessRole,
);

export default router;
