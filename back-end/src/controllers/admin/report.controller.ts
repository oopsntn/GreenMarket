import { Request, Response } from "express";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "../../config/db";
import { AuthRequest } from "../../dtos/auth.ts";
import { adminTemplates } from "../../models/schema/admin-templates.ts";
import { eventLogs } from "../../models/schema/index.ts";
import { postPromotions } from "../../models/schema/post-promotions.ts";
import { posts } from "../../models/schema/posts.ts";
import { reportEvidence } from "../../models/schema/report-evidence.ts";
import { reports } from "../../models/schema/reports.ts";
import { shops } from "../../models/schema/shops.ts";
import { users } from "../../models/schema/users.ts";
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
      reportId: reportEvidence.reportEvidenceReportId,
      url: reportEvidence.reportEvidenceUrl,
    })
    .from(reportEvidence);

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

const getTemplateAuditMeta = async (templateId?: number) => {
  if (typeof templateId !== "number" || !Number.isFinite(templateId)) {
    return null;
  }

  const [template] = await db
    .select({
      templateId: adminTemplates.templateId,
      templateName: adminTemplates.templateName,
      templateType: adminTemplates.templateType,
    })
    .from(adminTemplates)
    .where(eq(adminTemplates.templateId, templateId))
    .limit(1);

  return template ?? null;
};

type TemplateAuditLogMeta = {
  templateId?: number | null;
  templateName?: string | null;
  templateType?: string | null;
  finalMessage?: string | null;
};

const getReportTemplateAuditMeta = async (reportId: number) => {
  const eventRows = await db
    .select({
      eventLogMeta: eventLogs.eventLogMeta,
    })
    .from(eventLogs)
    .where(
      inArray(eventLogs.eventLogEventType, [
        "admin_report_resolved",
        "admin_report_dismissed",
      ]),
    )
    .orderBy(desc(eventLogs.eventLogEventTime), desc(eventLogs.eventLogId))
    .limit(50);

  const matchedEvent = eventRows.find((row) => {
    if (!row.eventLogMeta || typeof row.eventLogMeta !== "object") {
      return false;
    }

    const meta = row.eventLogMeta as Record<string, unknown>;
    return meta.reportId === reportId;
  });

  const meta = (matchedEvent?.eventLogMeta ?? null) as TemplateAuditLogMeta &
    Record<string, unknown> | null;

  if (!meta?.templateName && !meta?.templateId) {
    return null;
  }

  return {
    templateId:
      typeof meta.templateId === "number" ? meta.templateId : null,
    templateName:
      typeof meta.templateName === "string" ? meta.templateName : null,
    templateType:
      typeof meta.templateType === "string" ? meta.templateType : null,
    finalMessage:
      typeof meta.finalMessage === "string" ? meta.finalMessage : null,
  };
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
    .where(inArray(postPromotions.postPromotionId, closablePromotionIds))
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
  _req: Request,
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
    const templateAudit = await getReportTemplateAuditMeta(idNumber);
    res.json({
      ...reportWithEvidence,
      templateAudit,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

export const resolveReport = async (
  req: AuthRequest &
    Request<
      { id: string },
      {},
      { status: string; adminNote?: string; templateId?: number }
    >,
  res: Response,
): Promise<void> => {
  try {
    const idNumber = parseId(req.params.id);
    if (idNumber === null) {
      res.status(400).json({ error: "Mã báo cáo không hợp lệ" });
      return;
    }

    const { status, adminNote, templateId } = req.body;
    const normalizedStatus = status?.trim().toLowerCase();
    if (normalizedStatus !== "resolved" && normalizedStatus !== "dismissed") {
      res.status(400).json({ error: "Trạng thái báo cáo không hợp lệ" });
      return;
    }

    const performedBy =
      req.user?.name?.trim() ||
      req.user?.email?.trim() ||
      "Quản trị viên hệ thống";

    const selectedTemplate = await getTemplateAuditMeta(templateId);
    if (templateId !== undefined && !selectedTemplate) {
      res.status(400).json({ error: "Mẫu nội dung không hợp lệ" });
      return;
    }

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
        reportId: updatedReport.reportId,
        action: actionLabel,
        detail: adminNote?.trim()
          ? `Báo cáo #${updatedReport.reportId} đã được cập nhật sang trạng thái ${statusLabel}.${promotionDetailSuffix} Ghi chú: ${adminNote.trim()}`
          : `Báo cáo #${updatedReport.reportId} đã được cập nhật sang trạng thái ${statusLabel}.${promotionDetailSuffix}`,
        performedBy,
        actorRole: "Quản trị viên",
        status: normalizedStatus,
        templateId: selectedTemplate?.templateId ?? null,
        templateName: selectedTemplate?.templateName ?? null,
        templateType: selectedTemplate?.templateType ?? null,
        finalMessage: adminNote?.trim() || null,
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
