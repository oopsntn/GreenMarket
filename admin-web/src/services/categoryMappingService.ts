import { apiClient } from "../lib/apiClient";

export type MappingStatus = "Active" | "Disabled";
export type MappingAttributeType = "Text" | "Number" | "Select" | "Boolean";

export type CategoryAttributeMapping = {
  id: string;
  categoryId: number;
  categoryName: string;
  attributeId: number;
  attributeName: string;
  attributeCode: string;
  attributeType: MappingAttributeType;
  isRequired: boolean;
  displayOrder: number;
  status: MappingStatus;
};

export type CategoryMappingPreviewField = {
  attributeId: number;
  attributeName: string;
  attributeCode: string;
  attributeType: MappingAttributeType;
  isRequired: boolean;
  displayOrder: number;
  placeholder: string;
};

export type CategoryMappingPreview = {
  categoryId: number;
  categoryName: string;
  fields: CategoryMappingPreviewField[];
};

type MappingListParams = {
  search?: string;
  page?: number;
  pageSize?: number;
};

type MappingListResponse = {
  data: CategoryAttributeMapping[];
  total: number;
  page: number;
  pageSize: number;
};

type MappingApiItem = {
  categoryId: number;
  attributeId: number;
  categoryName?: string | null;
  attributeName?: string | null;
  attributeCode?: string | null;
  attributeType?: string | null;
  required?: boolean | null;
  displayOrder?: number | null;
  status?: string | null;
};

type MappingApiWriteResponse = {
  categoryId: number;
  attributeId: number;
  required?: boolean | null;
  displayOrder?: number | null;
  status?: string | null;
};

export type CreateMappingPayload = {
  categoryId: number;
  attributeId: number;
  isRequired: boolean;
  displayOrder: number;
};

export type UpdateMappingPayload = CreateMappingPayload;

const MAX_INTEGER_FIELD = 2_147_483_647;

const CATEGORY_MAPPING_BASE_PATH = "/api/admin/category-mappings";

const normalizeAttributeType = (value: unknown): MappingAttributeType => {
  switch (String(value ?? "").toLowerCase()) {
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

const normalizeStatus = (value: unknown): MappingStatus => {
  return value === "Disabled" ? "Disabled" : "Active";
};

const buildMappingId = (categoryId: number, attributeId: number) =>
  `${categoryId}-${attributeId}`;

function mapMapping(item: MappingApiItem): CategoryAttributeMapping {
  return {
    id: buildMappingId(item.categoryId, item.attributeId),
    categoryId: item.categoryId,
    categoryName: item.categoryName?.trim() || `Danh mục #${item.categoryId}`,
    attributeId: item.attributeId,
    attributeName:
      item.attributeName?.trim() || `Thuộc tính #${item.attributeId}`,
    attributeCode: item.attributeCode?.trim() || `ATTR_${item.attributeId}`,
    attributeType: normalizeAttributeType(item.attributeType),
    isRequired: Boolean(item.required),
    displayOrder: item.displayOrder ?? 1,
    status: normalizeStatus(item.status),
  };
}

function buildMappingPayload(payload: CreateMappingPayload | UpdateMappingPayload) {
  if (!payload.categoryId || !payload.attributeId) {
    throw new Error("Vui lòng chọn cả danh mục và thuộc tính.");
  }

  if (!Number.isInteger(payload.displayOrder) || payload.displayOrder < 1) {
    throw new Error("Thứ tự hiển thị phải lớn hơn hoặc bằng 1.");
  }

  if (payload.displayOrder > MAX_INTEGER_FIELD) {
    throw new Error(
      "Thứ tự hiển thị không được vượt quá 2.147.483.647.",
    );
  }

  return {
    categoryId: payload.categoryId,
    attributeId: payload.attributeId,
    required: Boolean(payload.isRequired),
    displayOrder: payload.displayOrder,
  };
}

function assertUniqueDisplayOrder(params: {
  mappings: CategoryAttributeMapping[];
  categoryId: number;
  displayOrder: number;
  excludeId?: string;
}) {
  const duplicated = params.mappings.some((mapping) => {
    if (params.excludeId && mapping.id === params.excludeId) {
      return false;
    }

    return (
      mapping.categoryId === params.categoryId &&
      mapping.displayOrder === params.displayOrder
    );
  });

  if (duplicated) {
    throw new Error(
      "Thứ tự hiển thị này đã được dùng trong danh mục đã chọn. Vui lòng chọn thứ tự khác.",
    );
  }
}

function resolveApiError(error: unknown, fallbackMessage: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

function buildPreviewPlaceholder(field: {
  attributeName: string;
  attributeCode: string;
}) {
  return `Nhập ${field.attributeName || field.attributeCode}`;
}

export const categoryMappingService = {
  async getMappings(params: MappingListParams = {}): Promise<MappingListResponse> {
    try {
      const rows = await apiClient.request<MappingApiItem[]>(
        CATEGORY_MAPPING_BASE_PATH,
        {
          defaultErrorMessage: "Không thể tải danh sách ánh xạ.",
        },
      );

      const keyword = params.search?.trim().toLowerCase() ?? "";
      const allItems = rows.map(mapMapping);
      const filteredItems = keyword
        ? allItems.filter((item) => {
            const haystack = [
              item.categoryName,
              item.attributeName,
              item.attributeCode,
            ]
              .join(" ")
              .toLowerCase();

            return haystack.includes(keyword);
          })
        : allItems;

      const page = params.page ?? 1;
      const pageSize = params.pageSize ?? 10;
      const start = (page - 1) * pageSize;
      const data = filteredItems.slice(start, start + pageSize);

      return {
        data,
        total: filteredItems.length,
        page,
        pageSize,
      };
    } catch (error) {
      throw new Error(resolveApiError(error, "Không thể tải danh sách ánh xạ."));
    }
  },

  async createMapping(payload: CreateMappingPayload): Promise<CategoryAttributeMapping> {
    try {
      const body = buildMappingPayload(payload);
      const response = await apiClient.request<MappingApiWriteResponse>(
        CATEGORY_MAPPING_BASE_PATH,
        {
          method: "POST",
          includeJsonContentType: true,
          defaultErrorMessage: "Không thể tạo ánh xạ mới.",
          body: JSON.stringify(body),
        },
      );

      return mapMapping({
        ...response,
        categoryName: null,
        attributeName: null,
        attributeCode: null,
        attributeType: null,
      });
    } catch (error) {
      throw new Error(resolveApiError(error, "Không thể tạo ánh xạ mới."));
    }
  },

  validateUniqueDisplayOrder(
    mappings: CategoryAttributeMapping[],
    payload: Pick<CreateMappingPayload, "categoryId" | "displayOrder">,
    excludeId?: string,
  ) {
    assertUniqueDisplayOrder({
      mappings,
      categoryId: payload.categoryId,
      displayOrder: payload.displayOrder,
      excludeId,
    });
  },

  async updateMapping(
    currentMapping: Pick<CategoryAttributeMapping, "categoryId" | "attributeId">,
    payload: UpdateMappingPayload,
  ): Promise<CategoryAttributeMapping> {
    try {
      const body = buildMappingPayload(payload);
      const response = await apiClient.request<MappingApiWriteResponse>(
        `${CATEGORY_MAPPING_BASE_PATH}/${currentMapping.categoryId}/${currentMapping.attributeId}`,
        {
          method: "PUT",
          includeJsonContentType: true,
          defaultErrorMessage: "Không thể cập nhật ánh xạ.",
          body: JSON.stringify(body),
        },
      );

      return mapMapping({
        ...response,
        categoryName: null,
        attributeName: null,
        attributeCode: null,
        attributeType: null,
      });
    } catch (error) {
      throw new Error(resolveApiError(error, "Không thể cập nhật ánh xạ."));
    }
  },

  async updateMappingStatus(
    currentMapping: Pick<CategoryAttributeMapping, "categoryId" | "attributeId">,
    status: MappingStatus,
  ): Promise<CategoryAttributeMapping> {
    try {
      const response = await apiClient.request<MappingApiWriteResponse>(
        `${CATEGORY_MAPPING_BASE_PATH}/${currentMapping.categoryId}/${currentMapping.attributeId}/status`,
        {
          method: "PATCH",
          includeJsonContentType: true,
          defaultErrorMessage: "Không thể cập nhật trạng thái ánh xạ.",
          body: JSON.stringify({ status }),
        },
      );

      return mapMapping({
        ...response,
        categoryName: null,
        attributeName: null,
        attributeCode: null,
        attributeType: null,
      });
    } catch (error) {
      throw new Error(
        resolveApiError(error, "Không thể cập nhật trạng thái ánh xạ."),
      );
    }
  },

  async deleteMapping(
    currentMapping: Pick<CategoryAttributeMapping, "categoryId" | "attributeId">,
  ): Promise<void> {
    try {
      await apiClient.request<void>(
        `${CATEGORY_MAPPING_BASE_PATH}/${currentMapping.categoryId}/${currentMapping.attributeId}`,
        {
          method: "DELETE",
          defaultErrorMessage: "Không thể xóa ánh xạ.",
        },
      );
    } catch (error) {
      throw new Error(resolveApiError(error, "Không thể xóa ánh xạ."));
    }
  },

  async previewCategory(categoryId: number): Promise<CategoryMappingPreview> {
    if (!categoryId) {
      throw new Error("Vui lòng chọn danh mục để xem trước.");
    }

    const response = await this.getMappings({ page: 1, pageSize: 1000 });
    const fields = response.data
      .filter(
        (mapping) =>
          mapping.categoryId === categoryId && mapping.status === "Active",
      )
      .sort((left, right) => left.displayOrder - right.displayOrder)
      .map((field) => ({
        attributeId: field.attributeId,
        attributeName: field.attributeName,
        attributeCode: field.attributeCode,
        attributeType: field.attributeType,
        isRequired: field.isRequired,
        displayOrder: field.displayOrder,
        placeholder: buildPreviewPlaceholder(field),
      }));

    return {
      categoryId,
      categoryName:
        response.data.find((mapping) => mapping.categoryId === categoryId)
          ?.categoryName || `Danh mục #${categoryId}`,
      fields,
    };
  },
};
