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

const MOJIBAKE_PATTERN = /[\u00c3\u00c2\u00c6\u00c4\u00e2\u00ba\u00bb]/;

const repairMojibake = (value: string) => {
  if (!value || !MOJIBAKE_PATTERN.test(value)) {
    return value;
  }

  try {
    return decodeURIComponent(escape(value));
  } catch {
    return value;
  }
};

const normalizeTextKey = (value: string) =>
  repairMojibake(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/[^\p{L}\p{N}\s/]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const ACTION_LABELS: Record<string, string> = {
  "shop view": "Xem cửa hàng",
  "shop contact click": "Nhấn liên hệ cửa hàng",
  "admin manual notification sent": "Gửi thông báo thủ công",
  "admin login": "Đăng nhập trang quản trị",
  "role assigned": "Gán vai trò",
  "account locked": "Khóa tài khoản",
  "account unlocked": "Mở khóa tài khoản",
  "export generated": "Tạo tệp xuất",
  "promotion resumed": "Tiếp tục chiến dịch quảng bá",
  "promotion reopened": "Mở lại chiến dịch quảng bá",
  "moderation updated": "Cập nhật kiểm duyệt",
  "admin collaborator relationship active": "Kích hoạt quan hệ cộng tác",
  "admin host content published": "Xuất bản nội dung Host / Tin tức",
  "admin payout request completed": "Hoàn tất chi trả Host / Tin tức",
  "admin host payout created": "Tạo khoản chi trả Host",
  "host payout requested": "Ghi nhận khoản chi trả Host",
  "admin system settings updated": "Cập nhật thiết lập hệ thống",
  "update system settings": "Cập nhật thiết lập hệ thống",
};

const RESULT_LABELS: Record<string, string> = {
  completed: "Hoàn thành",
  success: "Thành công",
  processed: "Đã xử lý",
  pending: "Đang chờ",
  dismissed: "Đã bỏ qua",
  resolved: "Đã xử lý",
  saved: "Đã lưu",
};

const MODULE_LABELS: Record<string, string> = {
  system: "Hệ thống",
  "system settings": "Thiết lập hệ thống",
  promotions: "Theo dõi quảng bá",
  analytics: "Phân tích hiệu quả",
  revenue: "Doanh thu",
  reports: "Xử lý báo cáo",
  templates: "Mẫu nội dung",
  collaborators: "Quản lý cộng tác viên",
  "host / news": "Nội dung Host / Tin tức",
};

const TARGET_CODE_LABELS: Record<string, string> = {
  export: "Bản xuất dữ liệu",
  template: "Mẫu nội dung",
  "system settings": "Thiết lập hệ thống",
  "host payout request": "Khoản chi trả Host",
  "admin host payout": "Khoản chi trả Host",
};

const ACTOR_LABELS: Record<string, string> = {
  "system administrator": "Quản trị viên hệ thống",
  system: "Hệ thống",
  admin: "Quản trị viên",
};

const PHRASE_REPLACEMENTS: Array<[string, string]> = [
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
  ["Promotion operations CSV export completed.", "Đã hoàn tất xuất CSV theo dõi quảng bá."],
  ["Boosted campaigns CSV export completed.", "Đã hoàn tất xuất CSV chiến dịch đẩy bài."],
  [
    "Category Top campaign resumed after content update.",
    "Chiến dịch vị trí 2 trang chủ đã được tiếp tục sau khi cập nhật nội dung.",
  ],
  [
    "Expired Search Boost campaign reopened after payment confirmation.",
    "Chiến dịch vị trí 3 trang chủ đã hết hạn được mở lại sau khi xác nhận thanh toán.",
  ],
  ["Updated system settings", "Cập nhật thiết lập hệ thống"],
  ["Admin payout request completed", "Hoàn tất chi trả Host / Tin tức"],
  ["Host Payout Requested", "Ghi nhận khoản chi trả Host"],
  ["Admin Host Payout Created", "Tạo khoản chi trả Host"],
  [
    "C\u00e1\u00ba\u00adp nh\u00e1\u00ba\u00adt thi\u00e1\u00ba\u00bft l\u00e1\u00ba\u00adp h\u00e1\u00bb\u0087 th\u00e1\u00bb\u0091ng",
    "Cập nhật thiết lập hệ thống",
  ],
  [
    "Kh\u00c3\u00b4i ph\u00e1\u00bb\u00a5c thi\u00e1\u00ba\u00bft l\u00e1\u00ba\u00adp h\u00e1\u00bb\u0087 th\u00e1\u00bb\u0091ng",
    "Khôi phục thiết lập hệ thống",
  ],
];

const isActivityLogItem = (item: unknown): item is ActivityLogItem => {
  if (!item || typeof item !== "object") {
    return false;
  }

  return "occurredAtLabel" in item && "moduleLabel" in item && "actionType" in item;
};

const translateKnownPhrases = (value: string) =>
  PHRASE_REPLACEMENTS.reduce(
    (result, [source, target]) => result.replaceAll(source, target),
    repairMojibake(value),
  );

const humanizeCode = (value: string) =>
  repairMojibake(value)
    .replaceAll("_", " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();

const translateAction = (value: string) => {
  const normalized = value.trim();
  if (!normalized) {
    return "Sự kiện hệ thống";
  }

  const translatedPhrase = translateKnownPhrases(normalized);
  if (translatedPhrase !== normalized) {
    return translatedPhrase;
  }

  const actionKey = normalizeTextKey(normalized);
  return ACTION_LABELS[actionKey] || translateKnownPhrases(humanizeCode(normalized));
};

const translateResult = (value: string) => {
  const normalized = value.trim();
  if (!normalized) {
    return "Đã ghi nhận";
  }

  return (
    RESULT_LABELS[normalizeTextKey(normalized)] ||
    translateKnownPhrases(humanizeCode(normalized))
  );
};

const translateActor = (value: string) => {
  const normalized = value.trim();
  if (!normalized) {
    return "Quản trị viên hệ thống";
  }

  return ACTOR_LABELS[normalizeTextKey(normalized)] || repairMojibake(normalized);
};

const translateModule = (value: string) => {
  const normalized = value.trim();
  if (!normalized) {
    return "Hệ thống";
  }

  return MODULE_LABELS[normalizeTextKey(normalized)] || translateKnownPhrases(humanizeCode(normalized));
};

const translateTargetCode = (value: string) => {
  const normalized = value.trim();
  if (!normalized) {
    return "";
  }

  return TARGET_CODE_LABELS[normalizeTextKey(normalized)] || repairMojibake(normalized);
};

const translateDetail = (value: string) => {
  const normalized = value.trim();
  if (!normalized) {
    return "Bản ghi không có thêm chi tiết.";
  }

  return translateKnownPhrases(normalized);
};

const normalizeLegacyLog = (item: LegacyActivityLogItem): ActivityLogItem => {
  const action = translateAction(item.action?.trim() || "Sự kiện hệ thống");
  const actorName = translateActor(item.performedBy?.trim() || "Quản trị viên hệ thống");
  const targetName = repairMojibake(item.userName?.trim() || "") || "Người dùng";

  return {
    id: item.id ?? 0,
    eventType: "legacy_activity_log",
    occurredAt: item.performedAt?.trim() || "",
    occurredAtLabel: item.performedAt?.trim() || "Chưa có dữ liệu",
    actorName,
    actorRole: "Quản trị viên",
    moduleKey: "system",
    moduleLabel: "Nhật ký cũ",
    action,
    actionType: "Hoạt động đã ghi nhận",
    targetType: "Người dùng",
    targetName,
    targetCode: item.userId ? `USER-${item.userId}` : "",
    result: "Đã ghi nhận",
    severity: "trung bình",
    detail:
      item.detail?.trim() && item.detail.trim().length > 0
        ? translateDetail(item.detail)
        : `${action} được backend ghi nhận trong nhật ký sự kiện.`,
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
        ? repairMojibake(item.occurredAtLabel)
        : "Chưa có dữ liệu",
    actorName:
      typeof item.actorName === "string" && item.actorName.trim()
        ? translateActor(item.actorName)
        : "Quản trị viên hệ thống",
    actorRole:
      typeof item.actorRole === "string" && item.actorRole.trim()
        ? translateActor(item.actorRole)
        : "Quản trị viên",
    moduleKey:
      typeof item.moduleKey === "string" && item.moduleKey.trim() ? item.moduleKey : "system",
    moduleLabel:
      typeof item.moduleLabel === "string" && item.moduleLabel.trim()
        ? translateModule(item.moduleLabel)
        : "Hệ thống",
    action:
      typeof item.action === "string" && item.action.trim()
        ? translateAction(item.action)
        : "Sự kiện hệ thống",
    actionType:
      typeof item.actionType === "string" && item.actionType.trim()
        ? translateAction(item.actionType)
        : "Hoạt động đã ghi nhận",
    targetType:
      typeof item.targetType === "string" && item.targetType.trim()
        ? translateKnownPhrases(humanizeCode(item.targetType))
        : "Đối tượng hệ thống",
    targetName:
      typeof item.targetName === "string" && item.targetName.trim()
        ? translateKnownPhrases(item.targetName)
        : "Bản ghi hệ thống",
    targetCode: typeof item.targetCode === "string" ? translateTargetCode(item.targetCode) : "",
    result: typeof item.result === "string" ? translateResult(item.result) : "Đã ghi nhận",
    severity:
      item.severity === "thấp" || item.severity === "trung bình" || item.severity === "cao"
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
