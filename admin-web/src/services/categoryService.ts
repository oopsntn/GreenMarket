import type {
  Category,
  CategoryApiResponse,
  CategoryFormState,
  CategoryStatus,
} from "../types/category";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:5000";

const getAdminToken = () => {
  return (
    localStorage.getItem("adminToken") ||
    sessionStorage.getItem("adminToken") ||
    ""
  );
};

const buildHeaders = () => {
  const token = getAdminToken();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

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

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...buildHeaders(),
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    let errorMessage = "Request failed.";

    try {
      const errorData = (await response.json()) as { error?: string };
      errorMessage = errorData.error || errorMessage;
    } catch {
      // ignore json parse error
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error("Your admin session has expired or is not authorized.");
    }

    throw new Error(errorMessage);
  }

  return (await response.json()) as T;
};

export const categoryService = {
  getEmptyForm(): CategoryFormState {
    return {
      name: "",
      slug: "",
    };
  },

  async getCategories(): Promise<Category[]> {
    const data = await request<CategoryApiResponse[]>("/api/admin/categories");
    return data.map(mapApiCategoryToUi);
  },

  async createCategory(formData: CategoryFormState): Promise<Category> {
    const payload = {
      categoryTitle: formData.name.trim(),
      categorySlug: formData.slug.trim() || undefined,
      categoryPublished: true,
    };

    const data = await request<CategoryApiResponse>("/api/admin/categories", {
      method: "POST",
      body: JSON.stringify(payload),
    });

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

    const data = await request<CategoryApiResponse>(
      `/api/admin/categories/${categoryId}`,
      {
        method: "PUT",
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

    const data = await request<CategoryApiResponse>(
      `/api/admin/categories/${categoryId}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    );

    return mapApiCategoryToUi(data);
  },
};
