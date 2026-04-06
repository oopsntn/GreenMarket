import { Router } from "express";
import { requireRoles } from "../../middlewares/authMiddleware";
import { getDashboardOverview } from "../../controllers/admin/dashboard.controller";

const router = Router();

router.get(
    "/",
    requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_SUPPORT", "ROLE_MODERATOR", "ROLE_FINANCE"),
    getDashboardOverview,
);

export default router;
