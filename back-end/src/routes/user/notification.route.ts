import { Router } from "express";
import { 
  getMyNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from "../../controllers/user/notification.controller.ts";
import { verifyToken } from "../../middlewares/authMiddleware";

const router = Router();

router.get("/", verifyToken, getMyNotifications);
router.patch("/read-all", verifyToken, markAllNotificationsAsRead);
router.patch("/:id/read", verifyToken, markNotificationAsRead);

export default router;
