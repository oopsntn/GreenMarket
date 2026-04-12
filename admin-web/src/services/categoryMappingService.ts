import { apiClient } from "./api";

export type MappingStatus = "Active" | "Disabled";
export type MappingAttributeType = "Text" | "Number" | "Select" | "Boolean";

export type CategoryAttributeMapping = {
  id: number;
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
  id: number;
  categoryId: number;
  categoryName?: string;
  attributeId: number;
  attributeName?: string;
  attributeCode?: string;
  attributeType?: MappingAttributeType;
  isRequired: boolean;
  displayOrder: number;
  status: MappingStatus;
};

type MappingApiResponse = {
  data: MappingApiItem[];
  pagination?: {
    total?: number;
    page?: number;
    limit?: number;
  };
};

type MappingApiDetailResponse = {
  data: MappingApiItem;
};

type MappingPreviewApiResponse = {
  data: {
    categoryId: number;
    categoryName: string;
    fields: Array<{
      attributeId: number;
      attributeName: string;
      attributeCode: string;
      attributeType: MappingAttributeType;
      isRequired: boolean;
      displayOrder: number;
      placeholder?: string;
    }>;
  };
};

export type CreateMappingPayload = {
  categoryId: number;
  attributeId: number;
  isRequired: boolean;
  displayOrder: number;
};

export type UpdateMappingPayload = CreateMappingPayload;

const CATEGORY_MAPPING_BASE_PATH = "/admin/category-mappings";

function mapMapping(item: MappingApiItem): CategoryAttributeMapping {
  return {
    id: item.id,
    categoryId: item.categoryId,
    categoryName: item.categoryName?.trim() || `Danh muc #${item.categoryId}`,
    attributeId: item.attributeId,
    attributeName: item.attributeName?.trim() || `Thuoc tinh #${item.attributeId}`,
    attributeCode: item.attributeCode?.trim() || `ATTR_${item.attributeId}`,
    attributeType: item.attributeType ?? "Text",
    isRequired: Boolean(item.isRequired),
    displayOrder: item.displayOrder ?? 1,
    status: item.status,
  };
}

function buildMappingPayload(payload: CreateMappingPayload | UpdateMappingPayload) {
  if (!payload.categoryId || !payload.attributeId) {
    throw new Error("Vui long chon ca danh muc va thuoc tinh.");
  }

  if (!Number.isInteger(payload.displayOrder) || payload.displayOrder < 1) {
    throw new Error("Thu tu hien thi phai lon hon hoac bang 1.");
  }

  return {
    categoryId: payload.categoryId,
    attributeId: payload.attributeId,
    isRequired: Boolean(payload.isRequired),
    displayOrder: payload.displayOrder,
  };
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
  placeholder?: string;
}) {
  if (field.placeholder?.trim()) {
    return field.placeholder.trim();
  }

  return `Nhap ${field.attributeName || field.attributeCode}`;
}

export const categoryMappingService = {
  async getMappings(params: MappingListParams = {}): Promise<MappingListResponse> {
    try {
      const query = new URLSearchParams();

      if (params.search?.trim()) {
        query.set("search", params.search.trim());
      }

      query.set("page", String(params.page ?? 1));
      query.set("limit", String(params.pageSize ?? 10));

      const response = await apiClient.get<MappingApiResponse>(
        `${CATEGORY_MAPPING_BASE_PATH}?${query.toString()}`,
      );

      const items = (response.data ?? []).map(mapMapping);
      const pagination = response.pagination ?? {};

      return {
        data: items,
        total: pagination.total ?? items.length,
        page: pagination.page ?? (params.page ?? 1),
        pageSize: pagination.limit ?? (params.pageSize ?? 10),
      };
    } catch (error) {
      throw new Error(resolveApiError(error, "Khong the tai danh sach anh xa."));
    }
  },

  async createMapping(payload: CreateMappingPayload): Promise<CategoryAttributeMapping> {
    try {
      const body = buildMappingPayload(payload);
      const response = await apiClient.post<MappingApiDetailResponse>(CATEGORY_MAPPING_BASE_PATH, body);
      return mapMapping(response.data);
    } catch (error) {
      throw new Error(resolveApiError(error, "Khong the tao anh xa moi."));
    }
  },

  async updateMapping(mappingId: number, payload: UpdateMappingPayload): Promise<CategoryAttributeMapping> {
    try {
      const body = buildMappingPayload(payload);
      const response = await apiClient.put<MappingApiDetailResponse>(
        `${CATEGORY_MAPPING_BASE_PATH}/${mappingId}`,
        body,
      );
      return mapMapping(response.data);
    } catch (error) {
      throw new Error(resolveApiError(error, "Khong the cap nhat anh xa."));
    }
  },

  async updateMappingStatus(mappingId: number, status: MappingStatus): Promise<CategoryAttributeMapping> {
    try {
      const response = await apiClient.patch<MappingApiDetailResponse>(
        `${CATEGORY_MAPPING_BASE_PATH}/${mappingId}/status`,
        { status },
      );
      return mapMapping(response.data);
    } catch (error) {
      throw new Error(resolveApiError(error, "Khong the cap nhat trang thai anh xa."));
    }
  },

  async deleteMapping(mappingId: number): Promise<void> {
    try {
      await apiClient.delete<{ success: boolean }>(`${CATEGORY_MAPPING_BASE_PATH}/${mappingId}`);
    } catch (error) {
      throw new Error(resolveApiError(error, "Khong the xoa anh xa."));
    }
  },

  async previewCategory(categoryId: number): Promise<CategoryMappingPreview> {
    if (!categoryId) {
      throw new Error("Vui long chon danh muc de xem truoc.");
    }

    try {
      const response = await apiClient.get<MappingPreviewApiResponse>(
        `${CATEGORY_MAPPING_BASE_PATH}/preview/${categoryId}`,
      );

      const preview = response.data;

      return {
        categoryId: preview.categoryId,
        categoryName: preview.categoryName,
        fields: (preview.fields ?? [])
          .slice()
          .sort((left, right) => left.displayOrder - right.displayOrder)
          .map((field) => ({
            attributeId: field.attributeId,
            attributeName: field.attributeName,
            attributeCode: field.attributeCode,
            attributeType: field.attributeType,
            isRequired: Boolean(field.isRequired),
            displayOrder: field.displayOrder,
            placeholder: buildPreviewPlaceholder(field),
          })),
      };
    } catch (error) {
      throw new Error(resolveApiError(error, "Khong the tai ban xem truoc danh muc."));
    }
  },
};
