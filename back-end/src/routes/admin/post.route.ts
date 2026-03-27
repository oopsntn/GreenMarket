import { Router } from "express";
import { getPosts, createPost, getPostById, updatePostStatus, deletePost } from "../../controllers/admin/post.controller";
import { requireRoles } from "../../middlewares/authMiddleware";

const router = Router();

router.get("/", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_MODERATOR"), getPosts);
router.post("/", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_MODERATOR"), createPost);
router.get("/:id", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_MODERATOR"), getPostById);
router.patch("/:id/status", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_MODERATOR"), updatePostStatus);
router.delete("/:id", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_MODERATOR"), deletePost);

export default router;
