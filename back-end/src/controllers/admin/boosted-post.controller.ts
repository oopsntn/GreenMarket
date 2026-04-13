import { Response } from "express";
import { adminPromotionService } from "../../services/adminPromotion.service.ts";
import { AuthRequest } from "../../dtos/auth.ts";
import { parseId } from "../../utils/parseId";

export const getBoostedPosts = async (
    req: AuthRequest,
    res: Response,
): Promise<void> => {
    try {
        const boostedPosts = await adminPromotionService.getBoostedPosts();
        res.json(boostedPosts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
    }
};

export const getBoostedPostById = async (
    req: AuthRequest & { params: { id: string } },
    res: Response,
): Promise<void> => {
    try {
        const promotionId = parseId(req.params.id);
        if (promotionId === null) {
            res.status(400).json({ error: "Mã chiến dịch không hợp lệ" });
            return;
        }

        const boostedPost = await adminPromotionService.getBoostedPostById(promotionId);
        if (!boostedPost) {
            res.status(404).json({ error: "Không tìm thấy chiến dịch quảng bá" });
            return;
        }

        res.json(boostedPost);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
    }
};

export const updateBoostedPostStatus = async (
    req: AuthRequest & {
        params: { id: string };
        body: { status?: "Active" | "Paused" | "Closed" };
    },
    res: Response,
): Promise<void> => {
    try {
        const promotionId = parseId(req.params.id);
        if (promotionId === null) {
            res.status(400).json({ error: "Mã chiến dịch không hợp lệ" });
            return;
        }

        const { status } = req.body;
        if (status !== "Active" && status !== "Paused" && status !== "Closed") {
            res.status(400).json({ error: "Trạng thái chỉ được là Active, Paused hoặc Closed" });
            return;
        }

        const boostedPost = await adminPromotionService.updateBoostedPostStatus(
            promotionId,
            status,
            req.user?.email ?? null,
        );

        if (!boostedPost) {
            res.status(404).json({ error: "Không tìm thấy chiến dịch quảng bá" });
            return;
        }

        res.json(boostedPost);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
    }
};
