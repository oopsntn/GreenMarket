import { Router } from "express";
import { requireRoles } from "../../middlewares/authMiddleware";
import {
    changePromotionPackage,
    getPromotionById,
    getPromotions,
    reopenPromotion,
    updatePromotionStatus,
} from "../../controllers/admin/promotion.controller";

const router = Router();

router.get("/", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), getPromotions);
router.get("/:id", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), getPromotionById);
router.patch("/:id/status", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), updatePromotionStatus);
router.patch("/:id/package", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), changePromotionPackage);
router.patch("/:id/reopen", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), reopenPromotion);

export default router;
