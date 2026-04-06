import { Request, Response } from "express";
import { adminPromotionService } from "../../services/adminPromotion.service.ts";
import { parseId } from "../../utils/parseId";

export const getPromotions = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const promotions = await adminPromotionService.getPromotions();
        res.json(promotions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getPromotionById = async (
    req: Request<{ id: string }>,
    res: Response,
): Promise<void> => {
    try {
        const promotionId = parseId(req.params.id);
        if (promotionId === null) {
            res.status(400).json({ error: "Invalid promotion id" });
            return;
        }

        const promotion = await adminPromotionService.getPromotionById(promotionId);
        if (!promotion) {
            res.status(404).json({ error: "Promotion not found" });
            return;
        }

        res.json(promotion);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const updatePromotionStatus = async (
    req: Request<{ id: string }, {}, { status?: "Active" | "Paused" }>,
    res: Response,
): Promise<void> => {
    try {
        const promotionId = parseId(req.params.id);
        if (promotionId === null) {
            res.status(400).json({ error: "Invalid promotion id" });
            return;
        }

        const { status } = req.body;
        if (status !== "Active" && status !== "Paused") {
            res.status(400).json({ error: "status must be Active or Paused" });
            return;
        }

        const promotion = await adminPromotionService.updatePromotionStatus(
            promotionId,
            status,
        );

        if (!promotion) {
            res.status(404).json({ error: "Promotion not found" });
            return;
        }

        res.json(promotion);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const changePromotionPackage = async (
    req: Request<
        { id: string },
        {},
        {
            packageId?: number;
            startDate?: string;
            endDate?: string;
            paymentStatus?: "Paid" | "Pending Verification";
            adminNote?: string;
        }
    >,
    res: Response,
): Promise<void> => {
    try {
        const promotionId = parseId(req.params.id);
        if (promotionId === null) {
            res.status(400).json({ error: "Invalid promotion id" });
            return;
        }

        const { packageId, startDate, endDate, paymentStatus, adminNote } = req.body;

        if (!packageId || !startDate || !endDate || !paymentStatus) {
            res.status(400).json({
                error: "packageId, startDate, endDate, and paymentStatus are required",
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
        );

        if (!promotion) {
            res.status(404).json({ error: "Promotion not found" });
            return;
        }

        res.json(promotion);
    } catch (error) {
        console.error(error);
        res.status(400).json({
            error: error instanceof Error ? error.message : "Unable to change promotion package",
        });
    }
};

export const reopenPromotion = async (
    req: Request<
        { id: string },
        {},
        {
            packageId?: number;
            startDate?: string;
            endDate?: string;
            paymentStatus?: "Paid" | "Pending Verification";
            adminNote?: string;
        }
    >,
    res: Response,
): Promise<void> => {
    try {
        const promotionId = parseId(req.params.id);
        if (promotionId === null) {
            res.status(400).json({ error: "Invalid promotion id" });
            return;
        }

        const { packageId, startDate, endDate, paymentStatus, adminNote } = req.body;

        if (!packageId || !startDate || !endDate || !paymentStatus) {
            res.status(400).json({
                error: "packageId, startDate, endDate, and paymentStatus are required",
            });
            return;
        }

        const promotion = await adminPromotionService.reopenPromotion(
            promotionId,
            {
                packageId,
                startDate,
                endDate,
                paymentStatus,
                adminNote,
            },
        );

        if (!promotion) {
            res.status(404).json({ error: "Promotion not found" });
            return;
        }

        res.json(promotion);
    } catch (error) {
        console.error(error);
        res.status(400).json({
            error: error instanceof Error ? error.message : "Unable to reopen promotion",
        });
    }
};
