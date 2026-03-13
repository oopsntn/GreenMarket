import { Router } from "express";
import { getReports, getReportById, resolveReport } from "../../controllers/admin/report.controller.ts";

const router = Router();

router.get("/", getReports);
router.get("/:id", getReportById);
router.patch("/:id/resolve", resolveReport);

export default router;
