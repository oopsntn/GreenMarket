import { Router } from "express";
import { createPost, getMyPosts, updatePost, softDeletePost, getPublicPosts, getPublicPostBySlug, recordContactClick, toggleFavoritePost, checkIsSaved } from "../../controllers/user/post.controller.ts";
import { verifyToken } from "../../middlewares/authMiddleware.ts";

const router = Router();

// Public routes (Buyers — no auth needed)
router.get("/browse", getPublicPosts);
router.get("/detail/:slug", getPublicPostBySlug);
router.post("/:id/contact-click", recordContactClick);

// Protected routes (Sellers — JWT required)
router.post("/", verifyToken, createPost);
router.get("/my-posts", verifyToken, getMyPosts);
router.patch("/:id", verifyToken, updatePost);
router.delete("/:id", verifyToken, softDeletePost);

router.get("/:id/favorite", verifyToken, checkIsSaved);
router.post("/:id/favorite", verifyToken, toggleFavoritePost);

export default router;
