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
} from "../../controllers/user/collaborator.controller.ts";
import {
  requireBusinessRole,
  verifyToken,
} from "../../middlewares/authMiddleware.ts";

const router = Router();

router.use(verifyToken, requireBusinessRole("COLLABORATOR"));

router.get("/profile", getCollaboratorProfile);
router.patch("/profile", updateCollaboratorAvailability);
router.get("/jobs", getAvailableJobs);
router.get("/jobs/:id", getJobDetail);
router.post("/jobs/:id/decision", decideJob);
router.post("/jobs/:id/contact", contactJobCustomer);
router.get("/my-jobs", getMyJobs);
router.post("/jobs/:id/deliverables", submitJobDeliverables);
router.get("/earnings", getCollaboratorEarnings);
router.get("/payout-requests", getPayoutRequestHistory);
router.post("/payout-requests", createPayoutRequest);

export default router;
