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
    const payload = {
      categoryTitle: formData.name.trim(),
      categorySlug: formData.slug.trim() || undefined,
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
    const payload = {
      categoryTitle: formData.name.trim(),
      categorySlug: formData.slug.trim() || undefined,
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
