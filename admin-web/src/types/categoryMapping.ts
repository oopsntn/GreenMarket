export type MappingStatus = "Active" | "Disabled";

export type CategoryMappingAttributeType =
  | "Text"
  | "Number"
  | "Select"
  | "Boolean";

export type CategoryMapping = {
  id: string;
  categoryId: number;
  categoryName: string;
  categorySlug?: string;
  attributeId: number;
  attributeName: string;
  attributeCode: string;
  attributeType: CategoryMappingAttributeType;
  attributeOptions: string[];
  required: boolean;
  displayOrder: number;
  status: MappingStatus;
};

export type CategoryMappingFormState = {
  categoryId: string;
  attributeId: string;
  required: boolean;
  displayOrder: number;
};

export type CategoryMappingApiResponse = {
  categoryId: number;
  attributeId: number;
  required: boolean | null;
  displayOrder: number | null;
  status: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  attributeName: string | null;
  attributeCode: string | null;
  attributeType: string | null;
  attributeOptions: unknown;
};
