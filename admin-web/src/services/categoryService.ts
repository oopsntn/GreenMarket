import { initialCategories } from "../mock-data/categories";
import type {
  Category,
  CategoryFormState,
  CategoryStatus,
} from "../types/category";

export const categoryService = {
  getCategories(): Category[] {
    return initialCategories;
  },

  createCategory(
    categories: Category[],
    formData: CategoryFormState,
  ): Category[] {
    const newCategory: Category = {
      id: categories.length + 1,
      name: formData.name,
      slug: formData.slug,
      attributesCount: formData.attributesCount,
      status: formData.status,
      createdAt: "2026-03-18",
    };

    return [newCategory, ...categories];
  },

  updateCategory(
    categories: Category[],
    selectedCategoryId: number,
    formData: CategoryFormState,
  ): Category[] {
    return categories.map((category) =>
      category.id === selectedCategoryId
        ? {
            ...category,
            name: formData.name,
            slug: formData.slug,
            attributesCount: formData.attributesCount,
            status: formData.status,
          }
        : category,
    );
  },

  updateCategoryStatus(
    categories: Category[],
    categoryId: number,
    status: CategoryStatus,
  ): Category[] {
    return categories.map((category) =>
      category.id === categoryId ? { ...category, status } : category,
    );
  },
};
