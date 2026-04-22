import { Router } from "express";
import { submitReport } from "../../controllers/user/report.controller";
import { verifyToken } from "../../middlewares/authMiddleware";

const router = Router();

router.post("/", verifyToken, submitReport);

export default router;
