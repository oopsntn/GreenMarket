import { Router } from "express";
import { requireRoles } from "../../middlewares/authMiddleware";
import { getAnalyticsSummary } from "../../controllers/admin/analytics.controller";

const router = Router();

router.get(
    "/",
    requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_SUPPORT", "ROLE_MODERATOR", "ROLE_FINANCE"),
    getAnalyticsSummary,
);

export default router;
