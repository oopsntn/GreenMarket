import multer from "multer";

// We use memory storage because our IStorageService handles the persistence
// This allows us to easily swap to Cloudinary/S3 later
const storage = multer.memoryStorage();

export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "image/jpeg", "image/png", "image/webp",
            "video/mp4", "video/quicktime", "video/x-msvideo"
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type. Only images and videos are allowed."));
        }
    }
});
