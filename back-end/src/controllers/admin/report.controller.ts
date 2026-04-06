import { Request, Response } from "express";
import { db } from "../../config/db";
import { desc, eq } from "drizzle-orm";
import { reports } from "../../models/schema/reports.ts";
import { users } from "../../models/schema/users.ts";
import { posts } from "../../models/schema/posts.ts";
import { shops } from "../../models/schema/shops.ts";
import { parseId } from "../../utils/parseId";

const reportSelection = {
    reportId: reports.reportId,
    reporterId: reports.reporterId,
    postId: reports.postId,
    reportShopId: reports.reportShopId,
    reportReasonCode: reports.reportReasonCode,
    reportReason: reports.reportReason,
    reportNote: reports.reportNote,
    reportStatus: reports.reportStatus,
    adminNote: reports.adminNote,
    reportCreatedAt: reports.reportCreatedAt,
    reportUpdatedAt: reports.reportUpdatedAt,
    reporterDisplayName: users.userDisplayName,
    reporterEmail: users.userEmail,
    postTitle: posts.postTitle,
    shopName: shops.shopName,
};

export const getReports = async (req: Request, res: Response): Promise<void> => {
    try {
        const allReports = await db
            .select(reportSelection)
            .from(reports)
            .leftJoin(users, eq(reports.reporterId, users.userId))
            .leftJoin(posts, eq(reports.postId, posts.postId))
            .leftJoin(shops, eq(reports.reportShopId, shops.shopId))
            .orderBy(desc(reports.reportCreatedAt), desc(reports.reportId));
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

        const [report] = await db
            .select(reportSelection)
            .from(reports)
            .leftJoin(users, eq(reports.reporterId, users.userId))
            .leftJoin(posts, eq(reports.postId, posts.postId))
            .leftJoin(shops, eq(reports.reportShopId, shops.shopId))
            .where(eq(reports.reportId, idNumber))
            .limit(1);
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

        const [enrichedReport] = await db
            .select(reportSelection)
            .from(reports)
            .leftJoin(users, eq(reports.reporterId, users.userId))
            .leftJoin(posts, eq(reports.postId, posts.postId))
            .leftJoin(shops, eq(reports.reportShopId, shops.shopId))
            .where(eq(reports.reportId, updatedReport.reportId))
            .limit(1);

        res.json(enrichedReport ?? updatedReport);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};
