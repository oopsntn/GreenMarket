import { Router } from "express";
import { 
  getProfile, 
  updateProfile, 
  getFavoritePosts,
  requestUserEmailOTP,
  verifyAndAddUserEmail,
  removeUserEmail
} from "../../controllers/user/profile.controller.ts";
import { verifyToken } from "../../middlewares/authMiddleware";

const router = Router();

// All profile routes require authentication
router.use(verifyToken);

router.get("/", getProfile);
router.patch("/", updateProfile);

router.get("/favorites", getFavoritePosts);

router.post("/email/request-otp", requestUserEmailOTP);
router.post("/email/verify", verifyAndAddUserEmail);
router.post("/email/remove", removeUserEmail);

export default router;
