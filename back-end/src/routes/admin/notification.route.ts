import { Router } from "express";
import { requireRoles } from "../../middlewares/authMiddleware.ts";
import {
  getAdminNotificationHistory,
  sendAdminNotification,
} from "../../controllers/admin/notification.controller.ts";

const router = Router();

router.post(
  "/send",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  sendAdminNotification,
);

router.get(
  "/history",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  getAdminNotificationHistory,
);

export default router;
