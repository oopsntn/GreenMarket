export type CategoryStatus = "Active" | "Disabled";

export type Category = {
  id: number;
  name: string;
  slug: string;
  attributesCount: number;
  status: CategoryStatus;
  createdAt: string;
};

export type CategoryFormState = {
  name: string;
  slug: string;
  attributesCount: number;
  status: CategoryStatus;
};
