import { apiClient } from "../lib/apiClient";
import type { TemplateBuilderPreset } from "../types/template";

const TEMPLATE_BUILDER_API_PATH = "/api/admin/template-builder/preset";

const defaultPreset: TemplateBuilderPreset = {
  templateName: "Mẫu đăng tin cây cảnh",
  categoryName: "Cây cảnh & Bonsai",
  usageNote:
    "Dùng để xem trước bố cục form đăng tin cho ngành cây cảnh trước khi đưa vào vận hành.",
  previewTitlePlaceholder: "Ví dụ: Sanh mini 8 năm tuổi, dáng trực",
  submitLabel: "Đăng tin cây cảnh (Xem trước)",
  fields: [
    {
      id: "bonsai-style",
      type: "select",
      label: "Dáng cây (Thế cây)",
      placeholder: "Chọn dáng cây",
      helperText:
        "Giúp người đăng mô tả bố cục bonsai theo đúng cách gọi phổ biến.",
      required: true,
      options: ["Trực", "Xiêu", "Huyền", "Hoành", "Văn nhân"],
    },
    {
      id: "pot-type",
      type: "select",
      label: "Loại chậu đi kèm",
      placeholder: "Chọn loại chậu",
      helperText:
        "Thể hiện tình trạng đi kèm chậu để người mua định giá rõ hơn.",
      required: true,
      options: ["Chậu gốm", "Chậu đá", "Bầu đất / túi ươm"],
    },
    {
      id: "tree-age",
      type: "number",
      label: "Tuổi cây (ước lượng)",
      placeholder: "Ví dụ: 8",
      helperText:
        "Dùng để ước lượng độ trưởng thành của cây, hỗ trợ so sánh giá trị.",
      required: false,
      options: [],
    },
  ],
};

const normalizePreset = (
  preset: Partial<TemplateBuilderPreset> | undefined,
): TemplateBuilderPreset => ({
  templateName: preset?.templateName?.trim() || defaultPreset.templateName,
  categoryName: preset?.categoryName?.trim() || defaultPreset.categoryName,
  usageNote: preset?.usageNote?.trim() || defaultPreset.usageNote,
  previewTitlePlaceholder:
    preset?.previewTitlePlaceholder?.trim() ||
    defaultPreset.previewTitlePlaceholder,
  submitLabel: preset?.submitLabel?.trim() || defaultPreset.submitLabel,
  fields:
    Array.isArray(preset?.fields) && preset.fields.length > 0
      ? preset.fields
      : defaultPreset.fields,
});

export const templateBuilderService = {
  async getPreset(): Promise<TemplateBuilderPreset> {
    const response = await apiClient.request<TemplateBuilderPreset>(
      TEMPLATE_BUILDER_API_PATH,
      {
        defaultErrorMessage: "Không thể tải cấu hình trình dựng mẫu.",
      },
    );

    return normalizePreset(response);
  },

  async savePreset(
    preset: TemplateBuilderPreset,
  ): Promise<TemplateBuilderPreset> {
    const response = await apiClient.request<TemplateBuilderPreset>(
      TEMPLATE_BUILDER_API_PATH,
      {
        method: "PUT",
        includeJsonContentType: true,
        defaultErrorMessage: "Không thể lưu cấu hình trình dựng mẫu.",
        body: JSON.stringify(preset),
      },
    );

    return normalizePreset(response);
  },

  async resetPreset(): Promise<TemplateBuilderPreset> {
    const response = await apiClient.request<TemplateBuilderPreset>(
      `${TEMPLATE_BUILDER_API_PATH}/reset`,
      {
        method: "POST",
        defaultErrorMessage: "Không thể khôi phục cấu hình trình dựng mẫu.",
      },
    );

    return normalizePreset(response);
  },

  getDefaultPreset() {
    return normalizePreset(defaultPreset);
  },
};
