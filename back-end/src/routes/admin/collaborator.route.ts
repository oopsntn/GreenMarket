import { Router } from "express";
import { requireRoles } from "../../middlewares/authMiddleware";
import {
  getAdminCollaboratorDetail,
  getAdminCollaborators,
} from "../../controllers/admin/collaborator.controller.ts";

const router = Router();

router.get(
  "/",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  getAdminCollaborators,
);

router.get(
  "/:id",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  getAdminCollaboratorDetail,
);

export default router;
