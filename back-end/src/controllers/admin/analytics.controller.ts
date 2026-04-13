import { Request, Response } from "express";
import { adminReportingService } from "../../services/adminReporting.service.ts";

export const getAnalyticsSummary = async (
    req: Request<{}, {}, {}, { fromDate?: string; toDate?: string }>,
    res: Response,
): Promise<void> => {
    try {
        const data = await adminReportingService.getAnalyticsSummary(
            req.query.fromDate,
            req.query.toDate,
        );
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
    }
};
