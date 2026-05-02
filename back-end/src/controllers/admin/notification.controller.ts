import { Request, Response } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../../config/db.ts";
import { AuthRequest } from "../../dtos/auth";
import {
  adminTemplates,
  eventLogs,
  users,
} from "../../models/schema/index.ts";
import { notificationService } from "../../services/notification.service.ts";

const MANUAL_NOTIFICATION_EVENT = "admin_manual_notification_sent";
const HISTORY_LIMIT = 20;

type NotificationScope = "single" | "all_users";
type NotificationType = "info" | "success" | "warning" | "error";

type SendNotificationPayload = {
  scope?: string;
  recipientId?: number | string | null;
  title?: string;
  message?: string;
  type?: string;
  templateId?: number | string | null;
};

type NotificationTemplateAudit = {
  templateId: number;
  templateName: string;
  templateType: string;
};

type NotificationHistoryMeta = {
  scope: NotificationScope;
  recipientId?: number | null;
  recipientName?: string;
  recipientCount: number;
  title: string;
  finalMessage: string;
  notificationType: NotificationType;
  template?: NotificationTemplateAudit | null;
  performedBy: string;
};

const normalizeString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const isNotificationScope = (value: unknown): value is NotificationScope =>
  value === "single" || value === "all_users";

const normalizeNotificationType = (value: unknown): NotificationType => {
  if (
    value === "info" ||
    value === "success" ||
    value === "warning" ||
    value === "error"
  ) {
    return value;
  }

  return "info";
};

const normalizeRecipientId = (value: unknown) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const getPerformedBy = (req: AuthRequest) => {
  return (
    normalizeString(req.user?.name) ||
    normalizeString(req.user?.email) ||
    "Quản trị viên hệ thống"
  );
};

const buildTemplateAudit = async (templateId: number | null) => {
  if (!templateId) {
    return null;
  }

  const [template] = await db
    .select({
      templateId: adminTemplates.templateId,
      templateName: adminTemplates.templateName,
      templateType: adminTemplates.templateType,
      templateStatus: adminTemplates.templateStatus,
    })
    .from(adminTemplates)
    .where(eq(adminTemplates.templateId, templateId))
    .limit(1);

  if (!template) {
    throw new Error("Mẫu nội dung không tồn tại.");
  }

  if (template.templateType !== "Notification") {
    throw new Error("Chỉ được dùng mẫu thuộc loại Thông báo.");
  }

  if ((template.templateStatus || "Active") !== "Active") {
    throw new Error("Mẫu nội dung đang bị tắt.");
  }

  return {
    templateId: template.templateId,
    templateName: template.templateName,
    templateType: template.templateType,
  } satisfies NotificationTemplateAudit;
};

const getActiveRecipients = async (scope: NotificationScope, recipientId: number | null) => {
  if (scope === "single") {
    if (!recipientId) {
      throw new Error("Vui lòng chọn người nhận.");
    }

    const recipients = await db
      .select({
        userId: users.userId,
        userDisplayName: users.userDisplayName,
        userEmail: users.userEmail,
        userStatus: users.userStatus,
      })
      .from(users)
      .where(eq(users.userId, recipientId))
      .limit(1);

    if (recipients.length === 0) {
      throw new Error("Không tìm thấy người nhận.");
    }

    if ((recipients[0].userStatus || "active").toLowerCase() !== "active") {
      throw new Error("Người nhận hiện không ở trạng thái hoạt động.");
    }

    return recipients;
  }

  return db
    .select({
      userId: users.userId,
      userDisplayName: users.userDisplayName,
      userEmail: users.userEmail,
      userStatus: users.userStatus,
    })
    .from(users)
    .where(eq(users.userStatus, "active"));
};

const buildRecipientName = (recipient: {
  userDisplayName: string | null;
  userEmail: string | null;
  userId: number;
}) => {
  return (
    normalizeString(recipient.userDisplayName) ||
    normalizeString(recipient.userEmail) ||
    `Người dùng #${recipient.userId}`
  );
};

const mapHistoryItem = (item: {
  eventLogId: number;
  eventLogEventTime: Date | null;
  eventLogMeta: unknown;
}) => {
  const meta = (item.eventLogMeta || {}) as Partial<NotificationHistoryMeta>;
  const template = meta.template ?? null;

  return {
    id: item.eventLogId,
    sentAt: item.eventLogEventTime,
    scope: meta.scope === "all_users" ? "all_users" : "single",
    recipientName:
      meta.scope === "all_users"
        ? "Toàn bộ người dùng"
        : meta.recipientName || "Người dùng chưa xác định",
    recipientCount: Number(meta.recipientCount) || 0,
    title: meta.title || "Không có tiêu đề",
    message: meta.finalMessage || "",
    type: meta.notificationType || "info",
    performedBy: meta.performedBy || "Quản trị viên hệ thống",
    template: template
      ? {
          templateId: Number(template.templateId) || 0,
          templateName: template.templateName || "Mẫu không xác định",
          templateType: template.templateType || "Notification",
        }
      : null,
  };
};

export const sendAdminNotification = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const payload = req.body as SendNotificationPayload;
    const scope = isNotificationScope(payload.scope) ? payload.scope : null;
    const title = normalizeString(payload.title);
    const message = normalizeString(payload.message);
    const notificationType = normalizeNotificationType(payload.type);
    const recipientId = normalizeRecipientId(payload.recipientId);
    const templateId = normalizeRecipientId(payload.templateId);

    if (!scope) {
      res.status(400).json({ error: "Phạm vi gửi không hợp lệ." });
      return;
    }

    if (!title) {
      res.status(400).json({ error: "Tiêu đề thông báo là bắt buộc." });
      return;
    }

    if (!message) {
      res.status(400).json({ error: "Nội dung thông báo là bắt buộc." });
      return;
    }

    const [template, recipients] = await Promise.all([
      buildTemplateAudit(templateId),
      getActiveRecipients(scope, recipientId),
    ]);

    if (recipients.length === 0) {
      res.status(400).json({ error: "Không có người dùng hoạt động để gửi." });
      return;
    }

    const finalMessage = message;
    const performedBy = getPerformedBy(req);

    await Promise.all(
      recipients.map((recipient) =>
        notificationService.sendNotification({
          recipientId: recipient.userId,
          title,
          message: finalMessage,
          type: notificationType,
          metaData: {
            source: "admin_manual_notification",
            scope,
            templateId: template?.templateId ?? null,
          },
        }),
      ),
    );

    const firstRecipient = scope === "single" ? recipients[0] : null;

    const historyMeta: NotificationHistoryMeta = {
      scope,
      recipientId: firstRecipient?.userId ?? null,
      recipientName: firstRecipient ? buildRecipientName(firstRecipient) : undefined,
      recipientCount: recipients.length,
      title,
      finalMessage,
      notificationType,
      template,
      performedBy,
    };

    await db.insert(eventLogs).values({
      eventLogUserId: null,
      eventLogEventType: MANUAL_NOTIFICATION_EVENT,
      eventLogEventTime: new Date(),
      eventLogMeta: historyMeta,
    });

    res.status(201).json({
      message: "Đã gửi thông báo thành công.",
      data: {
        scope,
        recipientCount: recipients.length,
        title,
        type: notificationType,
        template,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error:
        error instanceof Error ? error.message : "Không thể gửi thông báo.",
    });
  }
};

export const getAdminNotificationHistory = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const history = await db
      .select({
        eventLogId: eventLogs.eventLogId,
        eventLogEventTime: eventLogs.eventLogEventTime,
        eventLogMeta: eventLogs.eventLogMeta,
      })
      .from(eventLogs)
      .where(eq(eventLogs.eventLogEventType, MANUAL_NOTIFICATION_EVENT))
      .orderBy(desc(eventLogs.eventLogEventTime))
      .limit(HISTORY_LIMIT);

    res.json({
      data: history.map(mapHistoryItem),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Không thể tải lịch sử thông báo." });
  }
};
