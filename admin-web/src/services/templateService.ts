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

const mapTemplate = (item: TemplateApiItem): Template => ({
  id: item.id,
  name: item.templateName?.trim() || "Mẫu chưa đặt tên",
  type: item.templateType,
  content: item.templateContent ?? "",
  status: item.status,
  description: item.description?.trim() || "Chưa có mô tả ngắn.",
  usageNote: item.usageNote?.trim() || "Chưa có hướng dẫn sử dụng.",
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
