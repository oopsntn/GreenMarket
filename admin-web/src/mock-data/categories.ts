import type { Category, CategoryFormState } from "../types/category";

export const initialCategories: Category[] = [
  {
    id: 1,
    name: "Indoor Plants",
    slug: "indoor-plants",
    attributesCount: 8,
    status: "Active",
    createdAt: "2026-03-10",
  },
  {
    id: 2,
    name: "Outdoor Plants",
    slug: "outdoor-plants",
    attributesCount: 6,
    status: "Active",
    createdAt: "2026-03-11",
  },
  {
    id: 3,
    name: "Succulents",
    slug: "succulents",
    attributesCount: 5,
    status: "Active",
    createdAt: "2026-03-12",
  },
  {
    id: 4,
    name: "Bonsai",
    slug: "bonsai",
    attributesCount: 7,
    status: "Disabled",
    createdAt: "2026-03-13",
  },
];

export const emptyCategoryForm: CategoryFormState = {
  name: "",
  slug: "",
};
