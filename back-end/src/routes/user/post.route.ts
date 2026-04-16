import { Router } from "express";
import {
  activatePersonalMonthlyPlanMock,
  checkIsSaved,
  createPost,
  getMyPosts,
  getPostingPolicy,
  getPublicPostBySlug,
  getPublicPosts,
  recordContactClick,
  restorePost,
  softDeletePost,
  toggleFavoritePost,
  updatePost,
} from "../../controllers/user/post.controller.ts";
import { verifyToken } from "../../middlewares/authMiddleware.ts";

const router = Router();

// Public routes (Buyers — no auth needed)
router.get("/browse", getPublicPosts);
router.get("/detail/:slug", getPublicPostBySlug);
router.post("/:id/contact-click", recordContactClick);

// Protected routes (Sellers — JWT required)
router.post("/", verifyToken, createPost);
router.get("/my-posts", verifyToken, getMyPosts);
router.get("/posting-policy", verifyToken, getPostingPolicy);
router.post("/personal-plan/mock-activate", verifyToken, activatePersonalMonthlyPlanMock);
router.patch("/:id", verifyToken, updatePost);
router.delete("/:id", verifyToken, softDeletePost);
router.post("/:id/restore", verifyToken, restorePost);

router.get("/:id/favorite", verifyToken, checkIsSaved);
router.post("/:id/favorite", verifyToken, toggleFavoritePost);

export default router;
