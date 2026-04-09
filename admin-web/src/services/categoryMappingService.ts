import { apiClient } from "../lib/apiClient";
import type { Attribute } from "../types/attribute";
import type { Category } from "../types/category";
import type {
  CategoryMapping,
  CategoryMappingApiResponse,
  CategoryMappingAttributeType,
  CategoryMappingFormState,
  MappingStatus,
} from "../types/categoryMapping";

const toNumberId = (value: string) => Number(value);

const normalizeText = (value: string) => value.trim().toLowerCase();

const normalizeMappingStatus = (
  value: string | null | undefined,
): MappingStatus =>
  (value || "").toLowerCase() === "disabled" ? "Disabled" : "Active";

const normalizeAttributeType = (
  value: string | null | undefined,
): CategoryMappingAttributeType => {
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

const normalizeOptions = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => String(item).trim())
    .filter((item) => item.length > 0);
};

const buildMappingId = (categoryId: number, attributeId: number) =>
  `${categoryId}-${attributeId}`;

const hydrateMappingFromCatalogs = (
  mapping: CategoryMapping,
  categories: Category[],
  attributes: Attribute[],
): CategoryMapping => {
  const matchedCategory =
    categories.find((item) => item.id === mapping.categoryId) ?? null;
  const matchedAttribute =
    attributes.find((item) => item.id === mapping.attributeId) ?? null;

  return {
    ...mapping,
    categoryName:
      matchedCategory?.name ||
      mapping.categoryName ||
      `Category #${mapping.categoryId}`,
    categorySlug: matchedCategory?.slug || mapping.categorySlug || "",
    attributeName:
      matchedAttribute?.name ||
      mapping.attributeName ||
      `Attribute #${mapping.attributeId}`,
    attributeCode: matchedAttribute?.code || mapping.attributeCode || "",
    attributeType: matchedAttribute?.type || mapping.attributeType,
    attributeOptions: matchedAttribute?.options?.length
      ? matchedAttribute.options
      : mapping.attributeOptions,
  };
};

const mapApiMappingToUi = (
  item: CategoryMappingApiResponse,
  categories: Category[] = [],
  attributes: Attribute[] = [],
): CategoryMapping => {
  const categoryId = Number(item.categoryId);
  const attributeId = Number(item.attributeId);

  const baseMapping: CategoryMapping = {
    id: buildMappingId(categoryId, attributeId),
    categoryId,
    categoryName: item.categoryName?.trim() || `Category #${categoryId}`,
    categorySlug: item.categorySlug?.trim() || "",
    attributeId,
    attributeName: item.attributeName?.trim() || `Attribute #${attributeId}`,
    attributeCode: item.attributeCode?.trim() || "",
    attributeType: normalizeAttributeType(item.attributeType),
    attributeOptions: normalizeOptions(item.attributeOptions),
    required: Boolean(item.required),
    displayOrder: item.displayOrder ?? 1,
    status: normalizeMappingStatus(item.status),
  };

  return hydrateMappingFromCatalogs(baseMapping, categories, attributes);
};

const findCategoryById = (categories: Category[], categoryId: number) =>
  categories.find(
    (item) => item.id === categoryId && item.status === "Active",
  ) ?? null;

const findAttributeById = (attributes: Attribute[], attributeId: number) =>
  attributes.find(
    (item) => item.id === attributeId && item.status === "Active",
  ) ?? null;

const hasDuplicateMapping = (
  mappings: CategoryMapping[],
  categoryId: number,
  attributeId: number,
  excludeMappingId?: string,
) => {
  return mappings.some((mapping) => {
    if (excludeMappingId && mapping.id === excludeMappingId) {
      return false;
    }

    return (
      mapping.categoryId === categoryId && mapping.attributeId === attributeId
    );
  });
};

const validateFormData = (
  mappings: CategoryMapping[],
  categories: Category[],
  attributes: Attribute[],
  formData: CategoryMappingFormState,
  excludeMappingId?: string,
) => {
  const categoryId = toNumberId(formData.categoryId);
  const attributeId = toNumberId(formData.attributeId);

  if (!Number.isInteger(categoryId) || !Number.isInteger(attributeId)) {
    throw new Error("Please select both category and attribute.");
  }

  if (!Number.isFinite(formData.displayOrder) || formData.displayOrder < 1) {
    throw new Error("Display order must be at least 1.");
  }

  const category = findCategoryById(categories, categoryId);
  const attribute = findAttributeById(attributes, attributeId);

  if (!category) {
    throw new Error("Selected category was not found or is disabled.");
  }

  if (!attribute) {
    throw new Error("Selected attribute was not found or is disabled.");
  }

  if (
    hasDuplicateMapping(mappings, categoryId, attributeId, excludeMappingId)
  ) {
    throw new Error("This category already has the selected attribute.");
  }

  return {
    categoryId,
    attributeId,
    required: formData.required,
    displayOrder: formData.displayOrder,
  };
};

export const emptyCategoryMappingForm: CategoryMappingFormState = {
  categoryId: "",
  attributeId: "",
  required: false,
  displayOrder: 1,
};

export const categoryMappingService = {
  getAvailableCategories(categories: Category[]): Category[] {
    return categories.filter((category) => category.status === "Active");
  },

  getAvailableAttributes(attributes: Attribute[]): Attribute[] {
    return attributes.filter((attribute) => attribute.status === "Active");
  },

  async fetchMappings(
    categories: Category[] = [],
    attributes: Attribute[] = [],
  ): Promise<CategoryMapping[]> {
    const data = await apiClient.request<CategoryMappingApiResponse[]>(
      "/api/admin/category-mappings",
      {
        defaultErrorMessage: "Unable to load category-attribute mappings.",
      },
    );

    return data.map((item) => mapApiMappingToUi(item, categories, attributes));
  },

  async createMapping(
    mappings: CategoryMapping[],
    categories: Category[],
    attributes: Attribute[],
    formData: CategoryMappingFormState,
  ): Promise<CategoryMapping> {
    const payload = validateFormData(
      mappings,
      categories,
      attributes,
      formData,
    );

    const data = await apiClient.request<CategoryMappingApiResponse>(
      "/api/admin/category-mappings",
      {
        method: "POST",
        includeJsonContentType: true,
        defaultErrorMessage: "Unable to create category mapping.",
        body: JSON.stringify(payload),
      },
    );

    return mapApiMappingToUi(data, categories, attributes);
  },

  async updateMapping(
    mappings: CategoryMapping[],
    categories: Category[],
    attributes: Attribute[],
    currentMapping: CategoryMapping,
    formData: CategoryMappingFormState,
  ): Promise<CategoryMapping> {
    const payload = validateFormData(
      mappings,
      categories,
      attributes,
      formData,
      currentMapping.id,
    );

    const data = await apiClient.request<CategoryMappingApiResponse>(
      `/api/admin/category-mappings/${currentMapping.categoryId}/${currentMapping.attributeId}`,
      {
        method: "PUT",
        includeJsonContentType: true,
        defaultErrorMessage: "Unable to update category mapping.",
        body: JSON.stringify(payload),
      },
    );

    return mapApiMappingToUi(data, categories, attributes);
  },

  async updateMappingStatus(
    currentMapping: CategoryMapping,
    status: MappingStatus,
    categories: Category[] = [],
    attributes: Attribute[] = [],
  ): Promise<CategoryMapping> {
    const data = await apiClient.request<CategoryMappingApiResponse>(
      `/api/admin/category-mappings/${currentMapping.categoryId}/${currentMapping.attributeId}/status`,
      {
        method: "PATCH",
        includeJsonContentType: true,
        defaultErrorMessage: "Unable to update mapping status.",
        body: JSON.stringify({
          status,
        }),
      },
    );

    return mapApiMappingToUi(data, categories, attributes);
  },

  async removeMapping(currentMapping: CategoryMapping): Promise<void> {
    await apiClient.request<{
      message: string;
    }>(
      `/api/admin/category-mappings/${currentMapping.categoryId}/${currentMapping.attributeId}`,
      {
        method: "DELETE",
        defaultErrorMessage: "Unable to remove category mapping.",
      },
    );
  },

  getPreviewMappingsByCategory(
    mappings: CategoryMapping[],
    categoryId: number,
  ): CategoryMapping[] {
    return mappings
      .filter(
        (mapping) =>
          mapping.categoryId === categoryId && mapping.status === "Active",
      )
      .sort((a, b) => a.displayOrder - b.displayOrder);
  },

  getDefaultPreviewCategoryId(
    mappings: CategoryMapping[],
    categories: Category[],
  ): string {
    const activeCategoryIds = new Set(
      this.getAvailableCategories(categories).map((item) => item.id),
    );

    const firstMappedCategoryId =
      mappings.find((mapping) => activeCategoryIds.has(mapping.categoryId))
        ?.categoryId ?? null;

    if (firstMappedCategoryId !== null) {
      return String(firstMappedCategoryId);
    }

    return String(this.getAvailableCategories(categories)[0]?.id ?? "");
  },

  filterMappings(mappings: CategoryMapping[], searchKeyword: string) {
    const keyword = normalizeText(searchKeyword);

    if (!keyword) return mappings;

    return mappings.filter((item) => {
      return (
        normalizeText(item.categoryName).includes(keyword) ||
        normalizeText(item.attributeName).includes(keyword) ||
        normalizeText(item.attributeCode).includes(keyword)
      );
    });
  },
};
