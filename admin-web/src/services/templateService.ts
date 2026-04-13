import { apiClient } from "../lib/apiClient";

export type TemplateType = "Rejection Reason" | "Report Reason" | "Notification";
export type TemplateStatus = "Active" | "Disabled";

export type Template = {
  id: number;
  name: string;
  type: TemplateType;
  content: string;
  status: TemplateStatus;
  updatedDate: string;
};

type TemplateListParams = {
  search?: string;
  page?: number;
  pageSize?: number;
};

type TemplateListResponse = {
  data: Template[];
  total: number;
  page: number;
  pageSize: number;
};

type TemplateApiItem = {
  id: number;
  templateName: string;
  templateType: TemplateType;
  templateContent: string;
  status: TemplateStatus;
  updatedAt?: string;
};

type TemplateApiResponse = {
  data: TemplateApiItem[];
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
};

export type CreateTemplatePayload = {
  name: string;
  type: TemplateType;
  content: string;
};

export type UpdateTemplatePayload = CreateTemplatePayload;

const TEMPLATE_BASE_PATH = "/admin/templates";

function normalizeDate(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString().slice(0, 10);
}

function mapTemplate(item: TemplateApiItem): Template {
  return {
    id: item.id,
    name: item.templateName?.trim() || "Mau chua dat ten",
    type: item.templateType,
    content: item.templateContent ?? "",
    status: item.status,
    updatedDate: normalizeDate(item.updatedAt),
  };
}

function buildTemplatePayload(payload: CreateTemplatePayload | UpdateTemplatePayload): TemplatePayload {
  const name = payload.name.trim();
  const content = payload.content.trim();

  if (!name) {
    throw new Error("Ten mau la bat buoc.");
  }

  if (!content) {
    throw new Error("Noi dung mau la bat buoc.");
  }

  return {
    templateName: name,
    templateType: payload.type,
    templateContent: content,
  };
}

function resolveApiError(error: unknown, fallbackMessage: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

export const templateService = {
  async getTemplates(params: TemplateListParams = {}): Promise<TemplateListResponse> {
    try {
      const query = new URLSearchParams();

      if (params.search?.trim()) {
        query.set("search", params.search.trim());
      }

      query.set("page", String(params.page ?? 1));
      query.set("limit", String(params.pageSize ?? 10));

      const path = `${TEMPLATE_BASE_PATH}?${query.toString()}`;
      const response = await apiClient.get<TemplateApiResponse>(path);

      const data = response.data ?? [];
      const pagination = response.pagination ?? {};

      return {
        data: data.map(mapTemplate),
        total: pagination.total ?? data.length,
        page: pagination.page ?? (params.page ?? 1),
        pageSize: pagination.limit ?? (params.pageSize ?? 10),
      };
    } catch (error) {
      throw new Error(resolveApiError(error, "Khong the tai danh sach mau."));
    }
  },

  async createTemplate(payload: CreateTemplatePayload): Promise<Template> {
    try {
      const body = buildTemplatePayload(payload);
      const response = await apiClient.post<TemplateApiDetailResponse>(TEMPLATE_BASE_PATH, body);
      return mapTemplate(response.data);
    } catch (error) {
      throw new Error(resolveApiError(error, "Khong the tao mau moi."));
    }
  },

  async updateTemplate(templateId: number, payload: UpdateTemplatePayload): Promise<Template> {
    try {
      const body = buildTemplatePayload(payload);
      const response = await apiClient.put<TemplateApiDetailResponse>(`${TEMPLATE_BASE_PATH}/${templateId}`, body);
      return mapTemplate(response.data);
    } catch (error) {
      throw new Error(resolveApiError(error, "Khong the cap nhat mau."));
    }
  },

  async updateTemplateStatus(templateId: number, status: TemplateStatus): Promise<Template> {
    try {
      const response = await apiClient.patch<TemplateApiDetailResponse>(
        `${TEMPLATE_BASE_PATH}/${templateId}/status`,
        { status },
      );

      return mapTemplate(response.data);
    } catch (error) {
      throw new Error(resolveApiError(error, "Khong the cap nhat trang thai mau."));
    }
  },
};
