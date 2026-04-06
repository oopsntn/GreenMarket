import { Request, Response } from "express";
import { adminPromotionService } from "../../services/adminPromotion.service.ts";
import { parseId } from "../../utils/parseId";

export const getBoostedPosts = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const boostedPosts = await adminPromotionService.getBoostedPosts();
        res.json(boostedPosts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getBoostedPostById = async (
    req: Request<{ id: string }>,
    res: Response,
): Promise<void> => {
    try {
        const promotionId = parseId(req.params.id);
        if (promotionId === null) {
            res.status(400).json({ error: "Invalid boosted post id" });
            return;
        }

        const boostedPost = await adminPromotionService.getBoostedPostById(promotionId);
        if (!boostedPost) {
            res.status(404).json({ error: "Boosted post not found" });
            return;
        }

        res.json(boostedPost);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const updateBoostedPostStatus = async (
    req: Request<{ id: string }, {}, { status?: "Active" | "Paused" | "Closed" }>,
    res: Response,
): Promise<void> => {
    try {
        const promotionId = parseId(req.params.id);
        if (promotionId === null) {
            res.status(400).json({ error: "Invalid boosted post id" });
            return;
        }

        const { status } = req.body;
        if (status !== "Active" && status !== "Paused" && status !== "Closed") {
            res.status(400).json({ error: "status must be Active, Paused, or Closed" });
            return;
        }

        const boostedPost = await adminPromotionService.updateBoostedPostStatus(
            promotionId,
            status,
        );

        if (!boostedPost) {
            res.status(404).json({ error: "Boosted post not found" });
            return;
        }

        res.json(boostedPost);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};
