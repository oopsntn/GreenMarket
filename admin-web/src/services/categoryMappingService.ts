import { initialCategoryMappings } from "../mock-data/categoryMappings";
import type { CategoryMapping, MappingStatus } from "../types/categoryMapping";

export const categoryMappingService = {
  getMappings(): CategoryMapping[] {
    return initialCategoryMappings;
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
};
