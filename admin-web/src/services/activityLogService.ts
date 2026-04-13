import { apiClient } from "../lib/apiClient";
import type { FlattenedUserActivityItem } from "../types/user";

export const activityLogService = {
  fetchActivityLogs(): Promise<FlattenedUserActivityItem[]> {
    return apiClient.request<FlattenedUserActivityItem[]>(
      "/api/admin/activity-logs",
      {
        defaultErrorMessage: "Không thể tải nhật ký hoạt động.",
      },
    );
  },
};
