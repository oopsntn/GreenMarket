import { Response } from "express";
import { and, count, eq, ne } from "drizzle-orm";
import { db } from "../../config/db";
import { AuthRequest } from "../../dtos/auth";
import { posts, reports, mediaAssets, users, businessRoles } from "../../models/schema/index";
import { adminWebSettingsService } from "../../services/adminWebSettings.service";
import { notificationService } from "../../services/notification.service";

const isPositiveIntegerId = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

const getActiveManagerUserIds = async (): Promise<number[]> => {
  const [managerRole] = await db
    .select({ roleId: businessRoles.businessRoleId })
    .from(businessRoles)
    .where(eq(businessRoles.businessRoleCode, "MANAGER"))
    .limit(1);

  if (!managerRole?.roleId) {
    return [];
  }

  const managerUsers = await db
    .select({ userId: users.userId })
    .from(users)
    .where(and(eq(users.userBusinessRoleId, managerRole.roleId), eq(users.userStatus, "active")));

  return managerUsers.map((item) => item.userId);
};

const notifyManyUsers = async (
  recipientIds: number[],
  payloadFactory: (recipientId: number) => {
    title: string;
    message: string;
    type?: string;
    metaData?: Record<string, unknown>;
  },
) => {
  const uniqueRecipients = [...new Set(recipientIds.filter((id) => Number.isInteger(id) && id > 0))];

  await Promise.allSettled(
    uniqueRecipients.map((recipientId) =>
      notificationService.sendNotification({
        recipientId,
        ...payloadFactory(recipientId),
      }),
    ),
  );
};

export const submitReport = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const {
      postId: rawPostId,
      reportReason,
      reportReasonCode,
      reportNote,
      evidenceUrls,
    } = req.body;

    const postId = Number(rawPostId);
    const reporterId = req.user?.id;

    if (!reporterId) {
      res.status(401).json({ error: "Vui lòng đăng nhập trước khi gửi báo cáo." });
      return;
    }

    if (!Number.isInteger(postId) || postId <= 0 || !reportReason?.trim()) {
      res.status(400).json({
        error: "Vui lòng cung cấp mã bài đăng hợp lệ và lý do báo cáo.",
      });
      return;
    }

    const [post] = await db
      .select({
        postId: posts.postId,
        postShopId: posts.postShopId,
        postStatus: posts.postStatus,
        postTitle: posts.postTitle,
        postAuthorId: posts.postAuthorId,
      })
      .from(posts)
      .where(eq(posts.postId, postId))
      .limit(1);

    if (!post) {
      res.status(404).json({ error: "Không tìm thấy bài đăng cần báo cáo." });
      return;
    }

    const safeEvidenceUrls = Array.isArray(evidenceUrls)
      ? evidenceUrls.filter((url: unknown): url is string => typeof url === "string" && url.trim().length > 0)
      : [];

    const { result, totalReports, reportLimit } = await db.transaction(async (tx) => {
      const [newTicket] = await tx
        .insert(reports)
        .values({
          ticketType: "REPORT",
          ticketCreatorId: reporterId,
          ticketTargetType: "post",
          ticketTargetId: post.postId,
          ticketTitle: reportReasonCode?.trim() || null,
          ticketContent: reportReason.trim(),
          ticketMetaData: { note: reportNote?.trim() || null },
          ticketStatus: "pending",
        })
        .returning();

      const newReport = {
        ...newTicket,
        reportId: newTicket.ticketId,
      };

      if (safeEvidenceUrls.length > 0) {
        const evidenceData = safeEvidenceUrls.map((url: string) => ({
          targetType: "report",
          targetId: newReport.reportId,
          mediaType: "image",
          url,
        }));
        await tx.insert(mediaAssets).values(evidenceData);
      }

      const settings = await adminWebSettingsService.getSettings();
      const limit = Math.max(1, Number(settings.moderation.reportLimit || 0));
      const [reportCountRow] = await tx
        .select({ total: count() })
        .from(reports)
        .where(
          and(
            eq(reports.ticketType, "REPORT"),
            eq(reports.ticketTargetType, "post"),
            eq(reports.ticketTargetId, post.postId),
            ne(reports.ticketStatus, "ignored"),
          ),
        );

      return {
        result: newReport,
        totalReports: Number(reportCountRow?.total || 0),
        reportLimit: limit,
      };
    });

    const isModerated = totalReports >= reportLimit && post.postStatus === "approved";
    if (isModerated) {
      await db
        .update(posts)
        .set({
          postStatus: "pending",
          postPublished: false,
          postUpdatedAt: new Date(),
        })
        .where(eq(posts.postId, post.postId));
    }

    const reportedRecipientIds = [...new Set(
      [post.postAuthorId, post.postShopId].filter(
        (id): id is number => isPositiveIntegerId(id) && id !== reporterId,
      ),
    )];
    const managerRecipientIds = await getActiveManagerUserIds();

    try {
      await notificationService.sendNotification({
        recipientId: reporterId,
        title: "Đã ghi nhận báo cáo",
        message: `Báo cáo của bạn cho bài đăng "${post.postTitle}" đã được ghi nhận. Đội ngũ kiểm duyệt sẽ xem xét sớm.`,
        type: "info",
        metaData: {
          reportId: result.reportId,
          postId: post.postId,
          targetType: "post",
          reportReasonCode: reportReasonCode?.trim() || null,
        },
      });
    } catch (notifError) {
      console.error("Report submitter notification failed:", notifError);
    }

    try {
      await notifyManyUsers(reportedRecipientIds, () => ({
        title: "Bài đăng nhận báo cáo mới",
        message: isModerated
          ? `Bài đăng "${post.postTitle}" đã nhận thêm báo cáo từ cộng đồng và hiện đang chờ kiểm duyệt lại.`
          : `Bài đăng "${post.postTitle}" vừa nhận một báo cáo mới từ cộng đồng. Đội ngũ kiểm duyệt sẽ xem xét sớm.`,
        type: isModerated ? "warning" : "info",
        metaData: {
          reportId: result.reportId,
          postId: post.postId,
          targetType: "post",
          status: isModerated ? "pending" : "reported",
        },
      }));
    } catch (notifError) {
      console.error("Reported party notification failed:", notifError);
    }

    try {
      await notifyManyUsers(managerRecipientIds, () => ({
        title: "Có báo cáo mới cần kiểm tra",
        message: `Bài đăng "${post.postTitle}" vừa bị người dùng báo cáo. Vui lòng kiểm tra sớm.`,
        type: "warning",
        metaData: {
          reportId: result.reportId,
          postId: post.postId,
          targetType: "post",
        },
      }));
    } catch (notifError) {
      console.error("Manager report notification failed:", notifError);
    }

    try {
      await notificationService.notifyAdmins({
        title: "Có báo cáo mới",
        message: `Hệ thống vừa ghi nhận một báo cáo mới cho bài đăng "${post.postTitle}".`,
        type: "warning",
        metaData: { reportId: result.reportId, postId: post.postId },
      });
    } catch (notifError) {
      console.error("Admin report alert failed:", notifError);
    }

    res.status(201).json({
      message: "Báo cáo đã được gửi thành công. Quản trị viên sẽ xem xét trong thời gian sớm nhất.",
      report: result,
      moderationTriggered: isModerated,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Lỗi máy chủ nội bộ. Vui lòng thử lại sau.",
    });
  }
};
