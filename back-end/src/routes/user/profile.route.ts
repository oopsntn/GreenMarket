import { Router } from "express";
import { getProfile, updateProfile } from "../../controllers/user/profile.controller.ts";
import { verifyToken } from "../../middlewares/authMiddleware.ts";

const router = Router();

// All profile routes require authentication
router.use(verifyToken);

router.get("/", getProfile);
router.patch("/", updateProfile);

export default router;
