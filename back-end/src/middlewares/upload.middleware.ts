import multer from "multer";
import path from "path";

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

export const MAX_IMAGE_SIZE = 3 * 1024 * 1024; // 3MB
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

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

const createUploadMiddleware = (allowVideos: boolean, maxFileSize: number) => multer({
    storage: storage,
    limits: {
        fileSize: maxFileSize,
    },
    fileFilter: createFileFilter(allowVideos)
});

export const upload = createUploadMiddleware(true, MAX_VIDEO_SIZE);
export const uploadImagesOnly = createUploadMiddleware(false, MAX_IMAGE_SIZE);


export const validateFileSizes = (req: any, res: any, next: any) => {
    if (!req.files) return next();

    const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();

    for (const file of (files as Express.Multer.File[])) {
        const mimeType = String(file.mimetype || "").toLowerCase();
        const isVideo = mimeType.startsWith("video/") || ALLOWED_VIDEO_MIME_TYPES.has(mimeType);

        if (isVideo) {
            if (file.size > MAX_VIDEO_SIZE) {
                return res.status(400).json({ error: `Video file "${file.originalname}" exceeds the 50MB limit.` });
            }
        } else {
            // Assume it's an image if it passed the fileFilter
            if (file.size > MAX_IMAGE_SIZE) {
                return res.status(400).json({ error: `Image file "${file.originalname}" exceeds the 3MB limit.` });
            }
        }
    }

    next();
};

