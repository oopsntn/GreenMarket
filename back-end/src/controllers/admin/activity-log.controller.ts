import { Response } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../../config/db.ts";
import { AuthRequest } from "../../dtos/auth.ts";
import { eventLogs, users } from "../../models/schema/index.ts";

type EventLogMeta = {
  action?: string;
  detail?: string;
  performedBy?: string;
  generatedBy?: string;
  reportName?: string;
  status?: string;
  actorRole?: string;
  result?: string;
  moduleLabel?: string;
  targetType?: string;
  targetName?: string;
};

type ActivityModuleKey =
  | "users"
  | "shops"
  | "post-moderation"
  | "report-moderation"
  | "settings"
  | "templates"
  | "exports"
  | "system";

type EventDefinition = {
  actionLabel: string;
  moduleKey: ActivityModuleKey;
  moduleLabel: string;
  actionType: string;
  severity: "thấp" | "trung bình" | "cao";
  result: string;
  targetType: string;
};

const formatDateTimeLabel = (value: Date | string | null | undefined) => {
  if (!value) return "Chưa có dữ liệu";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có dữ liệu";

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const toIsoString = (value: Date | string | null | undefined) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString();
};

const eventDefinitionMap: Record<string, EventDefinition> = {
  admin_user_locked: {
    actionLabel: "Khóa tài khoản",
    moduleKey: "users",
    moduleLabel: "Người dùng",
    actionType: "Khóa / mở khóa",
    severity: "cao",
    result: "Đã khóa",
    targetType: "Tài khoản người dùng",
  },
  admin_user_unlocked: {
    actionLabel: "Mở khóa tài khoản",
    moduleKey: "users",
    moduleLabel: "Người dùng",
    actionType: "Khóa / mở khóa",
    severity: "trung bình",
    result: "Đã mở khóa",
    targetType: "Tài khoản người dùng",
  },
  admin_user_role_assigned: {
    actionLabel: "Cập nhật vai trò người dùng",
    moduleKey: "users",
    moduleLabel: "Người dùng",
    actionType: "Cập nhật vai trò",
    severity: "trung bình",
    result: "Đã cập nhật",
    targetType: "Tài khoản người dùng",
  },
  admin_post_approved: {
    actionLabel: "Duyệt bài đăng",
    moduleKey: "post-moderation",
    moduleLabel: "Kiểm duyệt bài đăng",
    actionType: "Kiểm duyệt",
    severity: "thấp",
    result: "Đã duyệt",
    targetType: "Bài đăng",
  },
  admin_post_rejected: {
    actionLabel: "Từ chối bài đăng",
    moduleKey: "post-moderation",
    moduleLabel: "Kiểm duyệt bài đăng",
    actionType: "Kiểm duyệt",
    severity: "cao",
    result: "Đã từ chối",
    targetType: "Bài đăng",
  },
  admin_post_hidden: {
    actionLabel: "Ẩn bài đăng",
    moduleKey: "post-moderation",
    moduleLabel: "Kiểm duyệt bài đăng",
    actionType: "Kiểm duyệt",
    severity: "cao",
    result: "Đã ẩn",
    targetType: "Bài đăng",
  },
  admin_post_drafted: {
    actionLabel: "Chuyển bài về nháp",
    moduleKey: "post-moderation",
    moduleLabel: "Kiểm duyệt bài đăng",
    actionType: "Kiểm duyệt",
    severity: "trung bình",
    result: "Đã chuyển nháp",
    targetType: "Bài đăng",
  },
  admin_post_status_updated: {
    actionLabel: "Cập nhật trạng thái bài đăng",
    moduleKey: "post-moderation",
    moduleLabel: "Kiểm duyệt bài đăng",
    actionType: "Cập nhật trạng thái",
    severity: "trung bình",
    result: "Đã cập nhật",
    targetType: "Bài đăng",
  },
  admin_report_resolved: {
    actionLabel: "Xử lý báo cáo",
    moduleKey: "report-moderation",
    moduleLabel: "Kiểm duyệt báo cáo",
    actionType: "Xử lý báo cáo",
    severity: "trung bình",
    result: "Đã xử lý",
    targetType: "Báo cáo",
  },
  admin_report_dismissed: {
    actionLabel: "Bỏ qua báo cáo",
    moduleKey: "report-moderation",
    moduleLabel: "Kiểm duyệt báo cáo",
    actionType: "Xử lý báo cáo",
    severity: "cao",
    result: "Đã bỏ qua",
    targetType: "Báo cáo",
  },
  admin_settings_updated: {
    actionLabel: "Cập nhật thiết lập hệ thống",
    moduleKey: "settings",
    moduleLabel: "Thiết lập hệ thống",
    actionType: "Cập nhật cấu hình",
    severity: "trung bình",
    result: "Đã lưu",
    targetType: "Thiết lập hệ thống",
  },
  admin_settings_reset: {
    actionLabel: "Khôi phục thiết lập hệ thống",
    moduleKey: "settings",
    moduleLabel: "Thiết lập hệ thống",
    actionType: "Khôi phục cấu hình",
    severity: "cao",
    result: "Đã khôi phục",
    targetType: "Thiết lập hệ thống",
  },
  admin_template_created: {
    actionLabel: "Tạo mẫu nội dung",
    moduleKey: "templates",
    moduleLabel: "Mẫu nội dung",
    actionType: "Tạo / chỉnh sửa mẫu",
    severity: "thấp",
    result: "Đã tạo",
    targetType: "Mẫu nội dung",
  },
  admin_template_updated: {
    actionLabel: "Cập nhật mẫu nội dung",
    moduleKey: "templates",
    moduleLabel: "Mẫu nội dung",
    actionType: "Tạo / chỉnh sửa mẫu",
    severity: "trung bình",
    result: "Đã cập nhật",
    targetType: "Mẫu nội dung",
  },
  admin_template_cloned: {
    actionLabel: "Nhân bản mẫu nội dung",
    moduleKey: "templates",
    moduleLabel: "Mẫu nội dung",
    actionType: "Nhân bản mẫu",
    severity: "thấp",
    result: "Đã nhân bản",
    targetType: "Mẫu nội dung",
  },
  admin_template_status_updated: {
    actionLabel: "Cập nhật trạng thái mẫu nội dung",
    moduleKey: "templates",
    moduleLabel: "Mẫu nội dung",
    actionType: "Bật / tắt mẫu",
    severity: "trung bình",
    result: "Đã cập nhật",
    targetType: "Mẫu nội dung",
  },
  admin_template_builder_updated: {
    actionLabel: "Cập nhật trình dựng mẫu",
    moduleKey: "templates",
    moduleLabel: "Mẫu nội dung",
    actionType: "Cập nhật builder",
    severity: "trung bình",
    result: "Đã lưu",
    targetType: "Trình dựng mẫu",
  },
  admin_template_builder_reset: {
    actionLabel: "Khôi phục trình dựng mẫu",
    moduleKey: "templates",
    moduleLabel: "Mẫu nội dung",
    actionType: "Khôi phục builder",
    severity: "cao",
    result: "Đã khôi phục",
    targetType: "Trình dựng mẫu",
  },
  admin_export: {
    actionLabel: "Xuất dữ liệu",
    moduleKey: "exports",
    moduleLabel: "Xuất dữ liệu",
    actionType: "Tạo tệp xuất",
    severity: "thấp",
    result: "Hoàn tất",
    targetType: "Tệp xuất dữ liệu",
  },
  admin_promotion_paused: {
    actionLabel: "Tạm dừng chiến dịch quảng bá",
    moduleKey: "system",
    moduleLabel: "Khuyến mãi",
    actionType: "Tạm dừng / tiếp tục",
    severity: "trung bình",
    result: "Đã tạm dừng",
    targetType: "Chiến dịch quảng bá",
  },
  admin_promotion_resumed: {
    actionLabel: "Tiếp tục chiến dịch quảng bá",
    moduleKey: "system",
    moduleLabel: "Khuyến mãi",
    actionType: "Tạm dừng / tiếp tục",
    severity: "trung bình",
    result: "Đã tiếp tục",
    targetType: "Chiến dịch quảng bá",
  },
  admin_promotion_package_changed: {
    actionLabel: "Đổi gói quảng bá",
    moduleKey: "system",
    moduleLabel: "Khuyến mãi",
    actionType: "Đổi gói / mở lại",
    severity: "cao",
    result: "Đã cập nhật",
    targetType: "Chiến dịch quảng bá",
  },
  admin_promotion_reopened: {
    actionLabel: "Mở lại chiến dịch quảng bá",
    moduleKey: "system",
    moduleLabel: "Khuyến mãi",
    actionType: "Đổi gói / mở lại",
    severity: "cao",
    result: "Đã mở lại",
    targetType: "Chiến dịch quảng bá",
  },
  admin_boosted_post_closed: {
    actionLabel: "Đóng chiến dịch quảng bá",
    moduleKey: "system",
    moduleLabel: "Khuyến mãi",
    actionType: "Đóng chiến dịch",
    severity: "cao",
    result: "Đã đóng",
    targetType: "Chiến dịch quảng bá",
  },
};

const getDefaultDefinition = (eventType: string | null): EventDefinition => {
  if (eventType && eventDefinitionMap[eventType]) {
    return eventDefinitionMap[eventType];
  }

  return {
    actionLabel: eventType
      ? eventType
          .split("_")
          .filter(Boolean)
          .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
          .join(" ")
      : "Sự kiện hệ thống",
    moduleKey: "system",
    moduleLabel: "Hệ thống",
    actionType: "Sự kiện hệ thống",
    severity: "trung bình",
    result: "Đã ghi nhận",
    targetType: "Bản ghi hệ thống",
  };
};

const resolveActorRole = (rowUserId: number | null, meta: EventLogMeta | null) => {
  if (meta?.actorRole?.trim()) {
    return meta.actorRole.trim();
  }

  if (meta?.performedBy?.trim() || meta?.generatedBy?.trim()) {
    return "Quản trị viên";
  }

  return rowUserId ? "Người dùng" : "Hệ thống";
};

const resolveTarget = (
  definition: EventDefinition,
  meta: EventLogMeta | null,
  row: {
    eventLogUserId: number | null;
    eventLogPostId: number | null;
    eventLogShopId: number | null;
    eventLogSlotId: number | null;
    eventLogCategoryId: number | null;
    userDisplayName: string | null;
    userEmail: string | null;
  },
) => {
  if (meta?.targetName?.trim()) {
    return {
      targetType: meta.targetType?.trim() || definition.targetType,
      targetName: meta.targetName.trim(),
      targetCode: "",
    };
  }

  if (row.eventLogPostId) {
    return {
      targetType: "Bài đăng",
      targetName: `Bài đăng #${row.eventLogPostId}`,
      targetCode: `POST-${row.eventLogPostId}`,
    };
  }

  if (row.eventLogShopId) {
    return {
      targetType: "Cửa hàng",
      targetName: `Cửa hàng #${row.eventLogShopId}`,
      targetCode: `SHOP-${row.eventLogShopId}`,
    };
  }

  if (row.eventLogSlotId) {
    return {
      targetType: "Vị trí hiển thị",
      targetName: `Vị trí #${row.eventLogSlotId}`,
      targetCode: `SLOT-${row.eventLogSlotId}`,
    };
  }

  if (row.eventLogCategoryId) {
    return {
      targetType: "Danh mục",
      targetName: `Danh mục #${row.eventLogCategoryId}`,
      targetCode: `CAT-${row.eventLogCategoryId}`,
    };
  }

  if (definition.moduleKey === "users") {
    const targetName =
      row.userDisplayName ||
      row.userEmail ||
      (row.eventLogUserId ? `Người dùng #${row.eventLogUserId}` : "Người dùng");

    return {
      targetType: definition.targetType,
      targetName,
      targetCode: row.eventLogUserId ? `USER-${row.eventLogUserId}` : "",
    };
  }

  if (definition.moduleKey === "settings") {
    return {
      targetType: definition.targetType,
      targetName: "Thiết lập hệ thống GreenMarket",
      targetCode: "SYSTEM-SETTINGS",
    };
  }

  if (definition.moduleKey === "templates") {
    return {
      targetType: definition.targetType,
      targetName: meta?.targetName?.trim() || "Mẫu nội dung",
      targetCode: "TEMPLATE",
    };
  }

  if (definition.moduleKey === "exports") {
    return {
      targetType: definition.targetType,
      targetName: meta?.reportName?.trim() || "Tệp xuất dữ liệu",
      targetCode: "EXPORT",
    };
  }

  return {
    targetType: definition.targetType,
    targetName: meta?.targetName?.trim() || "Bản ghi hệ thống",
    targetCode: "",
  };
};

export const getActivityLogs = async (
  _req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const rows = await db
      .select({
        eventLogId: eventLogs.eventLogId,
        eventLogUserId: eventLogs.eventLogUserId,
        eventLogPostId: eventLogs.eventLogPostId,
        eventLogShopId: eventLogs.eventLogShopId,
        eventLogSlotId: eventLogs.eventLogSlotId,
        eventLogCategoryId: eventLogs.eventLogCategoryId,
        eventLogEventType: eventLogs.eventLogEventType,
        eventLogEventTime: eventLogs.eventLogEventTime,
        eventLogMeta: eventLogs.eventLogMeta,
        userDisplayName: users.userDisplayName,
        userEmail: users.userEmail,
      })
      .from(eventLogs)
      .leftJoin(users, eq(eventLogs.eventLogUserId, users.userId))
      .orderBy(desc(eventLogs.eventLogEventTime));

    res.json(
      rows.map((row) => {
        const meta = row.eventLogMeta as EventLogMeta | null;
        const definition = getDefaultDefinition(row.eventLogEventType);
        const action = meta?.action?.trim() || definition.actionLabel;
        const actorName =
          meta?.performedBy?.trim() ||
          meta?.generatedBy?.trim() ||
          "Quản trị viên hệ thống";
        const actorRole = resolveActorRole(row.eventLogUserId, meta);
        const target = resolveTarget(definition, meta, row);
        const detail =
          meta?.detail?.trim() ||
          meta?.reportName?.trim() ||
          `${action} được backend ghi nhận trong nhật ký sự kiện.`;
        const result =
          meta?.result?.trim() || meta?.status?.trim() || definition.result;

        return {
          id: row.eventLogId,
          eventType: row.eventLogEventType || "system_event",
          occurredAt: toIsoString(row.eventLogEventTime),
          occurredAtLabel: formatDateTimeLabel(row.eventLogEventTime),
          actorName,
          actorRole,
          moduleKey: definition.moduleKey,
          moduleLabel: meta?.moduleLabel?.trim() || definition.moduleLabel,
          action,
          actionType: definition.actionType,
          targetType: target.targetType,
          targetName: target.targetName,
          targetCode: target.targetCode,
          result,
          severity: definition.severity,
          detail,
          relatedIds: {
            userId: row.eventLogUserId,
            postId: row.eventLogPostId,
            shopId: row.eventLogShopId,
            slotId: row.eventLogSlotId,
            categoryId: row.eventLogCategoryId,
          },
        };
      }),
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};
