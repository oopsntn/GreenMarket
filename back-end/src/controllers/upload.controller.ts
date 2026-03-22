import { Request, Response } from "express";
import { storageService } from "../services/storage.service.ts";

export const uploadMedia = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            res.status(400).json({ error: "No files uploaded" });
            return;
        }

        const files = req.files as Express.Multer.File[];
        const uploadPromises = files.map(file => storageService.saveFile(file));
        
        const urls = await Promise.all(uploadPromises);

        res.json({
            urls: urls
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "Failed to upload files" });
    }
};
