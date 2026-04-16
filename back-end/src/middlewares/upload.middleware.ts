import multer from "multer";
import path from "path";
import { NextFunction, Request, Response } from "express";
import { adminWebSettingsService } from "../services/adminWebSettings.service.ts";

// We use memory storage because our IStorageService handles the persistence
// This allows us to easily swap to Cloudinary/S3 later
const storage = multer.memoryStorage();

const ALLOWED_IMAGE_MIME_TYPES = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/bmp",
    "image/avif",
    "image/heic",
    "image/heif",
]);

const ALLOWED_VIDEO_MIME_TYPES = new Set([
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "video/webm",
    "video/x-matroska",
    "video/mpeg",
]);

const ALLOWED_IMAGE_EXTENSIONS = new Set([
    ".jpg",
    ".jpeg",
    ".jfif",
    ".png",
    ".webp",
    ".gif",
    ".bmp",
    ".avif",
    ".heic",
    ".heif",
]);

const ALLOWED_VIDEO_EXTENSIONS = new Set([
    ".mp4",
    ".mov",
    ".avi",
    ".webm",
    ".mkv",
    ".mpeg",
    ".mpg",
]);

const createFileFilter = (allowVideos: boolean) => {
    return (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        const mimeType = String(file.mimetype || "").toLowerCase();
        const fileExt = path.extname(file.originalname || "").toLowerCase();

        const isImage = ALLOWED_IMAGE_MIME_TYPES.has(mimeType)
            || (mimeType.startsWith("image/") && ALLOWED_IMAGE_EXTENSIONS.has(fileExt))
            || (mimeType === "application/octet-stream" && ALLOWED_IMAGE_EXTENSIONS.has(fileExt));

        const isVideo = ALLOWED_VIDEO_MIME_TYPES.has(mimeType)
            || (mimeType.startsWith("video/") && ALLOWED_VIDEO_EXTENSIONS.has(fileExt))
            || (mimeType === "application/octet-stream" && ALLOWED_VIDEO_EXTENSIONS.has(fileExt));

        if (isImage || (allowVideos && isVideo)) {
            cb(null, true);
        } else {
            cb(new Error(
                allowVideos
                    ? "Invalid file type. Supported image formats: jpg, jpeg, jfif, png, webp, gif, bmp, avif, heic, heif. Supported video formats: mp4, mov, avi, webm, mkv, mpeg."
                    : "Invalid image type. Supported image formats: jpg, jpeg, jfif, png, webp, gif, bmp, avif, heic, heif."
            ));
        }
    };
};

const createUploadMiddleware = (allowVideos: boolean) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const settings = await adminWebSettingsService.getSettings();
            const maxFileSizeMb = Math.max(1, Number(settings.media.maxFileSizeMb || 0));
            const middleware = multer({
                storage,
                limits: {
                    fileSize: maxFileSizeMb * 1024 * 1024,
                },
                fileFilter: createFileFilter(allowVideos),
            }).array("media", 10);

            middleware(req, res, next);
        } catch (error) {
            next(error);
        }
    };

export const upload = createUploadMiddleware(true);
export const uploadImagesOnly = createUploadMiddleware(false);
