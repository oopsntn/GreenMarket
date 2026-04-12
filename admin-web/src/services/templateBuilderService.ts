import { apiClient } from "../lib/apiClient";
import type { TemplateBuilderPreset } from "../types/template";

const TEMPLATE_BUILDER_API_PATH = "/api/admin/template-builder/preset";

const defaultPreset: TemplateBuilderPreset = {
  selectedTemplateId: null,
  selectedTypeFilter: "All",
  channel: "Email",
  audience: "Seller",
  tone: "Supportive",
  shopName: "Green Corner Garden",
  postTitle: "Monstera Deliciosa cần bổ sung thông tin",
  reason: "Bài đăng đang thiếu thông tin bắt buộc.",
  slotName: "Home Top",
  contactEmail: "ops@greenmarket.com",
  adminNote: "Cập nhật nội dung rồi gửi duyệt lại trong vòng 24 giờ.",
};

export const templateBuilderService = {
  getPreset(): Promise<TemplateBuilderPreset> {
    return apiClient.request<TemplateBuilderPreset>(TEMPLATE_BUILDER_API_PATH, {
      defaultErrorMessage: "Không thể tải cấu hình Trình dựng mẫu.",
    });
  },

  savePreset(preset: TemplateBuilderPreset): Promise<TemplateBuilderPreset> {
    return apiClient.request<TemplateBuilderPreset>(TEMPLATE_BUILDER_API_PATH, {
      method: "PUT",
      includeJsonContentType: true,
      defaultErrorMessage: "Không thể lưu cấu hình Trình dựng mẫu.",
      body: JSON.stringify(preset),
    });
  },

  resetPreset(): Promise<TemplateBuilderPreset> {
    return apiClient.request<TemplateBuilderPreset>(
      `${TEMPLATE_BUILDER_API_PATH}/reset`,
      {
        method: "POST",
        defaultErrorMessage: "Không thể đặt lại cấu hình Trình dựng mẫu.",
      },
    );
  },

  getDefaultPreset() {
    return { ...defaultPreset };
  },
};
