import { Router } from "express";
import { getPosts, createPost, getPostById, updatePostStatus, deletePost } from "../../controllers/admin/post.controller";

const router = Router();

router.get("/", getPosts);
router.post("/", createPost);
router.get("/:id", getPostById);
router.patch("/:id/status", updatePostStatus);
router.delete("/:id", deletePost);

export default router;
