import { Request, Response } from "express";
import { db } from "../../config/db";
import { eq } from "drizzle-orm";
import { posts, type NewPost } from "../../models/schema/posts";
import { postImages } from "../../models/schema/post-images";
import { postAttributeValues } from "../../models/schema/post-attribute-values";
import { eventLogs, moderationActions } from "../../models/schema/index.ts";
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

export const getPosts = async (req: Request, res: Response): Promise<void> => {
    try {
        const allPosts = await db.select().from(posts);
        res.json(allPosts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
    }
};

export const createPost = async (req: Request<{}, {}, NewPost & { images?: string[], attributes?: { id: number, value: string }[] }>, res: Response): Promise<void> => {
    try {
        const { images, attributes: attrValues, ...postData } = req.body;
        
        // Auto-generate slug
        const finalSlug = postData.postSlug || slugify(postData.postTitle);

        const [newPost] = await db.insert(posts).values({
            ...postData,
            postSlug: finalSlug,
        }).returning();

        // Save images if provided
        if (images && images.length > 0) {
            await db.insert(postImages).values(
                images.map((url, index) => ({
                    postId: newPost.postId,
                    imageUrl: url,
                    imageSortOrder: index,
                }))
            );
        }

        // Save attribute values if provided (e.g., Age: 5 years)
        if (attrValues && attrValues.length > 0) {
            await db.insert(postAttributeValues).values(
                attrValues.map(attr => ({
                    postId: newPost.postId,
                    attributeId: attr.id,
                    attributeValue: attr.value,
                }))
            );
        }

        res.status(201).json(newPost);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
    }
};

export const getPostById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
        const idNumber = parseId(req.params.id);
        if (idNumber === null) {
            res.status(400).json({ error: "Mã bài đăng không hợp lệ" });
            return;
        }

        const [post] = await db.select().from(posts).where(eq(posts.postId, idNumber)).limit(1);
        if (!post) {
            res.status(404).json({ error: "Không tìm thấy bài đăng" });
            return;
        }

        // Fetch related images and attributes
        const images = await db.select().from(postImages).where(eq(postImages.postId, idNumber));
        const attrValues = await db.select().from(postAttributeValues).where(eq(postAttributeValues.postId, idNumber));

        res.json({
            ...post,
            images,
            attributes: attrValues,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
    }
};

export const updatePostStatus = async (
    req: Request<{ id: string }, {}, { status: string, reason?: string, adminName?: string }>,
    res: Response,
): Promise<void> => {
    try {
        const idNumber = parseId(req.params.id);
        if (idNumber === null) {
            res.status(400).json({ error: "Mã bài đăng không hợp lệ" });
            return;
        }

        const { status, reason, adminName } = req.body;

        const [updatedPost] = await db.update(posts)
            .set({ 
                postStatus: status as any, 
                postRejectedReason: reason,
                postModeratedAt: new Date(),
                postUpdatedAt: new Date()
            })
            .where(eq(posts.postId, idNumber))
            .returning();

        if (!updatedPost) {
            res.status(404).json({ error: "Không tìm thấy bài đăng" });
            return;
        }

        await db.insert(eventLogs).values({
            eventLogUserId: updatedPost.postAuthorId,
            eventLogPostId: updatedPost.postId,
            eventLogShopId: updatedPost.postShopId,
            eventLogCategoryId: updatedPost.categoryId,
            eventLogEventType: getPostEventType(status),
            eventLogEventTime: new Date(),
            eventLogMeta: {
                action: getPostActionLabel(status),
                detail: reason?.trim()
                    ? `Bài đăng "${updatedPost.postTitle}" được cập nhật sang trạng thái ${status.toLowerCase()}. Ghi chú: ${reason.trim()}`
                    : `Bài đăng "${updatedPost.postTitle}" được cập nhật sang trạng thái ${status.toLowerCase()}.`,
                performedBy: adminName?.trim() || "Quản trị viên hệ thống",
                status: status.toLowerCase(),
            },
        });

        res.json(updatedPost);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
    }
};

export const deletePost = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
        const idNumber = parseId(req.params.id);
        const { adminId, reason, adminName } = req.body;

        if (idNumber === null) {
            res.status(400).json({ error: "Mã bài đăng không hợp lệ" });
            return;
        }

        // Soft delete the post
        const [deletedPost] = await db.update(posts)
            .set({ 
                postStatus: 'hidden', 
                postDeletedAt: new Date(),
                postUpdatedAt: new Date()
            })
            .where(eq(posts.postId, idNumber))
            .returning();
            
        if (!deletedPost) {
            res.status(404).json({ error: "Không tìm thấy bài đăng" });
            return;
        }

        // Log the moderation action when the admin id is available.
        if (typeof adminId === "number" && Number.isFinite(adminId)) {
            await db.insert(moderationActions).values({
                moderationActionActionBy: adminId,
                moderationActionPostId: idNumber,
                moderationActionAction: "hidden",
                moderationActionNote: reason || "Quản trị viên ẩn bài đăng",
            });
        }

        await db.insert(eventLogs).values({
            eventLogUserId: deletedPost.postAuthorId,
            eventLogPostId: deletedPost.postId,
            eventLogShopId: deletedPost.postShopId,
            eventLogCategoryId: deletedPost.categoryId,
            eventLogEventType: "admin_post_hidden",
            eventLogEventTime: new Date(),
            eventLogMeta: {
                action: "Ẩn bài đăng",
                detail: reason?.trim()
                    ? `Bài đăng "${deletedPost.postTitle}" đã bị ẩn. Ghi chú: ${reason.trim()}`
                    : `Bài đăng "${deletedPost.postTitle}" đã bị ẩn khỏi sàn.`,
                performedBy: adminName?.trim() || "Quản trị viên hệ thống",
                status: "hidden",
            },
        });

        res.json({ message: "Ẩn bài đăng thành công", deletedPost });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
    }
};
