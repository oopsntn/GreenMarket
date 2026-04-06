import { Router } from "express";
import { requireRoles } from "../../middlewares/authMiddleware";
import {
    getBoostedPostById,
    getBoostedPosts,
    updateBoostedPostStatus,
} from "../../controllers/admin/boosted-post.controller";

const router = Router();

router.get("/", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), getBoostedPosts);
router.get("/:id", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), getBoostedPostById);
router.patch("/:id/status", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), updateBoostedPostStatus);

export default router;
