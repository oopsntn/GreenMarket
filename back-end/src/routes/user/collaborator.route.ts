import { Router } from "express";
import {
  contactJobCustomer,
  createPayoutRequest,
  decideJob,
  getAvailableJobs,
  getCollaboratorProfile,
  getCollaboratorEarnings,
  getJobDetail,
  getMyJobs,
  getPayoutRequestHistory,
  submitJobDeliverables,
  updateCollaboratorAvailability,
  getPublicCollaborators,
  getPublicCollaboratorDetail,
  getMyInvitations,
  respondToInvitation,
} from "../../controllers/user/collaborator.controller.ts";
import {
  requireBusinessRole,
  verifyToken,
} from "../../middlewares/authMiddleware.ts";

const router = Router();

router.get("/profile", verifyToken, requireBusinessRole("COLLABORATOR"), getCollaboratorProfile);
router.patch("/profile", verifyToken, requireBusinessRole("COLLABORATOR"), updateCollaboratorAvailability);

// Public/Owner discovery routes
router.get("/public-list", verifyToken, getPublicCollaborators);
router.get("/public/:id", verifyToken, getPublicCollaboratorDetail);

// Invitation management
router.get("/invitations", verifyToken, getMyInvitations); // CTV check invites
router.post("/invitations/:id/respond", verifyToken, respondToInvitation); // CTV respond

// CTV Job management
router.get("/jobs", verifyToken, requireBusinessRole("COLLABORATOR"), getAvailableJobs);
router.get("/jobs/:id", verifyToken, requireBusinessRole("COLLABORATOR"), getJobDetail);
router.post("/jobs/:id/decision", verifyToken, requireBusinessRole("COLLABORATOR"), decideJob);
router.post("/jobs/:id/contact", verifyToken, requireBusinessRole("COLLABORATOR"), contactJobCustomer);
router.get("/my-jobs", verifyToken, requireBusinessRole("COLLABORATOR"), getMyJobs);
router.post("/jobs/:id/deliverables", verifyToken, requireBusinessRole("COLLABORATOR"), submitJobDeliverables);
router.get("/earnings", verifyToken, requireBusinessRole("COLLABORATOR"), getCollaboratorEarnings);
router.get("/payout-requests", verifyToken, requireBusinessRole("COLLABORATOR"), getPayoutRequestHistory);
router.post("/payout-requests", verifyToken, requireBusinessRole("COLLABORATOR"), createPayoutRequest);

export default router;
