import { Router } from "express";
import { getReports, getReportById, resolveReport } from "../../controllers/admin/report.controller";
import { requireRoles } from "../../middlewares/authMiddleware";

const router = Router();

router.get("/", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), getReports);
router.get("/:id", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), getReportById);
router.patch("/:id/resolve", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), resolveReport);

export default router;
