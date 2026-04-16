import { Response } from "express";
import { and, count, eq, ne } from "drizzle-orm";
import { db } from "../../config/db.ts";
import { AuthRequest } from "../../dtos/auth.ts";
import { posts } from "../../models/schema/posts.ts";
import { reports } from "../../models/schema/reports.ts";
import { adminWebSettingsService } from "../../services/adminWebSettings.service.ts";

export const submitReport = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const {
      reporterId: rawReporterId,
      postId: rawPostId,
      reportReason,
      reportReasonCode,
      reportNote,
    } = req.body;

    const postId = Number(rawPostId);
    const fallbackReporterId = Number(rawReporterId);
    const effectiveReporterId =
      typeof req.user?.id === "number" && Number.isInteger(req.user.id)
        ? req.user.id
        : Number.isInteger(fallbackReporterId) && fallbackReporterId > 0
          ? fallbackReporterId
          : null;

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

    const [newReport] = await db
      .insert(reports)
      .values({
        reporterId: effectiveReporterId,
        postId: post.postId,
        reportShopId: post.postShopId ?? null,
        reportReasonCode: reportReasonCode?.trim() || null,
        reportReason: reportReason.trim(),
        reportNote: reportNote?.trim() || null,
        reportStatus: "pending",
      })
      .returning();

    const settings = await adminWebSettingsService.getSettings();
    const reportLimit = Math.max(1, Number(settings.moderation.reportLimit || 0));
    const [reportCountRow] = await db
      .select({ total: count() })
      .from(reports)
      .where(
        and(
          eq(reports.postId, post.postId),
          ne(reports.reportStatus, "ignored"),
        ),
      );

    const totalReports = Number(reportCountRow?.total || 0);
    if (totalReports >= reportLimit && post.postStatus === "approved") {
      await db
        .update(posts)
        .set({
          postStatus: "pending",
          postPublished: false,
          postUpdatedAt: new Date(),
        })
        .where(eq(posts.postId, post.postId));
    }

    res.status(201).json({
      message: "Report submitted successfully. Admin will review it shortly.",
      report: newReport,
      moderationTriggered: totalReports >= reportLimit && post.postStatus === "approved",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
