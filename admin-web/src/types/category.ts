export type CategoryStatus = "Active" | "Disabled";

export type Category = {
  id: number;
  name: string;
  slug: string;
  attributesCount: number | null;
  status: CategoryStatus;
  createdAt: string;
};

export type CategoryFormState = {
  name: string;
  slug: string;
};

export type CategoryApiResponse = {
  categoryId: number;
  categoryParentId: number | null;
  categoryTitle: string | null;
  categorySlug: string | null;
  categoryPublished: boolean | null;
  categoryCreatedAt: string | null;
  categoryUpdatedAt: string | null;
};
