import { Router } from "express";
import { uploadMedia } from "../controllers/upload.controller.ts";
import { upload, uploadImagesOnly } from "../middlewares/upload.middleware.ts";

const router = Router();

const runUpload = (middleware: any) => {
    return (req: any, res: any, next: any) => {
        middleware(req, res, (err: any) => {
            if (err) {
                res.status(400).json({ error: err.message || "Upload failed" });
                return;
            }
            next();
        });
    };
};

// Handle mixed media uploads (images/videos)
router.post("/", runUpload(upload.array("media", 10)), uploadMedia);

// Handle image-only uploads
router.post("/images", runUpload(uploadImagesOnly.array("media", 10)), uploadMedia);

export default router;
