import { apiClient } from "../lib/apiClient";
import type {
  Category,
  CategoryApiResponse,
  CategoryFormState,
  CategoryStatus,
} from "../types/category";

const formatDate = (value: string | null) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
};

const normalizeText = (value: string) => value.trim().toLowerCase();

const slugifyCategory = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const mapApiCategoryToUi = (item: CategoryApiResponse): Category => {
  return {
    id: item.categoryId,
    name: item.categoryTitle?.trim() || "Untitled Category",
    slug: item.categorySlug?.trim() || "",
    attributesCount: null,
    status: item.categoryPublished ? "Active" : "Disabled",
    createdAt: formatDate(item.categoryCreatedAt),
  };
};

export const categoryService = {
  getEmptyForm(): CategoryFormState {
    return {
      name: "",
      slug: "",
    };
  },

  buildSlug(name: string, slug: string) {
    return slugifyCategory(slug || name);
  },

  validateCategoryForm(
    categories: Category[],
    formData: CategoryFormState,
    selectedCategoryId?: number | null,
  ) {
    if (!formData.name.trim()) {
      throw new Error("Category name is required.");
    }

    const nextSlug = this.buildSlug(formData.name, formData.slug);

    if (!nextSlug) {
      throw new Error("Slug could not be generated from the current category name.");
    }

    const duplicateName = categories.some((category) => {
      if (selectedCategoryId && category.id === selectedCategoryId) {
        return false;
      }

      return normalizeText(category.name) === normalizeText(formData.name);
    });

    if (duplicateName) {
      throw new Error("Another category already uses this name.");
    }

    const duplicateSlug = categories.some((category) => {
      if (selectedCategoryId && category.id === selectedCategoryId) {
        return false;
      }

      return normalizeText(category.slug) === normalizeText(nextSlug);
    });

    if (duplicateSlug) {
      throw new Error("Another category already uses this slug.");
    }
  },

  async getCategories(): Promise<Category[]> {
    const data = await apiClient.request<CategoryApiResponse[]>(
      "/api/admin/categories",
      {
        defaultErrorMessage: "Unable to load categories.",
      },
    );
    return data.map(mapApiCategoryToUi);
  },

  async createCategory(formData: CategoryFormState): Promise<Category> {
    const slug = this.buildSlug(formData.name, formData.slug);

    const payload = {
      categoryTitle: formData.name.trim(),
      categorySlug: slug || undefined,
      categoryPublished: true,
    };

    const data = await apiClient.request<CategoryApiResponse>(
      "/api/admin/categories",
      {
        method: "POST",
        includeJsonContentType: true,
        defaultErrorMessage: "Unable to create category.",
        body: JSON.stringify(payload),
      },
    );

    return mapApiCategoryToUi(data);
  },

  async updateCategory(
    categoryId: number,
    formData: CategoryFormState,
    currentStatus: CategoryStatus,
  ): Promise<Category> {
    const slug = this.buildSlug(formData.name, formData.slug);

    const payload = {
      categoryTitle: formData.name.trim(),
      categorySlug: slug || undefined,
      categoryPublished: currentStatus === "Active",
    };

    const data = await apiClient.request<CategoryApiResponse>(
      `/api/admin/categories/${categoryId}`,
      {
        method: "PUT",
        includeJsonContentType: true,
        defaultErrorMessage: "Unable to update category.",
        body: JSON.stringify(payload),
      },
    );

    return mapApiCategoryToUi(data);
  },

  async updateCategoryStatus(
    categoryId: number,
    status: CategoryStatus,
    currentCategory: Category,
  ): Promise<Category> {
    const payload = {
      categoryTitle: currentCategory.name,
      categorySlug: currentCategory.slug || undefined,
      categoryPublished: status === "Active",
    };

    const data = await apiClient.request<CategoryApiResponse>(
      `/api/admin/categories/${categoryId}`,
      {
        method: "PUT",
        includeJsonContentType: true,
        defaultErrorMessage: "Unable to update category status.",
        body: JSON.stringify(payload),
      },
    );

    return mapApiCategoryToUi(data);
  },
};
