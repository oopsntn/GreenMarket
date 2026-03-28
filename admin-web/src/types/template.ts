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
  status: TemplateStatus;
  updatedAt: string;
};

export type TemplateFormState = {
  name: string;
  type: TemplateType;
  content: string;
  status: TemplateStatus;
};
