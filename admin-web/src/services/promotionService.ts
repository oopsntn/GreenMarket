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
      defaultErrorMessage: "Không thể tải danh sách chiến dịch quảng bá.",
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
        defaultErrorMessage:
          "Không thể cập nhật trạng thái chiến dịch quảng bá.",
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
        defaultErrorMessage: "Không thể đổi gói quảng bá.",
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
        defaultErrorMessage: "Không thể mở lại chiến dịch quảng bá.",
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
        return "Chỉ có thể tạm dừng chiến dịch đang chạy.";
      }

      return (
        promotion.pauseBlockedReason ??
        "Chiến dịch này hiện chưa đủ điều kiện để tạm dừng."
      );
    }

    if (action === "reopen") {
      if (promotion.status !== "Expired") {
        return "Chỉ có thể mở lại chiến dịch đã hết hạn.";
      }

      if (promotion.paymentStatus !== "Paid") {
        return "Chỉ mở lại sau khi thanh toán đã được xác nhận.";
      }

      return (
        promotion.reopenBlockedReason ??
        "Chiến dịch này hiện chưa đủ điều kiện để mở lại."
      );
    }

    if (promotion.status !== "Paused") {
      return "Chỉ có thể tiếp tục chiến dịch đang tạm dừng.";
    }

    return (
      promotion.resumeBlockedReason ??
      "Chiến dịch này hiện chưa đủ điều kiện để tiếp tục."
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
        title: "Tổng chiến dịch",
        value: String(promotions.length),
        subtitle: "Tất cả chiến dịch quảng bá đang theo dõi",
      },
      {
        title: "Đang chạy",
        value: String(activeCount),
        subtitle: "Đang sử dụng vị trí hiển thị",
      },
      {
        title: "Tạm dừng",
        value: String(pausedCount),
        subtitle: "Đã bị quản trị viên tạm dừng",
      },
      {
        title: "Lên lịch / Hết hạn",
        value: `${scheduledCount} / ${expiredCount}`,
        subtitle: "Tương quan giữa chiến dịch sắp chạy và đã kết thúc",
      },
    ];
  },
};
