import { Router } from "express";
import { requireRoles } from "../../middlewares/authMiddleware.ts";
import { getActivityLogs } from "../../controllers/admin/activity-log.controller.ts";

const router = Router();

router.get("/", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), getActivityLogs);

export default router;
