import { Response } from "express";
import { AuthRequest } from "../../dtos/auth.ts";
import { adminReportingService } from "../../services/adminReporting.service.ts";

const getGeneratedBy = (req: AuthRequest) =>
    req.user?.email || req.user?.mobile || "Quản trị viên hệ thống";

export const getExportHistory = async (
    req: AuthRequest,
    res: Response,
): Promise<void> => {
    try {
        const historyItems = await adminReportingService.getExportHistory();
        res.json(historyItems);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
    }
};

export const createGeneralExport = async (
    req: AuthRequest,
    res: Response,
): Promise<void> => {
    try {
        const { module, fromDate, toDate, format } = req.body as {
            module: "Users" | "Categories" | "Attributes" | "Templates" | "Promotions" | "Analytics";
            fromDate?: string;
            toDate?: string;
            format: "CSV" | "XLSX";
        };

        if (!module || !format) {
            res.status(400).json({ error: "Bắt buộc phải có phân hệ và định dạng tệp" });
            return;
        }

        const result = await adminReportingService.createGeneralExport({
            module,
            fromDate,
            toDate,
            format,
            generatedBy: getGeneratedBy(req),
        });

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(400).json({
            error: error instanceof Error ? error.message : "Không thể tạo tệp xuất dữ liệu",
        });
    }
};

export const createFinancialExport = async (
    req: AuthRequest,
    res: Response,
): Promise<void> => {
    try {
        const { reportType, fromDate, toDate, format } = req.body as {
            reportType: "Revenue Summary" | "Customer Spending Report" | "Promotion Performance";
            fromDate?: string;
            toDate?: string;
            format: "CSV" | "XLSX";
        };

        if (!reportType || !format) {
            res.status(400).json({ error: "Bắt buộc phải có loại báo cáo và định dạng tệp" });
            return;
        }

        const result = await adminReportingService.createFinancialExport({
            reportType,
            fromDate,
            toDate,
            format,
            generatedBy: getGeneratedBy(req),
        });

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(400).json({
            error: error instanceof Error ? error.message : "Không thể tạo tệp xuất dữ liệu",
        });
    }
};
