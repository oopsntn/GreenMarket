import type { CategoryMapping } from "../types/categoryMapping";

export const initialCategoryMappings: CategoryMapping[] = [
  {
    id: 1,
    categoryName: "Indoor Plants",
    attributeName: "Height",
    attributeCode: "height",
    required: true,
    displayOrder: 1,
    status: "Active",
  },
  {
    id: 2,
    categoryName: "Indoor Plants",
    attributeName: "Pot Size",
    attributeCode: "pot_size",
    required: false,
    displayOrder: 2,
    status: "Active",
  },
  {
    id: 3,
    categoryName: "Succulents",
    attributeName: "Light Requirement",
    attributeCode: "light_requirement",
    required: true,
    displayOrder: 1,
    status: "Active",
  },
  {
    id: 4,
    categoryName: "Bonsai",
    attributeName: "Pet Friendly",
    attributeCode: "pet_friendly",
    required: false,
    displayOrder: 3,
    status: "Disabled",
  },
];
