import type { Template } from "./template";

export type AdminNotificationScope = "single" | "all_users";

export type AdminNotificationType = "info" | "success" | "warning" | "error";

export type AdminNotificationRecipientOption = {
  id: number;
  label: string;
  sublabel: string;
};

export type AdminNotificationTemplateUsage = {
  templateId: number;
  templateName: string;
  templateType: string;
} | null;

export type AdminNotificationHistoryItem = {
  id: number;
  sentAt: string;
  scope: AdminNotificationScope;
  recipientName: string;
  recipientCount: number;
  title: string;
  message: string;
  type: AdminNotificationType;
  performedBy: string;
  template: AdminNotificationTemplateUsage;
};

export type AdminNotificationFormState = {
  scope: AdminNotificationScope;
  recipientId: string;
  templateId: string;
  title: string;
  message: string;
  type: AdminNotificationType;
};

export type AdminNotificationSendPayload = {
  scope: AdminNotificationScope;
  recipientId?: number;
  templateId?: number;
  title: string;
  message: string;
  type: AdminNotificationType;
};

export type AdminNotificationHistoryResponse = {
  data: AdminNotificationHistoryItem[];
};

export type AdminNotificationSendResponse = {
  message: string;
  data: {
    scope: AdminNotificationScope;
    recipientCount: number;
    title: string;
    type: AdminNotificationType;
    template: AdminNotificationTemplateUsage;
  };
};

export const emptyAdminNotificationForm: AdminNotificationFormState = {
  scope: "single",
  recipientId: "",
  templateId: "",
  title: "",
  message: "",
  type: "info",
};

export const adminNotificationTypeLabels = {
  info: "Thông tin",
  success: "Thành công",
  warning: "Cảnh báo",
  error: "Khẩn cấp",
} satisfies Record<AdminNotificationType, string>;

export const adminNotificationScopeLabels = {
  single: "Một người dùng",
  all_users: "Toàn bộ người dùng",
} satisfies Record<AdminNotificationScope, string>;

export const buildRecipientOptionFromUser = (user: {
  id: number;
  fullName: string;
  email: string;
  phone: string;
}): AdminNotificationRecipientOption => ({
  id: user.id,
  label: user.fullName,
  sublabel: [user.email, user.phone]
    .filter((value) => value && value !== "Chưa có email")
    .join(" • "),
});

export const buildNotificationPreviewTitle = (
  template: Template | null,
  title: string,
) => {
  const normalizedTitle = title.trim();

  if (normalizedTitle) {
    return normalizedTitle;
  }

  return template?.name ?? "Tiêu đề thông báo";
};
