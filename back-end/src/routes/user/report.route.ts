import { Router } from "express";
import { submitReport } from "../../controllers/user/report.controller.ts";
import { verifyToken } from "../../middlewares/authMiddleware.ts";

const router = Router();

router.post("/", verifyToken, submitReport);

export default router;
