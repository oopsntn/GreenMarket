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
};

const formatDateTime = (value: Date | string | null | undefined) => {
  if (!value) return "Chưa có dữ liệu";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có dữ liệu";

  return `${date.toISOString().slice(0, 10)} ${String(date.getHours()).padStart(
    2,
    "0",
  )}:${String(date.getMinutes()).padStart(2, "0")}`;
};

const eventTypeLabelMap: Record<string, string> = {
  admin_user_locked: "Khóa tài khoản",
  admin_user_unlocked: "Mở khóa tài khoản",
  admin_user_role_assigned: "Gán vai trò",
  admin_post_approved: "Duyệt bài đăng",
  admin_post_rejected: "Từ chối bài đăng",
  admin_post_hidden: "Ẩn bài đăng",
  admin_post_drafted: "Chuyển về nháp",
  admin_post_status_updated: "Cập nhật trạng thái bài đăng",
  admin_report_resolved: "Xử lý báo cáo",
  admin_report_dismissed: "Bỏ qua báo cáo",
  admin_settings_updated: "Cập nhật thiết lập hệ thống",
  admin_settings_reset: "Khôi phục thiết lập hệ thống",
  admin_template_created: "Tạo mẫu nội dung",
  admin_template_updated: "Cập nhật mẫu nội dung",
  admin_template_cloned: "Nhân bản mẫu nội dung",
  admin_template_status_updated: "Cập nhật trạng thái mẫu nội dung",
  admin_template_builder_updated: "Cập nhật trình dựng mẫu",
  admin_template_builder_reset: "Khôi phục trình dựng mẫu",
};

const titleCaseEventType = (value: string | null) => {
  if (!value) return "Sự kiện hệ thống";

  if (eventTypeLabelMap[value]) {
    return eventTypeLabelMap[value];
  }

  return value
    .split("_")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
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
        const action =
          meta?.action || titleCaseEventType(row.eventLogEventType);
        const performedBy =
          meta?.performedBy || meta?.generatedBy || "Quản trị viên hệ thống";
        const userName =
          row.userDisplayName ||
          row.userEmail ||
          (row.eventLogUserId ? `Người dùng #${row.eventLogUserId}` : "Hệ thống");

        return {
          id: row.eventLogId,
          userId: row.eventLogUserId ?? 0,
          userName,
          action,
          detail:
            meta?.detail ||
            meta?.reportName ||
            `${action} được backend ghi nhận trong nhật ký sự kiện.`,
          performedBy,
          performedAt: formatDateTime(row.eventLogEventTime),
        };
      }),
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};
