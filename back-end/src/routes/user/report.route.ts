import { Router } from "express";
import { submitReport } from "../../controllers/user/report.controller.ts";

const router = Router();

router.post("/", submitReport);

export default router;
