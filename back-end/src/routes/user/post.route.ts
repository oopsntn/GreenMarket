import { Router } from "express";
import { createPost, getMyPosts, updatePost, getPublicPosts, getPublicPostBySlug } from "../../controllers/user/post.controller.ts";

const router = Router();

// Public routes (Buyers)
router.get("/browse", getPublicPosts);
router.get("/detail/:slug", getPublicPostBySlug);

// User routes (Sellers)
router.post("/", createPost);
router.get("/my-posts", getMyPosts);
router.patch("/:id", updatePost);

export default router;
