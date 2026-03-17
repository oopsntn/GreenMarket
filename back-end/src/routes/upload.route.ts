import { Router } from "express";
import { uploadMedia } from "../controllers/upload.controller.ts";
import { upload } from "../middlewares/upload.middleware.ts";

const router = Router();

// Handle multiple images/videos
router.post("/", upload.array("media", 10), uploadMedia);

export default router;
