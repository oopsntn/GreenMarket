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
      defaultErrorMessage: "Không thể tải danh sách đơn quảng bá.",
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
        defaultErrorMessage: "Không thể cập nhật trạng thái đơn quảng bá.",
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

  canChangePromotionPackage(promotion: Promotion) {
    return promotion.paymentStatus !== "Paid";
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
        defaultErrorMessage: "Không thể đổi gói quảng bá cho đơn này.",
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
    const requestBody: Record<string, unknown> = {
      packageId: payload.packageId,
      paymentStatus: payload.paymentStatus,
      adminNote: payload.adminNote,
    };

    if (payload.startDate) {
      requestBody.startDate = payload.startDate;
    }

    if (payload.endDate) {
      requestBody.endDate = payload.endDate;
    }

    const updatedPromotion = await apiClient.request<PromotionApiResponse>(
      `/api/admin/promotions/${promotionId}/reopen`,
      {
        method: "PATCH",
        includeJsonContentType: true,
        defaultErrorMessage: "Không thể mở lại đơn quảng bá đã hết hạn.",
        body: JSON.stringify(requestBody),
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
    if (promotion.status === "Inactive") {
      return "Đơn quảng bá đang ngừng hoạt động vì tài khoản hoặc cửa hàng sở hữu đã bị khóa.";
    }

    if (action === "pause") {
      if (promotion.status !== "Active") {
        return "Chỉ có thể tạm dừng đơn quảng bá đang chạy.";
      }

      return (
        promotion.pauseBlockedReason ??
        "Đơn quảng bá này hiện chưa đủ điều kiện để tạm dừng."
      );
    }

    if (action === "reopen") {
      if (promotion.status !== "Expired") {
        return "Chỉ có thể mở lại đơn quảng bá đã hết hạn.";
      }

      if (promotion.paymentStatus !== "Paid") {
        return "Chỉ mở lại sau khi thanh toán đã được xác nhận.";
      }

      return (
        promotion.reopenBlockedReason ??
        "Đơn quảng bá này hiện chưa đủ điều kiện để mở lại."
      );
    }

    if (promotion.status !== "Paused") {
      return "Chỉ có thể tiếp tục đơn quảng bá đang tạm dừng.";
    }

    return (
      promotion.resumeBlockedReason ??
      "Đơn quảng bá này hiện chưa đủ điều kiện để tiếp tục."
    );
  },

  getChangePackageBlockedReason(promotion: Promotion) {
    if (promotion.status === "Inactive") {
      return "Không thể đổi gói khi tài khoản hoặc cửa hàng sở hữu đang bị khóa.";
    }

    if (promotion.paymentStatus === "Paid") {
      return "Đơn quảng bá đã thanh toán không thể đổi gói hoặc chỉnh lại thời gian chạy. Chỉ đơn chưa thanh toán mới được phép cập nhật các thông tin này.";
    }

    return "Đơn quảng bá này hiện chưa đủ điều kiện để đổi gói.";
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
    const completedCount = promotions.filter(
      (promotion) => promotion.status === "Completed",
    ).length;
    const expiredCount = promotions.filter(
      (promotion) => promotion.status === "Expired",
    ).length;

    return [
      {
        title: "Tổng đơn quảng bá",
        value: String(promotions.length),
        subtitle: "Tất cả đơn mua gói quảng bá đang được theo dõi",
      },
      {
        title: "Đang chạy",
        value: String(activeCount),
        subtitle: "Các đơn đang hiển thị trên vị trí quảng bá",
      },
      {
        title: "Tạm dừng",
        value: String(pausedCount),
        subtitle: "Các đơn đã bị tạm dừng bởi quản trị viên",
      },
      {
        title: "Lên lịch / Hoàn tất / Hết hạn",
        value: `${scheduledCount} / ${completedCount} / ${expiredCount}`,
        subtitle:
          "Tương quan giữa đơn sắp chạy, dùng hết quota và hết thời gian",
      },
    ];
  },
};
