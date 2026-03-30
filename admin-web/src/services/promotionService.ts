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
    return promotions.map((promotion) => {
      if (promotion.id !== promotionId) return promotion;

      if (status === "Paused") {
        return {
          ...promotion,
          status: "Paused",
          canPause: false,
          canResume: true,
          pauseBlockedReason: "This promotion is already paused.",
          resumeBlockedReason: undefined,
        };
      }

      if (status === "Active") {
        return {
          ...promotion,
          status: "Active",
          canPause: true,
          canResume: false,
          pauseBlockedReason: undefined,
          resumeBlockedReason:
            "This promotion is already active and does not need resume action.",
        };
      }

      return {
        ...promotion,
        status,
      };
    });
  },

  canPausePromotion(promotion: Promotion) {
    return promotion.status === "Active" && promotion.canPause;
  },

  canResumePromotion(promotion: Promotion) {
    return promotion.status === "Paused" && promotion.canResume;
  },

  getActionBlockedReason(
    promotion: Promotion,
    action: "pause" | "resume",
  ): string {
    if (action === "pause") {
      if (promotion.status !== "Active") {
        return "Only active promotions can be paused.";
      }

      return (
        promotion.pauseBlockedReason ??
        "This promotion is not eligible for pause right now."
      );
    }

    if (promotion.status !== "Paused") {
      return "Only paused promotions can be resumed.";
    }

    return (
      promotion.resumeBlockedReason ??
      "This promotion is not eligible for resume right now."
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
