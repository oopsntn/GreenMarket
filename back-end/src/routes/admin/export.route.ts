import { Router } from "express";
import { requireRoles } from "../../middlewares/authMiddleware";
import {
    createFinancialExport,
    createGeneralExport,
    getExportHistory,
} from "../../controllers/admin/export.controller";

const router = Router();

router.get(
    "/history",
    requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
    getExportHistory,
);
router.post(
    "/general",
    requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
    createGeneralExport,
);
router.post(
    "/financial",
    requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
    createFinancialExport,
);

export default router;
