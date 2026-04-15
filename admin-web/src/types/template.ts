export type TemplateType =
  | "Rejection Reason"
  | "Report Reason"
  | "Notification";

export type TemplateStatus = "Active" | "Disabled";

export type Template = {
  id: number;
  name: string;
  type: TemplateType;
  content: string;
  previewText: string;
  status: TemplateStatus;
  description: string;
  usageNote: string;
  updatedAt: string;
};

export type TemplateFormState = {
  name: string;
  type: TemplateType;
  content: string;
  previewText: string;
  description: string;
  usageNote: string;
  status: TemplateStatus;
};

export type TemplateListParams = {
  search?: string;
  type?: TemplateType | "All";
  status?: TemplateStatus | "All";
  page?: number;
  pageSize?: number;
};

export type TemplateListResponse = {
  data: Template[];
  total: number;
  page: number;
  pageSize: number;
};

export type TemplateBuilderFieldType = "text" | "number" | "select";

export type TemplateBuilderField = {
  id: string;
  type: TemplateBuilderFieldType;
  label: string;
  placeholder: string;
  helperText: string;
  required: boolean;
  options: string[];
};

export type TemplateBuilderPreset = {
  templateName: string;
  categoryName: string;
  usageNote: string;
  previewTitlePlaceholder: string;
  submitLabel: string;
  fields: TemplateBuilderField[];
};
