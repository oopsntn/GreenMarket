import { Response } from "express";
import { adminPromotionService } from "../../services/adminPromotion.service";
import { AuthRequest } from "../../dtos/auth";
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
      res.status(400).json({ error: "Mã quảng bá không hợp lệ" });
      return;
    }

    const boostedPost = await adminPromotionService.getBoostedPostById(
      promotionId,
    );
    if (!boostedPost) {
      res.status(404).json({ error: "Không tìm thấy bài đang quảng bá" });
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
    body: { status?: "Active" | "Paused" };
  },
  res: Response,
): Promise<void> => {
  try {
    const promotionId = parseId(req.params.id);
    if (promotionId === null) {
      res.status(400).json({ error: "Mã quảng bá không hợp lệ" });
      return;
    }

    const { status } = req.body;
    if (status !== "Active" && status !== "Paused") {
      res
        .status(400)
        .json({ error: "Trạng thái chỉ được là Active hoặc Paused" });
      return;
    }

    const boostedPost = await adminPromotionService.updateBoostedPostStatus(
      promotionId,
      status,
      req.user?.email ?? null,
    );

    if (!boostedPost) {
      res.status(404).json({ error: "Không tìm thấy bài đang quảng bá" });
      return;
    }

    res.json(boostedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};
