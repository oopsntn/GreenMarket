import { apiClient } from "../lib/apiClient";
import type { ActivityLogItem } from "../types/activityLog";

type LegacyActivityLogItem = {
  id?: number;
  userId?: number;
  userName?: string;
  action?: string;
  detail?: string;
  performedBy?: string;
  performedAt?: string;
};

const isActivityLogItem = (item: unknown): item is ActivityLogItem => {
  if (!item || typeof item !== "object") {
    return false;
  }

  return "occurredAtLabel" in item && "moduleLabel" in item && "actionType" in item;
};

const normalizeLegacyLog = (item: LegacyActivityLogItem): ActivityLogItem => {
  const action = item.action?.trim() || "Sự kiện hệ thống";
  const detail = item.detail?.trim() || `${action} được backend ghi nhận trong nhật ký sự kiện.`;
  const actorName = item.performedBy?.trim() || "Quản trị viên hệ thống";
  const targetName = item.userName?.trim() || "Người dùng";
  const targetCode = item.userId ? `USER-${item.userId}` : "";
  const occurredAtLabel = item.performedAt?.trim() || "Chưa có dữ liệu";
  const occurredAt = item.performedAt?.trim() ? item.performedAt.trim() : "";

  return {
    id: item.id ?? 0,
    eventType: "legacy_activity_log",
    occurredAt,
    occurredAtLabel,
    actorName,
    actorRole: "Quản trị viên",
    moduleKey: "system",
    moduleLabel: "Nhật ký cũ",
    action,
    actionType: "Hoạt động đã ghi nhận",
    targetType: "Người dùng",
    targetName,
    targetCode,
    result: "Đã ghi nhận",
    severity: "trung bình",
    detail,
    relatedIds: {
      userId: item.userId ?? null,
      postId: null,
      shopId: null,
      slotId: null,
      categoryId: null,
    },
  };
};

const normalizeLog = (item: unknown): ActivityLogItem => {
  if (isActivityLogItem(item)) {
    return {
      ...item,
      occurredAt: typeof item.occurredAt === "string" ? item.occurredAt : "",
      occurredAtLabel:
        typeof item.occurredAtLabel === "string" && item.occurredAtLabel.trim()
          ? item.occurredAtLabel
          : "Chưa có dữ liệu",
      actorName:
        typeof item.actorName === "string" && item.actorName.trim()
          ? item.actorName
          : "Quản trị viên hệ thống",
      actorRole:
        typeof item.actorRole === "string" && item.actorRole.trim()
          ? item.actorRole
          : "Quản trị viên",
      moduleKey:
        typeof item.moduleKey === "string" && item.moduleKey.trim()
          ? item.moduleKey
          : "system",
      moduleLabel:
        typeof item.moduleLabel === "string" && item.moduleLabel.trim()
          ? item.moduleLabel
          : "Hệ thống",
      action:
        typeof item.action === "string" && item.action.trim()
          ? item.action
          : "Sự kiện hệ thống",
      actionType:
        typeof item.actionType === "string" && item.actionType.trim()
          ? item.actionType
          : "Hoạt động đã ghi nhận",
      targetType:
        typeof item.targetType === "string" && item.targetType.trim()
          ? item.targetType
          : "Đối tượng hệ thống",
      targetName:
        typeof item.targetName === "string" && item.targetName.trim()
          ? item.targetName
          : "Bản ghi hệ thống",
      targetCode:
        typeof item.targetCode === "string" ? item.targetCode : "",
      result:
        typeof item.result === "string" && item.result.trim()
          ? item.result
          : "Đã ghi nhận",
      severity:
        item.severity === "thấp" ||
        item.severity === "trung bình" ||
        item.severity === "cao"
          ? item.severity
          : "trung bình",
      detail:
        typeof item.detail === "string" && item.detail.trim()
          ? item.detail
          : "Bản ghi không có thêm chi tiết.",
      relatedIds: item.relatedIds ?? {
        userId: null,
        postId: null,
        shopId: null,
        slotId: null,
        categoryId: null,
      },
    };
  }

  return normalizeLegacyLog(item as LegacyActivityLogItem);
};

export const activityLogService = {
  async fetchActivityLogs(): Promise<ActivityLogItem[]> {
    const response = await apiClient.request<unknown[]>("/api/admin/activity-logs", {
      defaultErrorMessage: "Không thể tải nhật ký hoạt động.",
    });

    return Array.isArray(response) ? response.map(normalizeLog) : [];
  },
};
