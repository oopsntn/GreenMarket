import { initialAttributes } from "../mock-data/attributes";
import { initialCategories } from "../mock-data/categories";
import { initialCategoryMappings } from "../mock-data/categoryMappings";
import type { Attribute } from "../types/attribute";
import type { Category } from "../types/category";
import type {
  CategoryMapping,
  CategoryMappingFormState,
  MappingStatus,
} from "../types/categoryMapping";

const getNextId = (mappings: CategoryMapping[]) => {
  if (mappings.length === 0) return 1;
  return Math.max(...mappings.map((mapping) => mapping.id)) + 1;
};

const toNumberId = (value: string) => Number(value);

const getCategoryById = (categoryId: number) => {
  return (
    initialCategories.find((category) => category.id === categoryId) ?? null
  );
};

const getAttributeById = (attributeId: number) => {
  return (
    initialAttributes.find((attribute) => attribute.id === attributeId) ?? null
  );
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
  formData: CategoryMappingFormState,
  existingMappings: CategoryMapping[],
  excludeMappingId?: number,
) => {
  const categoryId = toNumberId(formData.categoryId);
  const attributeId = toNumberId(formData.attributeId);

  if (!categoryId || !attributeId) {
    throw new Error("Please select both category and attribute.");
  }

  const category = getCategoryById(categoryId);
  const attribute = getAttributeById(attributeId);

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
    return initialCategoryMappings;
  },

  getAvailableCategories(): Category[] {
    return initialCategories.filter((category) => category.status === "Active");
  },

  getAvailableAttributes(): Attribute[] {
    return initialAttributes.filter(
      (attribute) => attribute.status === "Active",
    );
  },

  createMapping(
    mappings: CategoryMapping[],
    formData: CategoryMappingFormState,
  ): CategoryMapping[] {
    const payload = buildMappingPayload(formData, mappings);

    return [
      ...mappings,
      {
        id: getNextId(mappings),
        ...payload,
        status: "Active",
      },
    ];
  },

  updateMapping(
    mappings: CategoryMapping[],
    mappingId: number,
    formData: CategoryMappingFormState,
  ): CategoryMapping[] {
    const payload = buildMappingPayload(formData, mappings, mappingId);

    return mappings.map((mapping) =>
      mapping.id === mappingId
        ? {
            ...mapping,
            ...payload,
          }
        : mapping,
    );
  },

  updateMappingStatus(
    mappings: CategoryMapping[],
    mappingId: number,
    status: MappingStatus,
  ): CategoryMapping[] {
    return mappings.map((mapping) =>
      mapping.id === mappingId ? { ...mapping, status } : mapping,
    );
  },

  removeMapping(
    mappings: CategoryMapping[],
    mappingId: number,
  ): CategoryMapping[] {
    return mappings.filter((mapping) => mapping.id !== mappingId);
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
