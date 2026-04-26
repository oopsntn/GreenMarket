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
