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

export type TemplateBuilderChannel =
  | "Email"
  | "In-App Notification"
  | "Moderation Note";

export type TemplateBuilderAudience = "Seller" | "Reporter" | "Internal Admin";

export type TemplateBuilderTone = "Formal" | "Supportive" | "Direct";

export type TemplateBuilderPreset = {
  selectedTemplateId: number | null;
  selectedTypeFilter: TemplateType | "All";
  channel: TemplateBuilderChannel;
  audience: TemplateBuilderAudience;
  tone: TemplateBuilderTone;
  shopName: string;
  postTitle: string;
  reason: string;
  slotName: string;
  contactEmail: string;
  adminNote: string;
};
