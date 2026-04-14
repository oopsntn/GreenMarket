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

const ACTION_LABELS: Record<string, string> = {
  "Admin Login": "Đăng nhập trang quản trị",
  "Role Assigned": "Gán vai trò",
  "Account Locked": "Khóa tài khoản",
  "Account Unlocked": "Mở khóa tài khoản",
  "Export Generated": "Tạo tệp xuất",
  "Promotion Resumed": "Tiếp tục chiến dịch quảng bá",
  "Promotion Reopened": "Mở lại chiến dịch quảng bá",
  "Moderation Updated": "Cập nhật kiểm duyệt",
};

const RESULT_LABELS: Record<string, string> = {
  completed: "Hoàn tất",
  success: "Thành công",
  processed: "Đã xử lý",
  pending: "Đang chờ",
  dismissed: "Đã bỏ qua",
  resolved: "Đã xử lý",
};

const REPORT_NAME_LABELS: Record<string, string> = {
  "Revenue Summary": "Tổng quan doanh thu",
  "Customer Spending Report": "Báo cáo chi tiêu khách hàng",
  "Customer Spending": "Chi tiêu khách hàng",
  "Promotion Performance": "Hiệu quả chiến dịch quảng bá",
  "Users Export": "Xuất danh sách người dùng",
  "Analytics Overview": "Tổng quan phân tích",
  "Promotion Operations": "Vận hành khuyến mãi",
  "Boosted Campaigns": "Chiến dịch đẩy nổi bật",
  Users: "Danh sách người dùng",
  Categories: "Danh sách danh mục",
  Attributes: "Danh sách thuộc tính",
  Templates: "Mẫu nội dung",
  Promotions: "Chiến dịch quảng bá",
  Analytics: "Phân tích hiệu quả",
};

const TARGET_CODE_LABELS: Record<string, string> = {
  EXPORT: "Bản xuất dữ liệu",
  TEMPLATE: "Mẫu nội dung",
  "SYSTEM-SETTINGS": "Thiết lập hệ thống",
};

const ACTOR_LABELS: Record<string, string> = {
  "System Administrator": "Quản trị viên hệ thống",
  System: "Hệ thống",
  Admin: "Quản trị viên",
};

const DETAIL_REPLACEMENTS: Array<[string, string]> = [
  [
    "Admin dashboard session started successfully.",
    "Phiên đăng nhập trang quản trị đã được khởi tạo thành công.",
  ],
  ["Assigned role: Operation Staff.", "Đã gán vai trò: Nhân viên vận hành."],
  [
    "User access was restricted after moderation review.",
    "Quyền truy cập của người dùng đã bị hạn chế sau bước rà soát kiểm duyệt.",
  ],
  [
    "User access was restored after verification.",
    "Quyền truy cập của người dùng đã được khôi phục sau khi xác minh.",
  ],
  ["Users CSV export completed.", "Đã hoàn tất xuất CSV danh sách người dùng."],
  ["Revenue summary CSV export completed.", "Đã hoàn tất xuất CSV tổng quan doanh thu."],
  [
    "Customer spending CSV export completed.",
    "Đã hoàn tất xuất CSV chi tiêu khách hàng.",
  ],
  ["Analytics overview CSV export completed.", "Đã hoàn tất xuất CSV tổng quan phân tích."],
  ["Promotion operations CSV export completed.", "Đã hoàn tất xuất CSV vận hành khuyến mãi."],
  ["Boosted campaigns CSV export completed.", "Đã hoàn tất xuất CSV chiến dịch đẩy nổi bật."],
  [
    "Category Top campaign resumed after content update.",
    "Chiến dịch Danh mục nổi bật đã được tiếp tục sau khi cập nhật nội dung.",
  ],
  [
    "Expired Search Boost campaign reopened after payment confirmation.",
    "Chiến dịch Tăng tìm kiếm đã hết hạn được mở lại sau khi xác nhận thanh toán.",
  ],
];

const isActivityLogItem = (item: unknown): item is ActivityLogItem => {
  if (!item || typeof item !== "object") {
    return false;
  }

  return (
    "occurredAtLabel" in item &&
    "moduleLabel" in item &&
    "actionType" in item
  );
};

const replaceKnownPhrases = (value: string) =>
  Object.entries(REPORT_NAME_LABELS)
    .sort(([left], [right]) => right.length - left.length)
    .reduce((result, [source, target]) => result.replaceAll(source, target), value);

const translateReportName = (value: string) => replaceKnownPhrases(value);

const translateAction = (value: string) => {
  const normalized = value.trim();
  if (!normalized) {
    return "Sự kiện hệ thống";
  }

  return ACTION_LABELS[normalized] || replaceKnownPhrases(normalized);
};

const translateResult = (value: string) => {
  const normalized = value.trim();
  if (!normalized) {
    return "Đã ghi nhận";
  }

  return RESULT_LABELS[normalized.toLowerCase()] || translateReportName(normalized);
};

const translateActor = (value: string) => {
  const normalized = value.trim();
  if (!normalized) {
    return "Quản trị viên hệ thống";
  }

  return ACTOR_LABELS[normalized] || normalized;
};

const translateTargetCode = (value: string) => {
  const normalized = value.trim();
  if (!normalized) {
    return "";
  }

  return TARGET_CODE_LABELS[normalized] || normalized;
};

const translateDetail = (value: string) => {
  const normalized = value.trim();
  if (!normalized) {
    return "Bản ghi không có thêm chi tiết.";
  }

  return DETAIL_REPLACEMENTS.reduce(
    (result, [source, target]) => result.replaceAll(source, target),
    replaceKnownPhrases(normalized),
  );
};

const normalizeLegacyLog = (item: LegacyActivityLogItem): ActivityLogItem => {
  const action = translateAction(item.action?.trim() || "Sự kiện hệ thống");
  const detail = item.detail?.trim()
    ? translateDetail(item.detail)
    : `${action} được backend ghi nhận trong nhật ký sự kiện.`;
  const actorName = translateActor(
    item.performedBy?.trim() || "Quản trị viên hệ thống",
  );
  const targetName = translateReportName(item.userName?.trim() || "Người dùng");
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
  if (!isActivityLogItem(item)) {
    return normalizeLegacyLog(item as LegacyActivityLogItem);
  }

  return {
    ...item,
    occurredAt: typeof item.occurredAt === "string" ? item.occurredAt : "",
    occurredAtLabel:
      typeof item.occurredAtLabel === "string" && item.occurredAtLabel.trim()
        ? item.occurredAtLabel
        : "Chưa có dữ liệu",
    actorName:
      typeof item.actorName === "string" && item.actorName.trim()
        ? translateActor(item.actorName)
        : "Quản trị viên hệ thống",
    actorRole:
      typeof item.actorRole === "string"
        ? translateActor(item.actorRole)
        : "Quản trị viên",
    moduleKey:
      typeof item.moduleKey === "string" && item.moduleKey.trim()
        ? item.moduleKey
        : "system",
    moduleLabel:
      typeof item.moduleLabel === "string" && item.moduleLabel.trim()
        ? translateReportName(item.moduleLabel)
        : "Hệ thống",
    action:
      typeof item.action === "string" && item.action.trim()
        ? translateAction(item.action)
        : "Sự kiện hệ thống",
    actionType:
      typeof item.actionType === "string" && item.actionType.trim()
        ? translateReportName(item.actionType)
        : "Hoạt động đã ghi nhận",
    targetType:
      typeof item.targetType === "string" && item.targetType.trim()
        ? translateReportName(item.targetType)
        : "Đối tượng hệ thống",
    targetName:
      typeof item.targetName === "string" && item.targetName.trim()
        ? translateReportName(item.targetName)
        : "Bản ghi hệ thống",
    targetCode:
      typeof item.targetCode === "string"
        ? translateTargetCode(item.targetCode)
        : "",
    result:
      typeof item.result === "string"
        ? translateResult(item.result)
        : "Đã ghi nhận",
    severity:
      item.severity === "thấp" ||
      item.severity === "trung bình" ||
      item.severity === "cao"
        ? item.severity
        : "trung bình",
    detail:
      typeof item.detail === "string"
        ? translateDetail(item.detail)
        : "Bản ghi không có thêm chi tiết.",
    relatedIds: item.relatedIds ?? {
      userId: null,
      postId: null,
      shopId: null,
      slotId: null,
      categoryId: null,
    },
  };
};

export const activityLogService = {
  async fetchActivityLogs(): Promise<ActivityLogItem[]> {
    const response = await apiClient.request<unknown[]>("/api/admin/activity-logs", {
      defaultErrorMessage: "Không thể tải nhật ký hoạt động.",
    });

    return Array.isArray(response) ? response.map(normalizeLog) : [];
  },
};
