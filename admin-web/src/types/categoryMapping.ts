export type MappingStatus = "Active" | "Disabled";

export type CategoryMapping = {
  id: number;
  categoryId: number;
  categoryName: string;
  attributeId: number;
  attributeName: string;
  attributeCode: string;
  attributeType: "Text" | "Number" | "Select" | "Boolean";
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
