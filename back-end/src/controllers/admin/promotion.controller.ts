import { Response } from "express";
import { adminPromotionService } from "../../services/adminPromotion.service";
import { AuthRequest } from "../../dtos/auth";
import { parseId } from "../../utils/parseId";

export const getPromotions = async (
    req: AuthRequest,
    res: Response,
): Promise<void> => {
    try {
        const promotions = await adminPromotionService.getPromotions();
        res.json(promotions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
    }
};

export const getPromotionById = async (
    req: AuthRequest & { params: { id: string } },
    res: Response,
): Promise<void> => {
    try {
        const promotionId = parseId(req.params.id);
        if (promotionId === null) {
            res.status(400).json({ error: "Mã chiến dịch không hợp lệ" });
            return;
        }

        const promotion = await adminPromotionService.getPromotionById(promotionId);
        if (!promotion) {
            res.status(404).json({ error: "Không tìm thấy chiến dịch quảng bá" });
            return;
        }

        res.json(promotion);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
    }
};

export const updatePromotionStatus = async (
    req: AuthRequest & { params: { id: string }; body: { status?: "Active" | "Paused" } },
    res: Response,
): Promise<void> => {
    try {
        const promotionId = parseId(req.params.id);
        if (promotionId === null) {
            res.status(400).json({ error: "Mã chiến dịch không hợp lệ" });
            return;
        }

        const { status } = req.body;
        if (status !== "Active" && status !== "Paused") {
            res.status(400).json({ error: "Trạng thái chỉ được là Active hoặc Paused" });
            return;
        }

        const promotion = await adminPromotionService.updatePromotionStatus(
            promotionId,
            status,
            req.user?.email ?? null,
        );

        if (!promotion) {
            res.status(404).json({ error: "Không tìm thấy chiến dịch quảng bá" });
            return;
        }

        res.json(promotion);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
    }
};

export const changePromotionPackage = async (
    req: AuthRequest & {
        params: { id: string };
        body: {
            packageId?: number;
            startDate?: string;
            endDate?: string;
            paymentStatus?: "Paid" | "Pending Verification";
            adminNote?: string;
        };
    },
    res: Response,
): Promise<void> => {
    try {
        const promotionId = parseId(req.params.id);
        if (promotionId === null) {
            res.status(400).json({ error: "Mã chiến dịch không hợp lệ" });
            return;
        }

        const { packageId, startDate, endDate, paymentStatus, adminNote } = req.body;

        if (!packageId || !startDate || !endDate || !paymentStatus) {
            res.status(400).json({
                error: "Vui lòng truyền đủ packageId, startDate, endDate và paymentStatus",
            });
            return;
        }

        const promotion = await adminPromotionService.changePromotionPackage(
            promotionId,
            {
                packageId,
                startDate,
                endDate,
                paymentStatus,
                adminNote,
            },
            req.user?.email ?? null,
        );

        if (!promotion) {
            res.status(404).json({ error: "Không tìm thấy chiến dịch quảng bá" });
            return;
        }

        res.json(promotion);
    } catch (error) {
        console.error(error);
        res.status(400).json({
            error: error instanceof Error ? error.message : "Không thể đổi gói quảng bá",
        });
    }
};

export const reopenPromotion = async (
    req: AuthRequest & {
        params: { id: string };
        body: {
            packageId?: number;
            paymentStatus?: "Paid" | "Pending Verification";
            adminNote?: string;
        };
    },
    res: Response,
): Promise<void> => {
    try {
        const promotionId = parseId(req.params.id);
        if (promotionId === null) {
            res.status(400).json({ error: "Mã chiến dịch không hợp lệ" });
            return;
        }

        const { packageId, paymentStatus, adminNote } = req.body;

        if (!packageId || !paymentStatus) {
            res.status(400).json({
                error: "Vui lòng truyền đủ packageId và paymentStatus",
            });
            return;
        }

        const promotion = await adminPromotionService.reopenPromotion(
            promotionId,
            {
                packageId,
                paymentStatus,
                adminNote,
            },
            req.user?.email ?? null,
        );

        if (!promotion) {
            res.status(404).json({ error: "Không tìm thấy chiến dịch quảng bá" });
            return;
        }

        res.json(promotion);
    } catch (error) {
        console.error(error);
        res.status(400).json({
            error: error instanceof Error ? error.message : "Không thể mở lại chiến dịch quảng bá",
        });
    }
};
