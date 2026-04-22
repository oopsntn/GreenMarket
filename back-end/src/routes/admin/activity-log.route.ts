import { Router } from "express";
import { requireRoles } from "../../middlewares/authMiddleware";
import { getActivityLogs } from "../../controllers/admin/activity-log.controller";

const router = Router();

router.get("/", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), getActivityLogs);

export default router;
