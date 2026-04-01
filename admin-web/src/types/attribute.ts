export type AttributeStatus = "Active" | "Disabled";
export type AttributeType = "Text" | "Number" | "Select" | "Boolean";

export type Attribute = {
  id: number;
  name: string;
  code: string;
  type: AttributeType;
  usedIn: string[];
  status: AttributeStatus;
  createdAt: string;
  options: string[];
};

export type AttributeFormState = {
  name: string;
  code: string;
  type: AttributeType;
  optionsText: string;
};

export type AttributeApiResponse = {
  attributeId: number;
  attributeCode: string | null;
  attributeTitle: string | null;
  attributeDataType: string | null;
  attributeOptions: unknown;
  attributePublished: boolean | null;
  attributeCreatedAt: string | null;
};
