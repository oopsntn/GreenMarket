import { Request, Response } from "express";
import { db } from "../../config/db.ts";
import { eq, and } from "drizzle-orm";
import { reports } from "../../models/schema/reports.ts";

export const submitReport = async (req: Request, res: Response): Promise<void> => {
    try {
        const { reporterId, postId, reportReason } = req.body;

        if (!postId || !reportReason) {
            res.status(400).json({ error: "Post ID and Reason are required" });
            return;
        }

        const [newReport] = await db.insert(reports).values({
            reporterId: reporterId || null,
            postId,
            reportReason,
            reportStatus: "pending"
        }).returning();

        res.status(201).json({
            message: "Report submitted successfully. Admin will review it shortly.",
            report: newReport
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};
