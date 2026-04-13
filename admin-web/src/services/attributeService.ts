import { apiClient } from "../lib/apiClient";
import type {
  Attribute,
  AttributeApiResponse,
  AttributeFormState,
  AttributeStatus,
  AttributeType,
} from "../types/attribute";

const formatDate = (value: string | null) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
};

const normalizeText = (value: string) => value.trim().toLowerCase();

const normalizeCode = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const mapApiTypeToUiType = (value: string | null): AttributeType => {
  switch ((value || "").toLowerCase()) {
    case "number":
      return "Number";
    case "select":
      return "Select";
    case "boolean":
      return "Boolean";
    case "text":
    default:
      return "Text";
  }
};

const mapUiTypeToApiType = (value: AttributeType) => value.toLowerCase();

const normalizeOptions = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => String(item).trim())
    .filter((item) => item.length > 0);
};

const parseOptionsText = (value: string): string[] =>
  Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    ),
  );

const mapApiAttributeToUi = (item: AttributeApiResponse): Attribute => ({
  id: item.attributeId,
  name: item.attributeTitle?.trim() || "Thuộc tính chưa đặt tên",
  code: item.attributeCode?.trim() || "",
  type: mapApiTypeToUiType(item.attributeDataType),
  usedIn: [],
  status: item.attributePublished ? "Active" : "Disabled",
  createdAt: formatDate(item.attributeCreatedAt),
  options: normalizeOptions(item.attributeOptions),
});

export const attributeService = {
  getEmptyForm(): AttributeFormState {
    return {
      name: "",
      code: "",
      type: "Text",
      optionsText: "",
    };
  },

  buildCode(name: string, code: string) {
    return normalizeCode(code || name);
  },

  validateAttributeForm(
    attributes: Attribute[],
    formData: AttributeFormState,
    selectedAttributeId?: number | null,
  ) {
    if (!formData.name.trim()) {
      throw new Error("Tên thuộc tính là bắt buộc.");
    }

    const nextCode = this.buildCode(formData.name, formData.code);

    if (!nextCode) {
      throw new Error("Không thể tạo mã thuộc tính từ dữ liệu hiện tại.");
    }

    if (
      formData.type === "Select" &&
      parseOptionsText(formData.optionsText).length === 0
    ) {
      throw new Error("Thuộc tính kiểu chọn sẵn phải có ít nhất một lựa chọn.");
    }

    const duplicateName = attributes.some((attribute) => {
      if (selectedAttributeId && attribute.id === selectedAttributeId) {
        return false;
      }

      return normalizeText(attribute.name) === normalizeText(formData.name);
    });

    if (duplicateName) {
      throw new Error("Đã có thuộc tính khác sử dụng tên này.");
    }

    const duplicateCode = attributes.some((attribute) => {
      if (selectedAttributeId && attribute.id === selectedAttributeId) {
        return false;
      }

      return normalizeText(attribute.code) === normalizeText(nextCode);
    });

    if (duplicateCode) {
      throw new Error("Đã có thuộc tính khác sử dụng mã này.");
    }
  },

  async getAttributes(): Promise<Attribute[]> {
    const data = await apiClient.request<AttributeApiResponse[]>(
      "/api/admin/attributes",
      {
        defaultErrorMessage: "Không thể tải danh sách thuộc tính.",
      },
    );

    return data.map(mapApiAttributeToUi);
  },

  async createAttribute(formData: AttributeFormState): Promise<Attribute> {
    const options =
      formData.type === "Select" ? parseOptionsText(formData.optionsText) : [];
    const code = this.buildCode(formData.name, formData.code);

    const payload = {
      attributeTitle: formData.name.trim(),
      attributeCode: code || undefined,
      attributeDataType: mapUiTypeToApiType(formData.type),
      attributeOptions: formData.type === "Select" ? options : null,
      attributePublished: true,
    };

    const data = await apiClient.request<AttributeApiResponse>(
      "/api/admin/attributes",
      {
        method: "POST",
        includeJsonContentType: true,
        defaultErrorMessage: "Không thể tạo thuộc tính.",
        body: JSON.stringify(payload),
      },
    );

    return mapApiAttributeToUi(data);
  },

  async updateAttribute(
    attributeId: number,
    formData: AttributeFormState,
    currentStatus: AttributeStatus,
  ): Promise<Attribute> {
    const options =
      formData.type === "Select" ? parseOptionsText(formData.optionsText) : [];
    const code = this.buildCode(formData.name, formData.code);

    const payload = {
      attributeTitle: formData.name.trim(),
      attributeCode: code || undefined,
      attributeDataType: mapUiTypeToApiType(formData.type),
      attributeOptions: formData.type === "Select" ? options : null,
      attributePublished: currentStatus === "Active",
    };

    const data = await apiClient.request<AttributeApiResponse>(
      `/api/admin/attributes/${attributeId}`,
      {
        method: "PUT",
        includeJsonContentType: true,
        defaultErrorMessage: "Không thể cập nhật thuộc tính.",
        body: JSON.stringify(payload),
      },
    );

    return mapApiAttributeToUi(data);
  },

  async updateAttributeStatus(
    attributeId: number,
    status: AttributeStatus,
    currentAttribute: Attribute,
  ): Promise<Attribute> {
    const payload = {
      attributeTitle: currentAttribute.name,
      attributeCode: currentAttribute.code || undefined,
      attributeDataType: mapUiTypeToApiType(currentAttribute.type),
      attributeOptions:
        currentAttribute.type === "Select" ? currentAttribute.options : null,
      attributePublished: status === "Active",
    };

    const data = await apiClient.request<AttributeApiResponse>(
      `/api/admin/attributes/${attributeId}`,
      {
        method: "PUT",
        includeJsonContentType: true,
        defaultErrorMessage: "Không thể cập nhật trạng thái thuộc tính.",
        body: JSON.stringify(payload),
      },
    );

    return mapApiAttributeToUi(data);
  },
};
