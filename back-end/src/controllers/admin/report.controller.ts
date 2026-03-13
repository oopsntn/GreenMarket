import { Request, Response } from "express";
import { db } from "../../config/db";
import { eq } from "drizzle-orm";
import { reports, type Report } from "../../models/schema/reports.ts";
import { parseId } from "../../utils/parseId";

export const getReports = async (req: Request, res: Response): Promise<void> => {
    try {
        const allReports = await db.select().from(reports);
        res.json(allReports);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getReportById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
        const idNumber = parseId(req.params.id);
        if (idNumber === null) {
            res.status(400).json({ error: "Invalid report id" });
            return;
        }

        const [report] = await db.select().from(reports).where(eq(reports.reportId, idNumber)).limit(1);
        if (!report) {
            res.status(404).json({ error: "Report not found" });
            return;
        }

        res.json(report);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const resolveReport = async (req: Request<{ id: string }, {}, { status: string, adminNote?: string }>, res: Response): Promise<void> => {
    try {
        const idNumber = parseId(req.params.id);
        if (idNumber === null) {
            res.status(400).json({ error: "Invalid report id" });
            return;
        }

        const { status, adminNote } = req.body;

        const [updatedReport] = await db.update(reports)
            .set({ 
                reportStatus: status as any, // pending, resolved, dismissed
                adminNote,
                reportUpdatedAt: new Date()
            })
            .where(eq(reports.reportId, idNumber))
            .returning();

        if (!updatedReport) {
            res.status(404).json({ error: "Report not found" });
            return;
        }

        res.json(updatedReport);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};
