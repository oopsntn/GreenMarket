import { Router } from "express";
import { requireRoles } from "../../middlewares/authMiddleware.ts";
import {
  getAccountPackages,
  getAccountPackageTracking,
  updateAccountPackage,
} from "../../controllers/admin/account-package.controller.ts";

const router = Router();

router.get("/", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), getAccountPackages);
router.get(
  "/tracking",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  getAccountPackageTracking,
);
router.patch(
  "/:code",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  updateAccountPackage,
);

export default router;
