export type MappingStatus = "Active" | "Disabled";

export type CategoryMapping = {
  id: number;
  categoryName: string;
  attributeName: string;
  attributeCode: string;
  required: boolean;
  displayOrder: number;
  status: MappingStatus;
};
