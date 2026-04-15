import { Router } from "express";
import { requireRoles } from "../../middlewares/authMiddleware";
import { getCustomerSpendingSummary } from "../../controllers/admin/customer-spending.controller";

const router = Router();

router.get(
    "/",
    requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
    getCustomerSpendingSummary,
);

export default router;
