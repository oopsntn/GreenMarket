import { Request, Response } from "express";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "../../config/db";
import { AuthRequest } from "../../dtos/auth.ts";
import { adminTemplates } from "../../models/schema/admin-templates.ts";
import { eventLogs, mediaAssets } from "../../models/schema/index.ts";
import { postAttributeValues } from "../../models/schema/post-attribute-values";
import { posts, type NewPost } from "../../models/schema/posts";
import { notificationService } from "../../services/notification.service.ts";
import { postLifecycleService } from "../../services/postLifecycle.service.ts";
import { parseId } from "../../utils/parseId";
import { slugify } from "../../utils/slugify";

const getPostActionLabel = (status: string) => {
  switch (status.toLowerCase()) {
    case "approved":
      return "Duyệt bài đăng";
    case "rejected":
      return "Từ chối bài đăng";
    case "hidden":
      return "Ẩn bài đăng";
    case "draft":
      return "Chuyển bài đăng về nháp";
    case "pending":
    default:
      return "Cập nhật trạng thái bài đăng";
  }
};

const getPostEventType = (status: string) => {
  switch (status.toLowerCase()) {
    case "approved":
      return "admin_post_approved";
    case "rejected":
      return "admin_post_rejected";
    case "hidden":
      return "admin_post_hidden";
    case "draft":
      return "admin_post_drafted";
    case "pending":
    default:
      return "admin_post_status_updated";
  }
};

const ALLOWED_POST_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["approved", "rejected", "hidden"],
  approved: ["hidden"],
  rejected: ["approved", "hidden"],
  hidden: ["approved"],
  draft: ["approved", "rejected", "hidden"],
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

const getPostTemplateAuditMeta = async (postId: number) => {
  const [latestEvent] = await db
    .select({
      eventLogMeta: eventLogs.eventLogMeta,
    })
    .from(eventLogs)
    .where(
      and(
        eq(eventLogs.eventLogTargetType, "post"),
        eq(eventLogs.eventLogTargetId, postId),
        inArray(eventLogs.eventLogEventType, [
          "admin_post_approved",
          "admin_post_rejected",
          "admin_post_hidden",
          "admin_post_drafted",
          "admin_post_status_updated",
        ]),
      ),
    )
    .orderBy(desc(eventLogs.eventLogEventTime), desc(eventLogs.eventLogId))
    .limit(1);

  const meta = (latestEvent?.eventLogMeta ?? null) as TemplateAuditLogMeta | null;
  if (!meta?.templateName && !meta?.templateId) {
    return null;
  }

  return {
    templateId: typeof meta.templateId === "number" ? meta.templateId : null,
    templateName: typeof meta.templateName === "string" ? meta.templateName : null,
    templateType: typeof meta.templateType === "string" ? meta.templateType : null,
    finalMessage: typeof meta.finalMessage === "string" ? meta.finalMessage : null,
  };
};

export const getPosts = async (_req: Request, res: Response): Promise<void> => {
  try {
    await postLifecycleService.syncAutoExpiredPosts();
    const allPosts = await db.select().from(posts);
    res.json(allPosts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

export const createPost = async (
  req: Request<
    {},
    {},
    NewPost & {
      images?: string[];
      attributes?: { id: number; value: string }[];
    }
  >,
  res: Response,
): Promise<void> => {
  try {
    const { images, attributes: attrValues, ...postData } = req.body;
    const finalSlug = postData.postSlug || slugify(postData.postTitle);

    const [newPost] = await db
      .insert(posts)
      .values({
        ...postData,
        postSlug: finalSlug,
      })
      .returning();

    if (images && images.length > 0) {
      await db.insert(mediaAssets).values(
        images.map((url, index) => ({
          targetType: "post",
          targetId: newPost.postId,
          mediaType: "image",
          url,
          sortOrder: index,
        })),
      );
    }

    if (attrValues && attrValues.length > 0) {
      await db.insert(postAttributeValues).values(
        attrValues.map((attr) => ({
          postId: newPost.postId,
          attributeId: attr.id,
          attributeValue: attr.value,
        })),
      );
    }

    res.status(201).json(newPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

export const getPostById = async (
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> => {
  try {
    await postLifecycleService.syncAutoExpiredPosts();
    const idNumber = parseId(req.params.id);
    if (idNumber === null) {
      res.status(400).json({ error: "Mã bài đăng không hợp lệ" });
      return;
    }

    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.postId, idNumber))
      .limit(1);

    if (!post) {
      res.status(404).json({ error: "Không tìm thấy bài đăng" });
      return;
    }

    const images = await db
      .select({
        imageId: mediaAssets.assetId,
        imageUrl: mediaAssets.url,
        imageSortOrder: mediaAssets.sortOrder,
      })
      .from(mediaAssets)
      .where(
        and(
          eq(mediaAssets.targetType, "post"),
          eq(mediaAssets.targetId, idNumber),
          eq(mediaAssets.mediaType, "image"),
        ),
      );
    const attrValues = await db
      .select()
      .from(postAttributeValues)
      .where(eq(postAttributeValues.postId, idNumber));
    const templateAudit = await getPostTemplateAuditMeta(idNumber);

    res.json({
      ...post,
      images,
      attributes: attrValues,
      templateAudit,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

export const updatePostStatus = async (
  req: AuthRequest &
    Request<
      { id: string },
      {},
      {
        status: string;
        reason?: string;
        adminName?: string;
        templateId?: number;
      }
    >,
  res: Response,
): Promise<void> => {
  try {
    const idNumber = parseId(req.params.id);
    if (idNumber === null) {
      res.status(400).json({ error: "Mã bài đăng không hợp lệ" });
      return;
    }

    const { status, reason, templateId } = req.body;
    const normalizedStatus = status?.trim().toLowerCase();
    const performedBy =
      req.user?.name?.trim() ||
      req.user?.email?.trim() ||
      "Quản trị viên hệ thống";

    if (!normalizedStatus) {
      res.status(400).json({ error: "Trạng thái bài đăng là bắt buộc" });
      return;
    }

    const selectedTemplate = await getTemplateAuditMeta(templateId);
    if (templateId !== undefined && !selectedTemplate) {
      res.status(400).json({ error: "Mẫu nội dung không hợp lệ" });
      return;
    }

    const [currentPost] = await db
      .select()
      .from(posts)
      .where(eq(posts.postId, idNumber))
      .limit(1);

    if (!currentPost) {
      res.status(404).json({ error: "Không tìm thấy bài đăng" });
      return;
    }

    const currentStatus = currentPost.postStatus.trim().toLowerCase();
    const allowedTransitions =
      ALLOWED_POST_STATUS_TRANSITIONS[currentStatus] ?? [];

    if (!allowedTransitions.includes(normalizedStatus)) {
      res.status(400).json({
        error: `Không thể chuyển bài đăng từ trạng thái ${currentStatus} sang ${normalizedStatus}.`,
      });
      return;
    }

    const shouldPublish = normalizedStatus === "approved";
    const nextRejectedReason =
      normalizedStatus === "rejected" || normalizedStatus === "hidden"
        ? reason?.trim() || null
        : null;

    const [updatedPost] = await db
      .update(posts)
      .set({
        postStatus: normalizedStatus as NewPost["postStatus"],
        postRejectedReason: nextRejectedReason,
        postPublished: shouldPublish,
        postPublishedAt: shouldPublish
          ? currentPost.postPublishedAt ?? new Date()
          : null,
        postModeratedAt: new Date(),
        postUpdatedAt: new Date(),
      })
      .where(eq(posts.postId, idNumber))
      .returning();

    await db.insert(eventLogs).values({
      eventLogUserId: req.user?.id || null,
      eventLogTargetType: "post",
      eventLogTargetId: updatedPost.postId,
      eventLogEventType: getPostEventType(normalizedStatus),
      eventLogEventTime: new Date(),
      eventLogMeta: {
        action: getPostActionLabel(normalizedStatus),
        detail: nextRejectedReason
          ? `Bài đăng "${updatedPost.postTitle}" được cập nhật sang trạng thái ${normalizedStatus}. Ghi chú: ${nextRejectedReason}`
          : `Bài đăng "${updatedPost.postTitle}" được cập nhật sang trạng thái ${normalizedStatus}.`,
        performedBy,
        actorRole: "Quản trị viên",
        status: normalizedStatus,
        categoryId: updatedPost.categoryId,
        shopId: updatedPost.postShopId,
        authorId: updatedPost.postAuthorId,
        templateId: selectedTemplate?.templateId ?? null,
        templateName: selectedTemplate?.templateName ?? null,
        templateType: selectedTemplate?.templateType ?? null,
        finalMessage: nextRejectedReason || null,
      },
    });

    const notificationTitles: Record<string, string> = {
      approved: "Bài đăng đã được duyệt",
      rejected: "Bài đăng bị từ chối",
      hidden: "Bài đăng đã bị ẩn",
      draft: "Bài đăng chuyển về nháp",
      pending: "Bài đăng đang chờ duyệt",
    };

    const notificationType =
      normalizedStatus === "approved"
        ? "success"
        : normalizedStatus === "rejected"
          ? "error"
          : "warning";

    if (updatedPost.postAuthorId && notificationTitles[normalizedStatus]) {
      try {
        await notificationService.sendNotification({
          recipientId: updatedPost.postAuthorId,
          title: notificationTitles[normalizedStatus],
          message: nextRejectedReason
            ? `Bài đăng "${updatedPost.postTitle}" của bạn đã được cập nhật sang trạng thái ${normalizedStatus}. Lý do: ${nextRejectedReason}`
            : `Bài đăng "${updatedPost.postTitle}" của bạn đã được duyệt thành công và đang hiển thị trên sàn.`,
          type: notificationType,
          metaData: {
            postId: updatedPost.postId,
            status: normalizedStatus,
          },
        });
      } catch (notifError) {
        console.error(
          "Moderation notification failed (postId:",
          updatedPost.postId,
          "):",
          notifError,
        );
      }
    }

    res.json(updatedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

export const deletePost = async (
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> => {
  try {
    const idNumber = parseId(req.params.id);
    const authReq = req as AuthRequest;
    const { reason, templateId } = req.body;
    const performedBy =
      authReq.user?.name?.trim() ||
      authReq.user?.email?.trim() ||
      "Quản trị viên hệ thống";

    if (idNumber === null) {
      res.status(400).json({ error: "Mã bài đăng không hợp lệ" });
      return;
    }

    const selectedTemplate = await getTemplateAuditMeta(templateId);
    if (templateId !== undefined && !selectedTemplate) {
      res.status(400).json({ error: "Mẫu nội dung không hợp lệ" });
      return;
    }

    const [deletedPost] = await db
      .update(posts)
      .set({
        postStatus: "hidden",
        postDeletedAt: new Date(),
        postUpdatedAt: new Date(),
        postPublished: false,
        postPublishedAt: null,
      })
      .where(eq(posts.postId, idNumber))
      .returning();

    if (!deletedPost) {
      res.status(404).json({ error: "Không tìm thấy bài đăng" });
      return;
    }

    await db.insert(eventLogs).values({
      eventLogUserId: authReq.user?.id || null,
      eventLogTargetType: "post",
      eventLogTargetId: deletedPost.postId,
      eventLogEventType: "admin_post_hidden",
      eventLogEventTime: new Date(),
      eventLogMeta: {
        action: "Ẩn bài đăng",
        detail: reason?.trim()
          ? `Bài đăng "${deletedPost.postTitle}" đã bị ẩn. Ghi chú: ${reason.trim()}`
          : `Bài đăng "${deletedPost.postTitle}" đã bị ẩn khỏi sàn.`,
        performedBy,
        actorRole: "Quản trị viên",
        status: "hidden",
        categoryId: deletedPost.categoryId,
        shopId: deletedPost.postShopId,
        authorId: deletedPost.postAuthorId,
        templateId: selectedTemplate?.templateId ?? null,
        templateName: selectedTemplate?.templateName ?? null,
        templateType: selectedTemplate?.templateType ?? null,
        finalMessage: reason?.trim() || null,
      },
    });

    if (deletedPost.postAuthorId) {
      await notificationService.sendNotification({
        recipientId: deletedPost.postAuthorId,
        title: "Bài đăng đã bị ẩn",
        message: reason?.trim()
          ? `Bài đăng "${deletedPost.postTitle}" của bạn đã bị quản trị viên ẩn. Lý do: ${reason.trim()}`
          : `Bài đăng "${deletedPost.postTitle}" của bạn đã bị ẩn khỏi hệ thống.`,
        type: "warning",
        metaData: {
          postId: deletedPost.postId,
          status: "hidden",
        },
      });
    }

    res.json({ message: "Ẩn bài đăng thành công", deletedPost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};
