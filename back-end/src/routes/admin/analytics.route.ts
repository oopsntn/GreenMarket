import { Router } from "express";
import { requireRoles } from "../../middlewares/authMiddleware";
import { getAnalyticsSummary } from "../../controllers/admin/analytics.controller";

const router = Router();

router.get(
    "/",
    requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
    getAnalyticsSummary,
);

export default router;
