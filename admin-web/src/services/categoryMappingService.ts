import { initialCategoryMappings } from "../mock-data/categoryMappings";
import type { Attribute } from "../types/attribute";
import type { Category } from "../types/category";
import type {
  CategoryMapping,
  CategoryMappingFormState,
  MappingStatus,
} from "../types/categoryMapping";
import { readStoredJson, writeStoredJson } from "../utils/browserStorage";

const CATEGORY_MAPPING_STORAGE_KEY = "adminCategoryMappings";

const getNextId = (mappings: CategoryMapping[]) => {
  if (mappings.length === 0) return 1;
  return Math.max(...mappings.map((mapping) => mapping.id)) + 1;
};

const toNumberId = (value: string) => Number(value);

const getStoredMappings = () =>
  readStoredJson<CategoryMapping[]>(
    CATEGORY_MAPPING_STORAGE_KEY,
    initialCategoryMappings,
  );

const saveMappings = (mappings: CategoryMapping[]) => {
  writeStoredJson(CATEGORY_MAPPING_STORAGE_KEY, mappings);
  return mappings;
};

const hasDuplicateMapping = (
  mappings: CategoryMapping[],
  categoryId: number,
  attributeId: number,
  excludeMappingId?: number,
) => {
  return mappings.some((mapping) => {
    if (excludeMappingId !== undefined && mapping.id === excludeMappingId) {
      return false;
    }

    return (
      mapping.categoryId === categoryId && mapping.attributeId === attributeId
    );
  });
};

const buildMappingPayload = (
  categories: Category[],
  attributes: Attribute[],
  formData: CategoryMappingFormState,
  existingMappings: CategoryMapping[],
  excludeMappingId?: number,
) => {
  const categoryId = toNumberId(formData.categoryId);
  const attributeId = toNumberId(formData.attributeId);

  if (!categoryId || !attributeId) {
    throw new Error("Please select both category and attribute.");
  }

  const category =
    categories.find((item) => item.id === categoryId && item.status === "Active") ??
    null;
  const attribute =
    attributes.find(
      (item) => item.id === attributeId && item.status === "Active",
    ) ?? null;

  if (!category) {
    throw new Error("Selected category was not found.");
  }

  if (!attribute) {
    throw new Error("Selected attribute was not found.");
  }

  if (
    hasDuplicateMapping(
      existingMappings,
      categoryId,
      attributeId,
      excludeMappingId,
    )
  ) {
    throw new Error("This category already has the selected attribute.");
  }

  if (!Number.isFinite(formData.displayOrder) || formData.displayOrder < 1) {
    throw new Error("Display order must be at least 1.");
  }

  return {
    categoryId,
    categoryName: category.name,
    attributeId,
    attributeName: attribute.name,
    attributeCode: attribute.code,
    attributeType: attribute.type,
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
  getMappings(): CategoryMapping[] {
    return getStoredMappings();
  },

  getAvailableCategories(categories: Category[]): Category[] {
    return categories.filter((category) => category.status === "Active");
  },

  getAvailableAttributes(attributes: Attribute[]): Attribute[] {
    return attributes.filter((attribute) => attribute.status === "Active");
  },

  createMapping(
    mappings: CategoryMapping[],
    categories: Category[],
    attributes: Attribute[],
    formData: CategoryMappingFormState,
  ): CategoryMapping[] {
    const payload = buildMappingPayload(
      categories,
      attributes,
      formData,
      mappings,
    );

    return saveMappings([
      ...mappings,
      {
        id: getNextId(mappings),
        ...payload,
        status: "Active",
      },
    ]);
  },

  updateMapping(
    mappings: CategoryMapping[],
    categories: Category[],
    attributes: Attribute[],
    mappingId: number,
    formData: CategoryMappingFormState,
  ): CategoryMapping[] {
    const payload = buildMappingPayload(
      categories,
      attributes,
      formData,
      mappings,
      mappingId,
    );

    return saveMappings(
      mappings.map((mapping) =>
      mapping.id === mappingId
        ? {
            ...mapping,
            ...payload,
          }
        : mapping,
      ),
    );
  },

  updateMappingStatus(
    mappings: CategoryMapping[],
    mappingId: number,
    status: MappingStatus,
  ): CategoryMapping[] {
    return saveMappings(
      mappings.map((mapping) =>
      mapping.id === mappingId ? { ...mapping, status } : mapping,
      ),
    );
  },

  removeMapping(
    mappings: CategoryMapping[],
    mappingId: number,
  ): CategoryMapping[] {
    return saveMappings(mappings.filter((mapping) => mapping.id !== mappingId));
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
};
