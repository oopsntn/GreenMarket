import { Router } from "express";
import {
  getAllPayoutRequests,
  processPayoutRequest,
} from "../../controllers/admin/financial.controller.ts";
import { requireRoles } from "../../middlewares/authMiddleware.ts";

const router = Router();

// Financial routes require ROLE_ADMIN or ROLE_SUPER_ADMIN
router.use(requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"));

router.get("/payout-requests", getAllPayoutRequests);
router.patch("/payout-requests/:id/process", processPayoutRequest);

export default router;
