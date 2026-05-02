import { Router } from "express";
import { requireRoles } from "../../middlewares/authMiddleware.ts";
import {
  approvePayoutRequest,
  createPayoutRequest,
  getAllPayoutRequests,
  getPayoutRequestDetail,
  getHostPayoutCandidates,
  processPayoutRequest,
  rejectPayoutRequest,
} from "../../controllers/admin/financial.controller.ts";

const router = Router();

router.get(
  "/payout-requests",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  getAllPayoutRequests,
);

router.get(
  "/payout-hosts",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  getHostPayoutCandidates,
);

router.post(
  "/payout-requests",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  createPayoutRequest,
);

router.get(
  "/payout-requests/:id",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  getPayoutRequestDetail,
);

router.patch(
  "/payout-requests/:id/approve",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  approvePayoutRequest,
);

router.patch(
  "/payout-requests/:id/reject",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  rejectPayoutRequest,
);

// Backward-compatible legacy endpoint.
router.patch(
  "/payout-requests/:id/process",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  processPayoutRequest,
);

export default router;
