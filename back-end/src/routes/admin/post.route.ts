import { Router } from "express";
import { getPosts, createPost, getPostById, updatePostStatus, deletePost } from "../../controllers/admin/post.controller";
import { requireRoles } from "../../middlewares/authMiddleware";

const router = Router();

router.get("/", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), getPosts);
router.post("/", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), createPost);
router.get("/:id", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), getPostById);
router.patch("/:id/status", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), updatePostStatus);
router.delete("/:id", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), deletePost);

export default router;
