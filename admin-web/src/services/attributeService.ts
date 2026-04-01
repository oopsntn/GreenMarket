import type {
  Attribute,
  AttributeApiResponse,
  AttributeFormState,
  AttributeStatus,
  AttributeType,
} from "../types/attribute";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:5000";

const getAdminToken = () => {
  return (
    localStorage.getItem("adminToken") ||
    sessionStorage.getItem("adminToken") ||
    ""
  );
};

const buildHeaders = () => {
  const token = getAdminToken();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const formatDate = (value: string | null) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

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

const parseOptionsText = (value: string): string[] => {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const mapApiAttributeToUi = (item: AttributeApiResponse): Attribute => {
  return {
    id: item.attributeId,
    name: item.attributeTitle?.trim() || "Untitled Attribute",
    code: item.attributeCode?.trim() || "",
    type: mapApiTypeToUiType(item.attributeDataType),
    usedIn: [],
    status: item.attributePublished ? "Active" : "Disabled",
    createdAt: formatDate(item.attributeCreatedAt),
    options: normalizeOptions(item.attributeOptions),
  };
};

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...buildHeaders(),
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    let errorMessage = "Request failed.";

    try {
      const errorData = (await response.json()) as { error?: string };
      errorMessage = errorData.error || errorMessage;
    } catch {
      // ignore parse error
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error("Your admin session has expired or is not authorized.");
    }

    throw new Error(errorMessage);
  }

  return (await response.json()) as T;
};

export const attributeService = {
  getEmptyForm(): AttributeFormState {
    return {
      name: "",
      code: "",
      type: "Text",
      optionsText: "",
    };
  },

  async getAttributes(): Promise<Attribute[]> {
    const data = await request<AttributeApiResponse[]>("/api/admin/attributes");
    return data.map(mapApiAttributeToUi);
  },

  async createAttribute(formData: AttributeFormState): Promise<Attribute> {
    const options =
      formData.type === "Select" ? parseOptionsText(formData.optionsText) : [];

    const payload = {
      attributeTitle: formData.name.trim(),
      attributeCode: formData.code.trim() || undefined,
      attributeDataType: mapUiTypeToApiType(formData.type),
      attributeOptions: formData.type === "Select" ? options : null,
      attributePublished: true,
    };

    const data = await request<AttributeApiResponse>("/api/admin/attributes", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return mapApiAttributeToUi(data);
  },

  async updateAttribute(
    attributeId: number,
    formData: AttributeFormState,
    currentStatus: AttributeStatus,
  ): Promise<Attribute> {
    const options =
      formData.type === "Select" ? parseOptionsText(formData.optionsText) : [];

    const payload = {
      attributeTitle: formData.name.trim(),
      attributeCode: formData.code.trim() || undefined,
      attributeDataType: mapUiTypeToApiType(formData.type),
      attributeOptions: formData.type === "Select" ? options : null,
      attributePublished: currentStatus === "Active",
    };

    const data = await request<AttributeApiResponse>(
      `/api/admin/attributes/${attributeId}`,
      {
        method: "PUT",
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

    const data = await request<AttributeApiResponse>(
      `/api/admin/attributes/${attributeId}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    );

    return mapApiAttributeToUi(data);
  },
};
