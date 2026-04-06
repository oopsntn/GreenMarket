import { Router } from "express";
import { requireRoles } from "../../middlewares/authMiddleware";
import { getRevenueSummary } from "../../controllers/admin/revenue.controller";

const router = Router();

router.get(
    "/",
    requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_FINANCE"),
    getRevenueSummary,
);

export default router;
