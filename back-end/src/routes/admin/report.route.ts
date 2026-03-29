import { Router } from "express";
import { getReports, getReportById, resolveReport } from "../../controllers/admin/report.controller.ts";
import { requireRoles } from "../../middlewares/authMiddleware.ts";

const router = Router();

router.get("/", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_MODERATOR"), getReports);
router.get("/:id", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_MODERATOR"), getReportById);
router.patch("/:id/resolve", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_MODERATOR"), resolveReport);

export default router;
