import { initialPromotions } from "../mock-data/promotions";
import type {
  Promotion,
  PromotionStatus,
  PromotionSummaryCard,
} from "../types/promotion";

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

  getSummaryCards(promotions: Promotion[]): PromotionSummaryCard[] {
    const activeCount = promotions.filter(
      (promotion) => promotion.status === "Active",
    ).length;
    const pausedCount = promotions.filter(
      (promotion) => promotion.status === "Paused",
    ).length;
    const scheduledCount = promotions.filter(
      (promotion) => promotion.status === "Scheduled",
    ).length;
    const expiredCount = promotions.filter(
      (promotion) => promotion.status === "Expired",
    ).length;

    return [
      {
        title: "Total Promotions",
        value: String(promotions.length),
        subtitle: "All tracked promotion packages",
      },
      {
        title: "Active Promotions",
        value: String(activeCount),
        subtitle: "Currently consuming placement inventory",
      },
      {
        title: "Paused Promotions",
        value: String(pausedCount),
        subtitle: "Temporarily stopped by admin action",
      },
      {
        title: "Scheduled / Expired",
        value: `${scheduledCount} / ${expiredCount}`,
        subtitle: "Upcoming campaigns and completed packages",
      },
    ];
  },
};
