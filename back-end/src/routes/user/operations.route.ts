import { Router } from "express";
import {
  createOperationTaskReply,
  escalateOperationTask,
  getDailyOperationWorkload,
  getOperationNotifications,
  getOperationTaskDetail,
  getOperationTasks,
  updateOperationTaskStatus,
} from "../../controllers/user/operations.controller.ts";
import {
  requireBusinessRole,
  verifyToken,
} from "../../middlewares/authMiddleware.ts";

const router = Router();

router.use(verifyToken, requireBusinessRole("OPERATION_STAFF"));

router.get("/tasks", getOperationTasks);
router.get("/tasks/:id", getOperationTaskDetail);
router.patch("/tasks/:id/status", updateOperationTaskStatus);
router.post("/tasks/:id/replies", createOperationTaskReply);
router.post("/tasks/:id/escalate", escalateOperationTask);
router.get("/workload/daily", getDailyOperationWorkload);
router.get("/notifications", getOperationNotifications);

export default router;
