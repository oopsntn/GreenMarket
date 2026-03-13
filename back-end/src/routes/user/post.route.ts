import { Router } from "express";
import { createPost, getMyPosts, updatePost } from "../../controllers/user/post.controller.ts";

const router = Router();

router.post("/", createPost);
router.get("/my-posts", getMyPosts);
router.patch("/:id", updatePost);

export default router;
