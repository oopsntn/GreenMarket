import { Router } from "express";
import {
  getUsers,
  getUserById,
  updateUserStatus,
  assignUserBusinessRole,
} from "../../controllers/admin/user.controller.ts";
import { requireRoles } from "../../middlewares/authMiddleware";

const router = Router();

router.get(
  "/",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  getUsers,
);
router.get(
  "/:id",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  getUserById,
);
router.patch(
  "/:id/status",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  updateUserStatus,
);
router.patch(
  "/:id/business-role",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  assignUserBusinessRole,
);

export default router;
