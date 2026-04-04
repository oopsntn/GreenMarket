import { apiClient } from "../lib/apiClient";
import type {
  Promotion,
  PromotionApiResponse,
  PromotionPackageActionPayload,
  PromotionStatus,
  PromotionSummaryCard,
} from "../types/promotion";

export const promotionService = {
  async getPromotions(): Promise<Promotion[]> {
    return apiClient.request<PromotionApiResponse[]>("/api/admin/promotions", {
      defaultErrorMessage: "Unable to load promotions.",
    });
  },

  async updatePromotionStatus(
    promotions: Promotion[],
    promotionId: number,
    status: PromotionStatus,
  ): Promise<Promotion[]> {
    const updatedPromotion = await apiClient.request<PromotionApiResponse>(
      `/api/admin/promotions/${promotionId}/status`,
      {
        method: "PATCH",
        includeJsonContentType: true,
        defaultErrorMessage: "Unable to update promotion status.",
        body: JSON.stringify({ status }),
      },
    );

    return promotions.map((promotion) =>
      promotion.id === promotionId ? updatedPromotion : promotion,
    );
  },

  canPausePromotion(promotion: Promotion) {
    return promotion.status === "Active" && promotion.canPause;
  },

  canResumePromotion(promotion: Promotion) {
    return promotion.status === "Paused" && promotion.canResume;
  },

  canReopenPromotion(promotion: Promotion) {
    return (
      promotion.status === "Expired" &&
      promotion.paymentStatus === "Paid" &&
      promotion.reopenEligible
    );
  },

  async changePromotionPackage(
    promotions: Promotion[],
    promotionId: number,
    payload: PromotionPackageActionPayload,
  ) {
    const updatedPromotion = await apiClient.request<PromotionApiResponse>(
      `/api/admin/promotions/${promotionId}/package`,
      {
        method: "PATCH",
        includeJsonContentType: true,
        defaultErrorMessage: "Unable to change promotion package.",
        body: JSON.stringify({
          packageId: payload.packageId,
          startDate: payload.startDate,
          endDate: payload.endDate,
          paymentStatus: payload.paymentStatus,
          adminNote: payload.adminNote,
        }),
      },
    );

    return promotions.map((promotion) =>
      promotion.id === promotionId ? updatedPromotion : promotion,
    );
  },

  async reopenPromotion(
    promotions: Promotion[],
    promotionId: number,
    payload: PromotionPackageActionPayload,
  ) {
    const updatedPromotion = await apiClient.request<PromotionApiResponse>(
      `/api/admin/promotions/${promotionId}/reopen`,
      {
        method: "PATCH",
        includeJsonContentType: true,
        defaultErrorMessage: "Unable to reopen promotion.",
        body: JSON.stringify({
          packageId: payload.packageId,
          startDate: payload.startDate,
          endDate: payload.endDate,
          paymentStatus: payload.paymentStatus,
          adminNote: payload.adminNote,
        }),
      },
    );

    return promotions.map((promotion) =>
      promotion.id === promotionId ? updatedPromotion : promotion,
    );
  },

  getActionBlockedReason(
    promotion: Promotion,
    action: "pause" | "resume" | "reopen",
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

    if (action === "reopen") {
      if (promotion.status !== "Expired") {
        return "Only expired promotions can be reopened.";
      }

      if (promotion.paymentStatus !== "Paid") {
        return "Admin can reopen only after payment has been confirmed.";
      }

      return (
        promotion.reopenBlockedReason ??
        "This promotion is not eligible for reopen right now."
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
