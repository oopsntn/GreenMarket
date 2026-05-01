import { Router } from "express";
import { submitSupportRequest } from "../../controllers/user/support.controller";
import { verifyToken } from "../../middlewares/authMiddleware";

const router = Router();

router.post("/", verifyToken, submitSupportRequest);

export default router;
