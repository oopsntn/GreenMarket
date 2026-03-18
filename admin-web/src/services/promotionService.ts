import { initialPromotions } from "../mock-data/promotions";
import type { Promotion, PromotionStatus } from "../types/promotion";

export const promotionService = {
  getPromotions(): Promotion[] {
    return initialPromotions;
  },

  updatePromotionStatus(
    promotions: Promotion[],
    promotionId: number,
    status: PromotionStatus,
  ): Promotion[] {
    return promotions.map((promotion) =>
      promotion.id === promotionId ? { ...promotion, status } : promotion,
    );
  },
};
