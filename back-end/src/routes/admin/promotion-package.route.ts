import { Router } from "express";
import { requireRoles } from "../../middlewares/authMiddleware";

import {
    getPromotionPackages,
    getPromotionPackageById,
    createPromotionPackage,
    updatePromotionPackage,
    deletePromotionPackage,
} from "../../controllers/admin/promotion-package.controller";

const router = Router();

router.get("/", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), getPromotionPackages);

router.get("/:id", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), getPromotionPackageById);

router.post("/", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), createPromotionPackage);

router.put("/:id", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), updatePromotionPackage);

router.delete("/:id", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), deletePromotionPackage);

export default router;
