import { Router } from "express";
import { submitReport } from "../../controllers/user/report.controller.ts";
import { optionalVerifyToken } from "../../middlewares/authMiddleware.ts";

const router = Router();

router.post("/", optionalVerifyToken, submitReport);

export default router;
