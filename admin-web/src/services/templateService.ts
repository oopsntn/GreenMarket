import { apiClient } from "../lib/apiClient";
import type {
  Template,
  TemplateFormState,
  TemplateStatus,
  TemplateType,
} from "../types/template";

type TemplateApiResponse = {
  templateId: number;
  templateName: string | null;
  templateType: string | null;
  templateContent: string | null;
  templateStatus: string | null;
  templateUpdatedAt: string | null;
};

const TEMPLATE_UPDATED_FALLBACK = "—";

const normalizeText = (value: string) => value.trim().toLowerCase();

const formatDate = (value: string | null) => {
  if (!value) return TEMPLATE_UPDATED_FALLBACK;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return TEMPLATE_UPDATED_FALLBACK;

  return date.toISOString().slice(0, 10);
};

const mapApiTypeToUiType = (value: string | null): TemplateType => {
  switch ((value || "").toLowerCase()) {
    case "report reason":
      return "Report Reason";
    case "notification":
      return "Notification";
    case "rejection reason":
    default:
      return "Rejection Reason";
  }
};

const mapUiTypeToApiType = (value: TemplateType) => value;

const mapApiStatusToUiStatus = (value: string | null): TemplateStatus =>
  (value || "").toLowerCase() === "disabled" ? "Disabled" : "Active";

const mapApiTemplateToUi = (item: TemplateApiResponse): Template => {
  return {
    id: item.templateId,
    name: item.templateName?.trim() || "Untitled Template",
    type: mapApiTypeToUiType(item.templateType),
    content: item.templateContent?.trim() || "",
    status: mapApiStatusToUiStatus(item.templateStatus),
    updatedAt: formatDate(item.templateUpdatedAt),
  };
};

export const emptyTemplateForm: TemplateFormState = {
  name: "",
  type: "Rejection Reason",
  content: "",
  status: "Active",
};

export const templateService = {
  getEmptyForm(): TemplateFormState {
    return { ...emptyTemplateForm };
  },

  validateTemplateForm(
    templates: Template[],
    formData: TemplateFormState,
    selectedTemplateId?: number | null,
  ) {
    if (!formData.name.trim()) {
      throw new Error("Template name is required.");
    }

    if (!formData.content.trim()) {
      throw new Error("Template content is required.");
    }

    const hasDuplicate = templates.some((template) => {
      if (selectedTemplateId && template.id === selectedTemplateId) {
        return false;
      }

      return (
        normalizeText(template.name) === normalizeText(formData.name) &&
        template.type === formData.type
      );
    });

    if (hasDuplicate) {
      throw new Error("A template with the same name and type already exists.");
    }
  },

  async getTemplates(): Promise<Template[]> {
    const data = await apiClient.request<TemplateApiResponse[]>(
      "/api/admin/templates",
      {
        defaultErrorMessage: "Unable to load templates.",
      },
    );

    return data.map(mapApiTemplateToUi);
  },

  async createTemplate(formData: TemplateFormState): Promise<Template> {
    const payload = {
      templateName: formData.name.trim(),
      templateType: mapUiTypeToApiType(formData.type),
      templateContent: formData.content.trim(),
      templateStatus: formData.status,
    };

    const data = await apiClient.request<TemplateApiResponse>(
      "/api/admin/templates",
      {
        method: "POST",
        includeJsonContentType: true,
        defaultErrorMessage: "Unable to create template.",
        body: JSON.stringify(payload),
      },
    );

    return mapApiTemplateToUi(data);
  },

  async updateTemplate(
    templateId: number,
    formData: TemplateFormState,
  ): Promise<Template> {
    const payload = {
      templateName: formData.name.trim(),
      templateType: mapUiTypeToApiType(formData.type),
      templateContent: formData.content.trim(),
      templateStatus: formData.status,
    };

    const data = await apiClient.request<TemplateApiResponse>(
      `/api/admin/templates/${templateId}`,
      {
        method: "PUT",
        includeJsonContentType: true,
        defaultErrorMessage: "Unable to update template.",
        body: JSON.stringify(payload),
      },
    );

    return mapApiTemplateToUi(data);
  },

  async updateTemplateStatus(
    templateId: number,
    status: TemplateStatus,
  ): Promise<Template> {
    const data = await apiClient.request<TemplateApiResponse>(
      `/api/admin/templates/${templateId}/status`,
      {
        method: "PATCH",
        includeJsonContentType: true,
        defaultErrorMessage: "Unable to update template status.",
        body: JSON.stringify({
          templateStatus: status,
        }),
      },
    );

    return mapApiTemplateToUi(data);
  },
};
