import { apiClient } from "../lib/apiClient";
import type {
  Template,
  TemplateFormState,
  TemplateListParams,
  TemplateListResponse,
  TemplateStatus,
  TemplateType,
} from "../types/template";

type TemplateApiItem = {
  id: number;
  templateName: string;
  templateType: TemplateType;
  templateContent: string;
  status: TemplateStatus;
  description?: string;
  usageNote?: string;
  updatedAt?: string;
  updatedLabel?: string;
};

type TemplateApiListResponse = {
  data?: TemplateApiItem[];
  pagination?: {
    total?: number;
    page?: number;
    limit?: number;
  };
};

type TemplateApiDetailResponse = {
  data: TemplateApiItem;
};

type TemplatePayload = {
  templateName: string;
  templateType: TemplateType;
  templateContent: string;
  description: string;
  usageNote: string;
  status: TemplateStatus;
};

const TEMPLATE_BASE_PATH = "/api/admin/templates";

const TEMPLATE_NAME_LABELS: Record<string, string> = {
  "Internal Moderation Escalation": "Điều phối kiểm duyệt nội bộ",
  "Notification - Promotion Reopened": "Thông báo - Mở lại chiến dịch quảng bá",
  "Notification - Payment Verification": "Thông báo - Xác minh thanh toán",
  "Notification - Export Completed": "Thông báo - Xuất dữ liệu hoàn tất",
  "Post Rejection - Invalid Content": "Từ chối bài đăng - Nội dung không hợp lệ",
  "Post Rejection - Missing Information": "Từ chối bài đăng - Thiếu thông tin",
  "Report Reason - Spam Content": "Lý do báo cáo - Nội dung spam",
  "Report Reason - Suspicious Pricing": "Lý do báo cáo - Giá bán bất thường",
};

const TEXT_REPLACEMENTS: Array<[string, string]> = [
  [
    "This case has been escalated to the moderation lead for manual review because it affects promotion delivery quality or moderation integrity.",
    "Trường hợp này đã được chuyển lên đầu mối kiểm duyệt để rà soát thủ công vì ảnh hưởng tới chất lượng quảng bá hoặc tính toàn vẹn của quy trình kiểm duyệt.",
  ],
  [
    "This case has been escalated to the moderation lead for manual review because it affects promotion delivery quality or marketplace safety.",
    "Trường hợp này đã được chuyển lên đầu mối kiểm duyệt để rà soát thủ công vì ảnh hưởng đến chất lượng phân phối quảng bá hoặc mức độ an toàn của sàn.",
  ],
  [
    "Your expired promotion has been reopened after payment verification. Delivery resumes immediately in the assigned placement slot.",
    "Chiến dịch đã hết hạn của bạn đã được mở lại sau khi thanh toán được xác minh. Việc phân phối sẽ tiếp tục ngay ở vị trí hiển thị đã gán.",
  ],
  [
    "We received your transfer confirmation. GreenMarket admin is verifying the payment before reopening or updating your promotion.",
    "GreenMarket đã nhận xác nhận chuyển khoản. Quản trị viên đang kiểm tra thanh toán trước khi mở lại hoặc cập nhật chiến dịch của bạn.",
  ],
  [
    "We received your transfer confirmation. GreenMarket admin is verifying the payment before reopening or updating your promotion package.",
    "GreenMarket đã nhận xác nhận chuyển khoản. Quản trị viên đang kiểm tra thanh toán trước khi mở lại hoặc cập nhật gói quảng bá của bạn.",
  ],
  [
    "Your requested admin export has finished successfully. Download the generated report from the export history screen.",
    "Yêu cầu xuất dữ liệu quản trị đã hoàn tất thành công. Hãy tải báo cáo tại màn lịch sử xuất dữ liệu.",
  ],
  [
    "Your post violates GreenMarket content policy because the uploaded media does not match the listing details. Please review and update before resubmitting.",
    "Bài đăng của bạn vi phạm chính sách nội dung của GreenMarket vì hình ảnh hoặc video tải lên không khớp với thông tin niêm yết. Vui lòng chỉnh sửa rồi gửi lại.",
  ],
  [
    "Your post violates GreenMarket content policy because the uploaded media does not match the listing details. Please revise the content and submit again.",
    "Bài đăng của bạn vi phạm chính sách nội dung của GreenMarket vì hình ảnh hoặc video tải lên không khớp với thông tin niêm yết. Vui lòng chỉnh sửa nội dung rồi gửi lại.",
  ],
  [
    "Your post is missing required information such as care notes, product condition, or delivery scope. Please complete the missing fields and submit again.",
    "Bài đăng của bạn đang thiếu thông tin bắt buộc như ghi chú chăm sóc, tình trạng sản phẩm hoặc phạm vi giao hàng. Vui lòng bổ sung rồi gửi lại.",
  ],
  [
    "Your post is missing required information such as care notes, product size, or accurate pricing. Please complete the details before resubmitting.",
    "Bài đăng của bạn đang thiếu thông tin bắt buộc như hướng dẫn chăm sóc, kích thước sản phẩm hoặc giá bán chính xác. Vui lòng bổ sung đầy đủ trước khi gửi lại.",
  ],
  [
    "This listing appears to contain repetitive promotional messaging, external contact spam, or misleading attention bait.",
    "Bài đăng này có dấu hiệu lặp lại nội dung quảng bá, chèn thông tin liên hệ ngoài hệ thống hoặc sử dụng câu chữ gây hiểu nhầm để thu hút chú ý.",
  ],
  [
    "This listing price deviates significantly from comparable marketplace items and should be reviewed manually by the moderation team.",
    "Mức giá của bài đăng này chênh lệch đáng kể so với các bài tương tự trên sàn và cần được đội kiểm duyệt xem xét thủ công.",
  ],
  [
    "Used for system notifications, reminders, or generic status updates.",
    "Dùng cho thông báo hệ thống, nhắc việc hoặc cập nhật trạng thái chung.",
  ],
  [
    "Use when admins need to return a clear rejection reason so the user can revise and submit again.",
    "Dùng khi admin cần trả về lý do từ chối rõ ràng để người dùng chỉnh sửa và gửi lại.",
  ],
];

const normalizeDate = (value?: string, label?: string) => {
  if (label?.trim()) {
    return label;
  }

  if (!value) {
    return "--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const translateText = (value: string | null | undefined, fallback: string) => {
  const normalized = value?.trim();
  if (!normalized) {
    return fallback;
  }

  const direct = TEMPLATE_NAME_LABELS[normalized];
  if (direct) {
    return direct;
  }

  return TEXT_REPLACEMENTS.reduce(
    (result, [source, target]) => result.replaceAll(source, target),
    normalized,
  );
};

const mapTemplate = (item: TemplateApiItem): Template => ({
  id: item.id,
  name: translateText(item.templateName, "Mẫu chưa đặt tên"),
  type: item.templateType,
  content: translateText(item.templateContent, ""),
  status: item.status,
  description: translateText(item.description, "Chưa có mô tả ngắn."),
  usageNote: translateText(item.usageNote, "Chưa có hướng dẫn sử dụng."),
  updatedAt: normalizeDate(item.updatedAt, item.updatedLabel),
});

const resolveApiError = (error: unknown, fallbackMessage: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
};

const buildTemplatePayload = (payload: TemplateFormState): TemplatePayload => {
  const name = payload.name.trim();
  const content = payload.content.trim();
  const description = payload.description.trim();
  const usageNote = payload.usageNote.trim();

  if (!name) {
    throw new Error("Tên mẫu là bắt buộc.");
  }

  if (!content) {
    throw new Error("Nội dung mẫu là bắt buộc.");
  }

  if (!description) {
    throw new Error("Mô tả ngắn là bắt buộc.");
  }

  if (!usageNote) {
    throw new Error("Hướng dẫn sử dụng là bắt buộc.");
  }

  return {
    templateName: name,
    templateType: payload.type,
    templateContent: content,
    description,
    usageNote,
    status: payload.status,
  };
};

export const templateService = {
  async getTemplates(
    params: TemplateListParams = {},
  ): Promise<TemplateListResponse> {
    try {
      const query = new URLSearchParams();

      if (params.search?.trim()) {
        query.set("search", params.search.trim());
      }

      if (params.type && params.type !== "All") {
        query.set("type", params.type);
      }

      if (params.status && params.status !== "All") {
        query.set("status", params.status);
      }

      query.set("page", String(params.page ?? 1));
      query.set("limit", String(params.pageSize ?? 10));

      const response = await apiClient.request<TemplateApiListResponse>(
        `${TEMPLATE_BASE_PATH}?${query.toString()}`,
        {
          defaultErrorMessage: "Không thể tải danh sách mẫu nội dung.",
        },
      );

      const data = response.data ?? [];
      const pagination = response.pagination ?? {};

      return {
        data: data.map(mapTemplate),
        total: pagination.total ?? data.length,
        page: pagination.page ?? (params.page ?? 1),
        pageSize: pagination.limit ?? (params.pageSize ?? 10),
      };
    } catch (error) {
      throw new Error(
        resolveApiError(error, "Không thể tải danh sách mẫu nội dung."),
      );
    }
  },

  async createTemplate(payload: TemplateFormState): Promise<Template> {
    try {
      const response = await apiClient.request<TemplateApiDetailResponse>(
        TEMPLATE_BASE_PATH,
        {
          method: "POST",
          includeJsonContentType: true,
          defaultErrorMessage: "Không thể tạo mẫu nội dung mới.",
          body: JSON.stringify(buildTemplatePayload(payload)),
        },
      );

      return mapTemplate(response.data);
    } catch (error) {
      throw new Error(resolveApiError(error, "Không thể tạo mẫu nội dung mới."));
    }
  },

  async updateTemplate(
    templateId: number,
    payload: TemplateFormState,
  ): Promise<Template> {
    try {
      const response = await apiClient.request<TemplateApiDetailResponse>(
        `${TEMPLATE_BASE_PATH}/${templateId}`,
        {
          method: "PUT",
          includeJsonContentType: true,
          defaultErrorMessage: "Không thể cập nhật mẫu nội dung.",
          body: JSON.stringify(buildTemplatePayload(payload)),
        },
      );

      return mapTemplate(response.data);
    } catch (error) {
      throw new Error(resolveApiError(error, "Không thể cập nhật mẫu nội dung."));
    }
  },

  async cloneTemplate(templateId: number): Promise<Template> {
    try {
      const response = await apiClient.request<TemplateApiDetailResponse>(
        `${TEMPLATE_BASE_PATH}/${templateId}/clone`,
        {
          method: "POST",
          defaultErrorMessage: "Không thể nhân bản mẫu nội dung.",
        },
      );

      return mapTemplate(response.data);
    } catch (error) {
      throw new Error(resolveApiError(error, "Không thể nhân bản mẫu nội dung."));
    }
  },

  async updateTemplateStatus(
    templateId: number,
    status: TemplateStatus,
  ): Promise<Template> {
    try {
      const response = await apiClient.request<TemplateApiDetailResponse>(
        `${TEMPLATE_BASE_PATH}/${templateId}/status`,
        {
          method: "PATCH",
          includeJsonContentType: true,
          defaultErrorMessage: "Không thể cập nhật trạng thái mẫu nội dung.",
          body: JSON.stringify({ status }),
        },
      );

      return mapTemplate(response.data);
    } catch (error) {
      throw new Error(
        resolveApiError(error, "Không thể cập nhật trạng thái mẫu nội dung."),
      );
    }
  },
};
