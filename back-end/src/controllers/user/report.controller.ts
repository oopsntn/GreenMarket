import { Response } from "express";
import { and, count, eq, ne } from "drizzle-orm";
import { db } from "../../config/db.ts";
import { AuthRequest } from "../../dtos/auth.ts";
import { posts, reports, mediaAssets } from "../../models/schema/index.ts";
import { adminWebSettingsService } from "../../services/adminWebSettings.service.ts";
import { notificationService } from "../../services/notification.service.ts";

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
      evidenceUrls, // Array of image URLs
    } = req.body;

    const postId = Number(rawPostId);
    const reporterId = req.user?.id;

    if (!reporterId) {
      res.status(401).json({ error: "Vui lòng đăng nhập để gửi báo cáo" });
      return;
    }

    if (!Number.isInteger(postId) || postId <= 0 || !reportReason?.trim()) {
      res.status(400).json({ error: "Post ID and Reason are required" });
      return;
    }

    const [post] = await db
      .select({
        postId: posts.postId,
        postShopId: posts.postShopId,
        postStatus: posts.postStatus,
      })
      .from(posts)
      .where(eq(posts.postId, postId))
      .limit(1);

    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }

    // Use transaction to insert report and evidence
    const { result, totalReports, reportLimit } = await db.transaction(async (tx) => {
      const [newTicket] = await tx
        .insert(reports)
        .values({
          ticketType: 'REPORT',
          ticketCreatorId: reporterId,
          ticketTargetType: 'post',
          ticketTargetId: post.postId,
          ticketTitle: reportReasonCode?.trim() || null,
          ticketContent: reportReason.trim(),
          ticketMetaData: { note: reportNote?.trim() || null },
          ticketStatus: "pending",
        })
        .returning();

      // Legacy alias for logic below
      const newReport = {
        ...newTicket,
        reportId: newTicket.ticketId,
      };

        const evidenceData = evidenceUrls.map((url: string) => ({
          targetType: "report",
          targetId: newReport.reportId,
          mediaType: "image",
          url: url,
        }));
        await tx.insert(mediaAssets).values(evidenceData);

      const settings = await adminWebSettingsService.getSettings();
      const limit = Math.max(1, Number(settings.moderation.reportLimit || 0));
      const [reportCountRow] = await tx
        .select({ total: count() })
        .from(reports)
        .where(
          and(
            eq(reports.ticketType, 'REPORT'),
            eq(reports.ticketTargetType, 'post'),
            eq(reports.ticketTargetId, post.postId),
            ne(reports.ticketStatus, "ignored"),
          ),
        );

      return { result: newReport, totalReports: Number(reportCountRow?.total || 0), reportLimit: limit };
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

      // Notify the author that their post is under review due to reports
      const [fullPost] = await db.select({ title: posts.postTitle, authorId: posts.postAuthorId }).from(posts).where(eq(posts.postId, post.postId)).limit(1);
      if (fullPost && fullPost.authorId) {
        try {
          await notificationService.sendNotification({
            recipientId: fullPost.authorId,
            title: "Bài đăng tạm ẩn để xem xét",
            message: `Bài đăng "${fullPost.title}" của bạn tạm thời bị ẩn để quản trị viên đối soát sau khi nhận được một số báo cáo từ cộng đồng.`,
            type: "warning",
            metaData: { postId: post.postId, status: "pending" }
          });
        } catch (notifError) {
          console.error("Report author notification failed:", notifError);
        }
      }
    }

    // Notify ALL admins about the new report
    try {
      await notificationService.notifyAdmins({
        title: "Báo cáo mới",
        message: `Có báo cáo mới cho bài đăng ID #${post.postId}: "${reportReason}"`,
        type: "warning",
        metaData: { reportId: result.reportId, postId: post.postId }
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
    res.status(500).json({ error: "Lỗi máy chủ nội bộ. Vui lòng thử lại sau." });
  }
};
