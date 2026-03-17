import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export interface IStorageService {
    saveFile(file: Express.Multer.File): Promise<string>;
    deleteFile(fileUrl: string): Promise<void>;
}

export class LocalStorageService implements IStorageService {
    private uploadDir: string;
    private baseUrl: string;

    constructor() {
        this.uploadDir = path.join(process.cwd(), "uploads");
        this.baseUrl = process.env.BASE_URL || "http://localhost:5000";
        
        // Ensure upload directory exists
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    async saveFile(file: Express.Multer.File): Promise<string> {
        const ext = path.extname(file.originalname);
        const fileName = `${uuidv4()}${ext}`;
        const filePath = path.join(this.uploadDir, fileName);

        await fs.promises.writeFile(filePath, file.buffer);

        return `${this.baseUrl}/uploads/${fileName}`;
    }

    async deleteFile(fileUrl: string): Promise<void> {
        const fileName = path.basename(fileUrl);
        const filePath = path.join(this.uploadDir, fileName);
        
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
        }
    }
}

// Export a default instance (could be switched to Cloudinary later)
export const storageService: IStorageService = new LocalStorageService();
