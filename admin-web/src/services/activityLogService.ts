import { apiClient } from "../lib/apiClient";
import type { ActivityLogItem } from "../types/activityLog";

export const activityLogService = {
  fetchActivityLogs(): Promise<ActivityLogItem[]> {
    return apiClient.request<ActivityLogItem[]>("/api/admin/activity-logs", {
      defaultErrorMessage: "Không thể tải nhật ký hoạt động.",
    });
  },
};
