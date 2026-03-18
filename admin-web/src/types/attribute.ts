export type AttributeType = "Text" | "Number" | "Select" | "Boolean";
export type AttributeStatus = "Active" | "Disabled";

export type Attribute = {
  id: number;
  name: string;
  code: string;
  type: AttributeType;
  required: boolean;
  status: AttributeStatus;
  createdAt: string;
};

export type AttributeFormState = {
  name: string;
  code: string;
  type: AttributeType;
  required: boolean;
  status: AttributeStatus;
};
