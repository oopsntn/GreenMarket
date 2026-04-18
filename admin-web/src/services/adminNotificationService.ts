import { apiClient } from "../lib/apiClient";
import type {
  AdminNotificationHistoryItem,
  AdminNotificationHistoryResponse,
  AdminNotificationSendPayload,
  AdminNotificationSendResponse,
} from "../types/adminNotification";

const ADMIN_NOTIFICATION_BASE_PATH = "/api/admin/notifications";

const formatDateTime = (value: string | Date | null | undefined) => {
  if (!value) {
    return "--";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : "--";
  }

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const mapHistoryItem = (
  item: AdminNotificationHistoryItem & { sentAt: string | Date },
): AdminNotificationHistoryItem => ({
  ...item,
  sentAt: formatDateTime(item.sentAt),
});

const resolveApiError = (error: unknown, fallbackMessage: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
};

export const adminNotificationService = {
  async getHistory(): Promise<AdminNotificationHistoryItem[]> {
    try {
      const response = await apiClient.request<AdminNotificationHistoryResponse>(
        `${ADMIN_NOTIFICATION_BASE_PATH}/history`,
        {
          defaultErrorMessage: "Không thể tải lịch sử thông báo.",
        },
      );

      return (response.data || []).map(mapHistoryItem);
    } catch (error) {
      throw new Error(resolveApiError(error, "Không thể tải lịch sử thông báo."));
    }
  },

  async sendNotification(
    payload: AdminNotificationSendPayload,
  ): Promise<AdminNotificationSendResponse> {
    try {
      return await apiClient.request<AdminNotificationSendResponse>(
        `${ADMIN_NOTIFICATION_BASE_PATH}/send`,
        {
          method: "POST",
          includeJsonContentType: true,
          defaultErrorMessage: "Không thể gửi thông báo cho người dùng.",
          body: JSON.stringify(payload),
        },
      );
    } catch (error) {
      throw new Error(
        resolveApiError(error, "Không thể gửi thông báo cho người dùng."),
      );
    }
  },
};
