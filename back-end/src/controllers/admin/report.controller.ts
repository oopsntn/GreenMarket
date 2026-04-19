import { Request, Response } from "express";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "../../config/db";
import { AuthRequest } from "../../dtos/auth.ts";
import { eventLogs } from "../../models/schema/index.ts";
import { postPromotions } from "../../models/schema/post-promotions.ts";
import { reports } from "../../models/schema/reports.ts";
import { posts } from "../../models/schema/posts.ts";
import { shops } from "../../models/schema/shops.ts";
import { users } from "../../models/schema/users.ts";
import { mediaAssets } from "../../models/schema/index.ts";
import { parseId } from "../../utils/parseId";

const reportSelection = {
  reportId: reports.reportId,
  reporterId: reports.reporterId,
  postId: reports.postId,
  reportShopId: reports.reportShopId,
  reportReasonCode: reports.reportReasonCode,
  reportReason: reports.reportReason,
  reportNote: reports.reportNote,
  reportStatus: reports.reportStatus,
  adminNote: reports.adminNote,
  reportCreatedAt: reports.reportCreatedAt,
  reportUpdatedAt: reports.reportUpdatedAt,
  reporterDisplayName: users.userDisplayName,
  reporterEmail: users.userEmail,
  postTitle: posts.postTitle,
  shopName: shops.shopName,
};

const attachEvidenceToReports = async <T extends { reportId: number }>(
  items: T[],
) => {
  if (items.length === 0) {
    return items.map((item) => ({ ...item, evidenceUrls: [] as string[] }));
  }

  const reportIds = new Set(items.map((item) => item.reportId));
  const evidenceRows = await db
    .select({
      reportId: mediaAssets.targetId,
      url: mediaAssets.url,
    })
    .from(mediaAssets)
    .where(eq(mediaAssets.targetType, "report"));

  const evidenceMap = new Map<number, string[]>();

  for (const row of evidenceRows) {
    if (!reportIds.has(row.reportId) || !row.url?.trim()) {
      continue;
    }

    const current = evidenceMap.get(row.reportId) ?? [];
    current.push(row.url.trim());
    evidenceMap.set(row.reportId, current);
  }

  return items.map((item) => ({
    ...item,
    evidenceUrls: evidenceMap.get(item.reportId) ?? [],
  }));
};

const closePromotionsForResolvedReport = async (
  postId: number | null,
  performedBy: string,
) => {
  if (!postId) {
    return 0;
  }

  const promotionRows = await db
    .select({
      id: postPromotions.postPromotionId,
      status: postPromotions.postPromotionStatus,
    })
    .from(postPromotions)
    .where(eq(postPromotions.postPromotionPostId, postId));

  const closablePromotionIds = promotionRows
    .filter((item) => {
      const normalizedStatus = item.status?.trim().toLowerCase() ?? "";
      return normalizedStatus !== "closed" && normalizedStatus !== "expired";
    })
    .map((item) => item.id);

  if (closablePromotionIds.length === 0) {
    return 0;
  }

  const closedPromotions = await db
    .update(postPromotions)
    .set({
      postPromotionStatus: "closed",
    })
    .where(
      inArray(postPromotions.postPromotionId, closablePromotionIds),
    )
    .returning({
      id: postPromotions.postPromotionId,
    });

  if (closedPromotions.length > 0) {
    await db.insert(eventLogs).values({
      eventLogUserId: null, // Should ideally be admin ID if available
      eventLogTargetType: "post",
      eventLogTargetId: postId,
      eventLogEventType: "admin_boosted_post_closed",
      eventLogEventTime: new Date(),
      eventLogMeta: {
        action: "Đóng quảng bá do báo cáo đúng",
        detail: `Đã đóng ${closedPromotions.length} quảng bá liên quan sau khi xác nhận báo cáo là đúng.`,
        performedBy,
        actorRole: "Quản trị viên",
        status: "closed",
      },
    });
  }

  return closedPromotions.length;
};

export const getReports = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const allReports = await db
      .select(reportSelection)
      .from(reports)
      .leftJoin(users, eq(reports.reporterId, users.userId))
      .leftJoin(posts, eq(reports.postId, posts.postId))
      .leftJoin(shops, eq(posts.postShopId, shops.shopId))
      .orderBy(desc(reports.reportCreatedAt), desc(reports.reportId));

    res.json(await attachEvidenceToReports(allReports));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

export const getReportById = async (
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> => {
  try {
    const idNumber = parseId(req.params.id);
    if (idNumber === null) {
      res.status(400).json({ error: "Mã báo cáo không hợp lệ" });
      return;
    }

    const [report] = await db
      .select(reportSelection)
      .from(reports)
      .leftJoin(users, eq(reports.reporterId, users.userId))
      .leftJoin(posts, eq(reports.postId, posts.postId))
      .leftJoin(shops, eq(posts.postShopId, shops.shopId))
      .where(eq(reports.reportId, idNumber))
      .limit(1);

    if (!report) {
      res.status(404).json({ error: "Không tìm thấy báo cáo" });
      return;
    }

    const [reportWithEvidence] = await attachEvidenceToReports([report]);
    res.json(reportWithEvidence);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

export const resolveReport = async (
  req: AuthRequest &
    Request<{ id: string }, {}, { status: string; adminNote?: string }>,
  res: Response,
): Promise<void> => {
  try {
    const idNumber = parseId(req.params.id);
    if (idNumber === null) {
      res.status(400).json({ error: "Mã báo cáo không hợp lệ" });
      return;
    }

    const { status, adminNote } = req.body;
    const normalizedStatus = status?.trim().toLowerCase();
    if (normalizedStatus !== "resolved" && normalizedStatus !== "dismissed") {
      res.status(400).json({ error: "Trạng thái báo cáo không hợp lệ" });
      return;
    }

    const performedBy =
      req.user?.name?.trim() ||
      req.user?.email?.trim() ||
      "Quản trị viên hệ thống";

    const [updatedReport] = await db
      .update(reports)
      .set({
        reportStatus: normalizedStatus as "resolved" | "dismissed",
        adminNote,
        reportUpdatedAt: new Date(),
      })
      .where(eq(reports.reportId, idNumber))
      .returning();

    if (!updatedReport) {
      res.status(404).json({ error: "Không tìm thấy báo cáo" });
      return;
    }

    const closedPromotionCount =
      normalizedStatus === "resolved"
        ? await closePromotionsForResolvedReport(
            updatedReport.postId ?? null,
            performedBy,
          )
        : 0;

    const [enrichedReport] = await db
      .select(reportSelection)
      .from(reports)
      .leftJoin(users, eq(reports.reporterId, users.userId))
      .leftJoin(posts, eq(reports.postId, posts.postId))
      .leftJoin(shops, eq(posts.postShopId, shops.shopId))
      .where(eq(reports.reportId, updatedReport.reportId))
      .limit(1);

    const actionLabel =
      normalizedStatus === "resolved" ? "Xử lý báo cáo" : "Bỏ qua báo cáo";
    const statusLabel =
      normalizedStatus === "resolved" ? "đã xử lý" : "đã bỏ qua";
    const promotionDetailSuffix =
      closedPromotionCount > 0
        ? ` Đã đóng ${closedPromotionCount} quảng bá liên quan.`
        : "";

    await db.insert(eventLogs).values({
      eventLogUserId: null, // Admin ID should be used here if available in req.user
      eventLogTargetType: updatedReport.postId ? "post" : (updatedReport.reportShopId ? "shop" : "report"),
      eventLogTargetId: updatedReport.postId || updatedReport.reportShopId || updatedReport.reportId,
      eventLogEventType:
        normalizedStatus === "resolved"
          ? "admin_report_resolved"
          : "admin_report_dismissed",
      eventLogEventTime: new Date(),
      eventLogMeta: {
        action: actionLabel,
        detail: adminNote?.trim()
          ? `Báo cáo #${updatedReport.reportId} đã được cập nhật sang trạng thái ${statusLabel}.${promotionDetailSuffix} Ghi chú: ${adminNote.trim()}`
          : `Báo cáo #${updatedReport.reportId} đã được cập nhật sang trạng thái ${statusLabel}.${promotionDetailSuffix}`,
        performedBy,
        actorRole: "Quản trị viên",
        status: normalizedStatus,
        reporterId: updatedReport.reporterId,
      },
    });

    if (!enrichedReport) {
      res.json(updatedReport);
      return;
    }

    const [reportWithEvidence] = await attachEvidenceToReports([enrichedReport]);
    res.json(reportWithEvidence);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};
