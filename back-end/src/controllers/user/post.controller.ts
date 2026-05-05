import { Request, Response } from "express";
import { db } from "../../config/db";
import { eq, and, sql, inArray, or } from "drizzle-orm";
import { posts, mediaAssets, postAttributeValues, shops, type Post, categories, attributes, users, userFavorites, postPromotions, promotionPackages, placementSlots, shopCollaborators } from "../../models/schema/index";
import { slugify } from "../../utils/slugify";
import { parseId } from "../../utils/parseId";
import { AuthRequest } from "../../dtos/auth";
import {
    PostingPolicyError,
    postingPolicyService,
} from "../../services/posting-policy.service.ts";
import { adminWebSettingsService } from "../../services/adminWebSettings.service";
import { postLifecycleService } from "../../services/postLifecycle.service";
import { notificationService } from "../../services/notification.service";
import { BOOST_POST_SLOT_PREFIX } from "../../constants/promotion";

const actionCache = new Set<string>();
const SHOP_GALLERY_DELIMITER = "|";

const parseShopGalleryImages = (rawCover: string | null | undefined): string[] => {
    if (!rawCover) return [];
    return rawCover
        .split(SHOP_GALLERY_DELIMITER)
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
};

export const createPost = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const {
            categoryId,
            postTitle,
            postLocation,
            postContactPhone,
            images,
            attributes: attrValues,
            shopId: bodyShopId
        } = req.body;

        if (!postTitle || !categoryId) {
            res.status(400).json({ error: "Title and Category are required" });
            return;
        }

        const settings = await adminWebSettingsService.getSettings();
        await adminWebSettingsService.assertPostRateLimit(userId, settings);

        if (Array.isArray(images) && images.length > settings.media.maxImagesPerPost) {
            res.status(400).json({
                error: `Mỗi bài chỉ được tối đa ${settings.media.maxImagesPerPost} ảnh.`,
                code: "MAX_IMAGES_PER_POST_EXCEEDED",
            });
            return;
        }

        const policySnapshot = await postingPolicyService.assertCanCreatePost(userId);

        // Check if user has an active shop (used to bind post -> shop profile)
        const [ownShop] = await db.select()
            .from(shops)
            .where(and(eq(shops.shopId, userId), eq(shops.shopStatus, "active")))
            .limit(1);

        let targetShopId = ownShop?.shopId || null;
        let isDelegatedPost = false;

        // If a specific shopId is provided and it's not the user's own shop, check if they are a collaborator
        if (bodyShopId && Number(bodyShopId) !== userId) {
            const [collabRelation] = await db
                .select()
                .from(shopCollaborators)
                .where(
                    and(
                        eq(shopCollaborators.shopCollaboratorsShopId, Number(bodyShopId)),
                        eq(shopCollaborators.collaboratorId, userId),
                        eq(shopCollaborators.shopCollaboratorsStatus, "active")
                    )
                )
                .limit(1);

            if (collabRelation) {
                targetShopId = Number(bodyShopId);
                isDelegatedPost = true;
            } else {
                res.status(403).json({ error: "You are not an active collaborator for this shop" });
                return;
            }
        }

        const now = new Date();
        const matchedKeywords = adminWebSettingsService.findMatchedKeywords(
            [
                postTitle,
                postLocation,
                ...(Array.isArray(attrValues)
                    ? attrValues.map((item: any) => String(item?.value ?? ""))
                    : []),
            ],
            settings,
        );
        const shouldFlagForModeration =
            settings.moderation.autoModeration && matchedKeywords.length > 0;
        const canAutoApprove =
            policySnapshot.policy.autoApprove && !shouldFlagForModeration;
        const finalSlug = slugify(postTitle) + "-" + Date.now().toString().slice(-4);

        const [newPost] = await db.insert(posts).values({
            postAuthorId: userId,
            postShopId: targetShopId,
            categoryId: Number(categoryId),
            postTitle,
            postSlug: finalSlug,
            postLocation,
            postContactPhone,
            postStatus: isDelegatedPost ? "pending_owner" : (canAutoApprove ? "approved" : "pending"),
            postPublished: isDelegatedPost ? false : canAutoApprove,
            postSubmittedAt: now,
            postPublishedAt: (isDelegatedPost || !canAutoApprove) ? null : now,
            postRejectedReason: shouldFlagForModeration
                ? `Cần kiểm duyệt thủ công do trùng từ khóa: ${matchedKeywords.join(", ")}`
                : null,
            postCreatedAt: now,
            postUpdatedAt: now,
        }).returning();

        // Save images if provided
        if (Array.isArray(images) && images.length > 0) {
            await db.insert(mediaAssets).values(
                images.map((url: string, index: number) => ({
                    targetType: "post",
                    targetId: newPost.postId,
                    mediaType: "image",
                    url: url,
                    sortOrder: index,
                }))
            );
        }

        // Save attribute values if provided
        if (Array.isArray(attrValues) && attrValues.length > 0) {
            const attrRecords = attrValues
                .filter((attr: any) => attr?.attributeId && attr?.value !== undefined)
                .map((attr: any) => ({
                    postId: newPost.postId,
                    attributeId: Number(attr.attributeId),
                    attributeValue: String(attr.value),
                }));

            if (attrRecords.length > 0) {
                await db.insert(postAttributeValues).values(attrRecords);
            }
        }

        // Notify Shop Owner if this is a collaborator post
        if (isDelegatedPost && targetShopId) {
            const [author] = await db.select({ name: users.userDisplayName })
                .from(users)
                .where(eq(users.userId, userId))
                .limit(1);

            await notificationService.sendNotification({
                recipientId: targetShopId,
                title: "Bài đăng mới từ CTV",
                message: `Cộng tác viên ${author?.name || "ẩn danh"} vừa gửi bài đăng "${postTitle}" cần bạn phê duyệt.`,
                type: "collaboration",
                metaData: { postId: newPost.postId, shopId: targetShopId }
            }).catch(e => console.error("Failed to notify shop owner:", e));
        }

        const creationFee = await postingPolicyService.addFeeLedgerEntry({
            userId,
            postId: newPost.postId,
            planId: policySnapshot.policy.activePlanId,
            actionType: "POST_CREATE",
            amount: policySnapshot.policy.postFeeAmount,
            note: `Post creation fee - ${policySnapshot.policy.planTitle}`,
        });

        const nextDailyUsage = policySnapshot.usage.dailyPostsUsed + 1;
        const dailyPostLimit = policySnapshot.policy.dailyPostLimit;

        res.status(201).json({
            ...newPost,
            postingPolicy: {
                planCode: policySnapshot.policy.planCode,
                planTitle: policySnapshot.policy.planTitle,
                autoApprove: policySnapshot.policy.autoApprove,
                flaggedBySettings: shouldFlagForModeration,
                matchedKeywords,
                dailyPostLimit,
                dailyPostsUsed: nextDailyUsage,
                dailyPostsRemaining:
                    dailyPostLimit === null
                        ? null
                        : Math.max(dailyPostLimit - nextDailyUsage, 0),
            },
            billing: {
                actionType: "POST_CREATE",
                chargedAmount: creationFee?.amount ?? 0,
                currency: "VND",
            },
        });
    } catch (error) {
        if (error instanceof PostingPolicyError) {
            res.status(error.statusCode).json({
                error: error.message,
                code: error.code,
                ...(error.details || {}),
            });
            return;
        }

        const errorWithStatus = error as Error & {
            statusCode?: number;
            code?: string;
        };
        if (errorWithStatus.statusCode) {
            res.status(errorWithStatus.statusCode).json({
                error: errorWithStatus.message,
                code: errorWithStatus.code,
            });
            return;
        }

        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getMyPosts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const settings = await adminWebSettingsService.getSettings();
        await postLifecycleService.syncAutoExpiredPosts(settings);

        const userPosts = await db.select().from(posts).where(
            or(
                eq(posts.postAuthorId, userId),
                eq(posts.postShopId, userId)
            )
        );

        if (userPosts.length === 0) {
            res.json([]);
            return;
        }

        const postIds = userPosts.map((post) => post.postId);
        const postAttributes = await db.select({
            postId: postAttributeValues.postId,
            attributeId: postAttributeValues.attributeId,
            attributeTitle: attributes.attributeTitle,
            value: postAttributeValues.attributeValue,
        })
            .from(postAttributeValues)
            .leftJoin(attributes, eq(postAttributeValues.attributeId, attributes.attributeId))
            .where(inArray(postAttributeValues.postId, postIds));

        const postImageRows = await db.select({
            postId: mediaAssets.targetId,
            imageId: mediaAssets.assetId,
            imageUrl: mediaAssets.url,
            imageSortOrder: mediaAssets.sortOrder,
        })
            .from(mediaAssets)
            .where(
                and(
                    eq(mediaAssets.targetType, "post"),
                    eq(mediaAssets.mediaType, "image"),
                    inArray(mediaAssets.targetId, postIds)
                )
            )
            .orderBy(mediaAssets.targetId, mediaAssets.sortOrder, mediaAssets.assetId);

        const [author] = await db.select({
            userId: users.userId,
            userDisplayName: users.userDisplayName,
            userMobile: users.userMobile,
            userAvatarUrl: users.userAvatarUrl,
        })
            .from(users)
            .where(eq(users.userId, userId))
            .limit(1);

        const uniqueShopIds = Array.from(
            new Set(
                userPosts
                    .map((post) => post.postShopId)
                    .filter((shopId): shopId is number => shopId !== null)
            )
        );

        const shopRows = uniqueShopIds.length > 0
            ? await db.select({
                shopId: shops.shopId,
                shopName: shops.shopName,
                shopStatus: shops.shopStatus,
                shopLogoUrl: shops.shopLogoUrl,
                shopCoverUrl: shops.shopCoverUrl,
            })
                .from(shops)
                .where(inArray(shops.shopId, uniqueShopIds))
            : [];

        const attributesByPostId = new Map<number, Array<{
            attributeId: number;
            attributeTitle: string | null;
            value: string;
        }>>();

        for (const item of postAttributes) {
            if (!item.postId || !item.attributeId) continue;

            const list = attributesByPostId.get(item.postId) || [];
            list.push({
                attributeId: item.attributeId,
                attributeTitle: item.attributeTitle ?? null,
                value: item.value,
            });
            attributesByPostId.set(item.postId, list);
        }

        const imagesByPostId = new Map<number, Array<{
            imageId: number;
            imageUrl: string;
            imageSortOrder: number | null;
        }>>();

        for (const image of postImageRows) {
            if (!image.postId) continue;

            const list = imagesByPostId.get(image.postId) || [];
            list.push({
                imageId: image.imageId,
                imageUrl: image.imageUrl,
                imageSortOrder: image.imageSortOrder,
            });
            imagesByPostId.set(image.postId, list);
        }

        const shopById = new Map<number, any>();

        for (const shopItem of shopRows) {
            const shopGalleryImages = parseShopGalleryImages(shopItem.shopCoverUrl);
            shopById.set(shopItem.shopId, {
                ...shopItem,
                shopGalleryImages,
                shopPreviewImageUrl: shopGalleryImages[0] || null,
            });
        }

        const activePromotions = postIds.length > 0 ? await db.select({
            postPromotionId: postPromotions.postPromotionId,
            postId: postPromotions.postPromotionPostId,
            packageId: postPromotions.postPromotionPackageId,
            status: postPromotions.postPromotionStatus,
            startAt: postPromotions.postPromotionStartAt,
            endAt: postPromotions.postPromotionEndAt,
            packageName: promotionPackages.promotionPackageTitle,
            packageDescription: promotionPackages.promotionPackageDescription,
        })
            .from(postPromotions)
            .innerJoin(promotionPackages, eq(postPromotions.postPromotionPackageId, promotionPackages.promotionPackageId))
            .innerJoin(placementSlots, eq(postPromotions.postPromotionSlotId, placementSlots.placementSlotId))
            .where(
                and(
                    inArray(postPromotions.postPromotionPostId, postIds),
                    eq(postPromotions.postPromotionStatus, "active"),
                    sql`post_promotion_end_at > now()`,
                    sql`UPPER(${placementSlots.placementSlotCode}) LIKE ${`${BOOST_POST_SLOT_PREFIX}%`}`
                )
            ) : [];

        const promotionsByPostId = new Map<number, any>();
        for (const promo of activePromotions) {
            if (promo.postId) {
                promotionsByPostId.set(promo.postId, promo);
            }
        }

        const response = userPosts.map((post) => {
            const postImagesData = imagesByPostId.get(post.postId) || [];
            const lifecycle = postLifecycleService.getPostLifecycleMeta(post, settings);

            return {
                ...post,
                images: postImagesData,
                coverImageUrl: postImagesData[0]?.imageUrl || null,
                attributes: attributesByPostId.get(post.postId) || [],
                author: author || null,
                shop: post.postShopId ? (shopById.get(post.postShopId) || null) : null,
                activePromotion: promotionsByPostId.get(post.postId) || null,
                lifecycle,
            };
        });

        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getPostingPolicy = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
            return;
        }

        const snapshot = await postingPolicyService.getPolicySnapshot(userId);
        res.json(snapshot);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
    }
};

export const activatePersonalMonthlyPlanMock = async (
    req: AuthRequest,
    res: Response,
): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
            return;
        }

        const parsedDuration = Number(req.body?.durationDays ?? 30);
        const durationDays = Number.isFinite(parsedDuration) ? parsedDuration : 30;

        const result = await postingPolicyService.activatePersonalMonthlyPlan({
            userId,
            durationDays,
        });

        res.status(201).json({
            message: "Personal monthly plan activated (mock).",
            plan: result.plan,
            effectivePolicy: result.effectivePolicy,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
    }
};

export const updatePost = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const postId = parseId(req.params.id as string);
        const userId = req.user?.id;
        if (!postId || !userId) {
            res.status(400).json({ error: "Post ID is required" });
            return;
        }

        const {
            categoryId,
            postTitle,
            postLocation,
            postContactPhone,
            attributes: updatedAttributes
        } = req.body;

        // Ensure user owns the post (author or shop owner)
        const [existingPost] = await db.select().from(posts).where(eq(posts.postId, postId)).limit(1);
        if (!existingPost) {
            res.status(404).json({ error: "Post not found" });
            return;
        }

        const isAuthorized = existingPost.postAuthorId === userId ||
            (existingPost.postShopId !== null && existingPost.postShopId === userId);

        if (!isAuthorized) {
            res.status(403).json({ error: "Unauthorized to update this post" });
            return;
        }

        const effectivePolicy = await postingPolicyService.getEffectivePolicy(userId);
        const settings = await adminWebSettingsService.getSettings();

        // Keep linking post -> shop when user already has an active shop.
        const [activeShop] = await db.select()
            .from(shops)
            .where(and(eq(shops.shopId, userId), eq(shops.shopStatus, "active")))
            .limit(1);

        const now = new Date();
        const matchedKeywords = adminWebSettingsService.findMatchedKeywords(
            [
                postTitle ?? existingPost.postTitle,
                postLocation ?? existingPost.postLocation,
                ...(Array.isArray(updatedAttributes)
                    ? updatedAttributes.map((item: any) => String(item?.value ?? ""))
                    : []),
            ],
            settings,
        );
        const shouldFlagForModeration =
            settings.moderation.autoModeration && matchedKeywords.length > 0;
        const canAutoApprove = effectivePolicy.autoApprove && !shouldFlagForModeration;
        const isDelegatedCollaboratorEdit =
            existingPost.postShopId !== null &&
            existingPost.postShopId !== existingPost.postAuthorId &&
            existingPost.postAuthorId === userId;
        const currentEditCount = Number(existingPost.postEditCount || 0);
        const currentPaidEditCount = Number(existingPost.postPaidEditCount || 0);
        const editPricing = postingPolicyService.getEditPricing(
            effectivePolicy,
            currentEditCount,
        );

        const nextPostStatus = isDelegatedCollaboratorEdit
            ? "pending_owner"
            : (canAutoApprove ? "approved" : "pending");

        const postUpdatePayload: Record<string, any> = {
            postUpdatedAt: now,
            postStatus: nextPostStatus,
            postRejectedReason: shouldFlagForModeration
                ? `Cần kiểm duyệt thủ công do trùng từ khóa: ${matchedKeywords.join(", ")}`
                : null,
            postEditCount: editPricing.nextEditCount,
            postPaidEditCount:
                editPricing.chargeAmount > 0
                    ? currentPaidEditCount + 1
                    : currentPaidEditCount,
        };

        if (isDelegatedCollaboratorEdit) {
            postUpdatePayload.postPublished = false;
            postUpdatePayload.postSubmittedAt = now;
            postUpdatePayload.postPublishedAt = null;
            postUpdatePayload.postModeratedAt = null;
        } else if (canAutoApprove) {
            postUpdatePayload.postModeratedAt = now;
            postUpdatePayload.postSubmittedAt = now;
            postUpdatePayload.postPublishedAt = now;
            if (!existingPost.postShopId && activeShop?.shopId) {
                postUpdatePayload.postShopId = activeShop.shopId;
            }
        }

        if (categoryId !== undefined) postUpdatePayload.categoryId = Number(categoryId);
        if (postTitle !== undefined) postUpdatePayload.postTitle = postTitle;
        if (postLocation !== undefined) postUpdatePayload.postLocation = postLocation;
        if (postContactPhone !== undefined) postUpdatePayload.postContactPhone = postContactPhone;

        const [updatedPost] = await db.update(posts)
            .set(postUpdatePayload)
            .where(eq(posts.postId, postId))
            .returning();

        if (Array.isArray(updatedAttributes)) {
            await db.delete(postAttributeValues).where(eq(postAttributeValues.postId, postId));

            const attrRecords = updatedAttributes
                .filter((attr: any) => attr?.attributeId && attr?.value !== undefined && attr?.value !== null && String(attr.value).trim() !== "")
                .map((attr: any) => ({
                    postId: postId,
                    attributeId: Number(attr.attributeId),
                    attributeValue: String(attr.value),
                }));

            if (attrRecords.length > 0) {
                await db.insert(postAttributeValues).values(attrRecords);
            }
        }

        const editFee = await postingPolicyService.addFeeLedgerEntry({
            userId,
            postId,
            planId: effectivePolicy.activePlanId,
            actionType: "POST_EDIT",
            amount: editPricing.chargeAmount,
            note: `Post edit fee - ${effectivePolicy.planTitle}`,
        });

        if (isDelegatedCollaboratorEdit && existingPost.postShopId) {
            const [author] = await db.select({ name: users.userDisplayName })
                .from(users)
                .where(eq(users.userId, userId))
                .limit(1);

            await notificationService.sendNotification({
                recipientId: existingPost.postShopId,
                title: "CTV đã cập nhật bài đăng",
                message: `Cộng tác viên ${author?.name || "ẩn danh"} vừa cập nhật lại bài đăng "${updatedPost.postTitle}" và đang chờ bạn duyệt lại.`,
                type: "collaboration",
                metaData: { postId: updatedPost.postId, shopId: existingPost.postShopId }
            }).catch(e => console.error("Failed to notify shop owner after collaborator update:", e));
        }

        res.json({
            ...updatedPost,
            postingPolicy: {
                planCode: effectivePolicy.planCode,
                planTitle: effectivePolicy.planTitle,
                autoApprove: effectivePolicy.autoApprove,
                flaggedBySettings: shouldFlagForModeration,
                matchedKeywords,
                freeEditQuota: effectivePolicy.freeEditQuota,
                editFeeAmount: effectivePolicy.editFeeAmount,
                remainingFreeEdits: editPricing.remainingFreeEdits,
            },
            billing: {
                actionType: "POST_EDIT",
                chargedAmount: editFee?.amount ?? 0,
                currency: "VND",
            },
        });
    } catch (error) {
        if (error instanceof PostingPolicyError) {
            res.status(error.statusCode).json({
                error: error.message,
                code: error.code,
                ...(error.details || {}),
            });
            return;
        }

        const errorWithStatus = error as Error & {
            statusCode?: number;
            code?: string;
        };
        if (errorWithStatus.statusCode) {
            res.status(errorWithStatus.statusCode).json({
                error: errorWithStatus.message,
                code: errorWithStatus.code,
            });
            return;
        }

        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const softDeletePost = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const postId = parseId(req.params.id as string);
        const userId = req.user?.id;
        if (!postId || !userId) {
            res.status(400).json({ error: "Post ID is required" });
            return;
        }

        // Ensure user owns the post
        const [existingPost] = await db.select().from(posts).where(eq(posts.postId, postId)).limit(1);
        if (!existingPost) {
            res.status(404).json({ error: "Post not found" });
            return;
        }

        const isAuthorized = existingPost.postAuthorId === userId ||
            (existingPost.postShopId !== null && existingPost.postShopId === userId);

        if (!isAuthorized) {
            res.status(403).json({ error: "Unauthorized to delete this post" });
            return;
        }

        // Perform soft delete
        const [deletedPost] = await db.update(posts)
            .set({
                postStatus: "hidden",
                postRejectedReason: postLifecycleService.buildUserTrashPayload(existingPost),
                postDeletedAt: new Date(),
                postUpdatedAt: new Date()
            })
            .where(eq(posts.postId, postId))
            .returning();

        res.json({ message: "Post deleted successfully", post: deletedPost });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const restorePost = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const postId = parseId(req.params.id as string);
        const userId = req.user?.id;
        if (!postId || !userId) {
            res.status(400).json({ error: "Post ID is required" });
            return;
        }

        const [existingPost] = await db.select().from(posts).where(eq(posts.postId, postId)).limit(1);
        if (!existingPost) {
            res.status(404).json({ error: "Post not found" });
            return;
        }

        const isAuthorized = existingPost.postAuthorId === userId ||
            (existingPost.postShopId !== null && existingPost.postShopId === userId);

        if (!isAuthorized) {
            res.status(403).json({ error: "Unauthorized to restore this post" });
            return;
        }

        const settings = await adminWebSettingsService.getSettings();
        const restoreMeta = postLifecycleService.getRestoreMeta(existingPost, settings);
        const restorePayload = postLifecycleService.buildRestorePayload(existingPost);

        if (!restoreMeta.canRestore || !restorePayload) {
            res.status(400).json({
                error: "Bài đăng này đã quá hạn khôi phục hoặc không thuộc thùng rác do bạn xóa.",
                code: "RESTORE_WINDOW_EXPIRED",
            });
            return;
        }

        const [restoredPost] = await db.update(posts)
            .set(restorePayload)
            .where(eq(posts.postId, postId))
            .returning();

        res.json({ message: "Post restored successfully", post: restoredPost });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const togglePostVisibility = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const postId = parseId(req.params.id as string);
        const userId = req.user?.id;
        if (!postId || !userId) {
            res.status(400).json({ error: "Post ID is required" });
            return;
        }

        const [existingPost] = await db.select().from(posts).where(eq(posts.postId, postId)).limit(1);
        if (!existingPost) {
            res.status(404).json({ error: "Post not found" });
            return;
        }

        const isAuthorized = existingPost.postAuthorId === userId ||
            (existingPost.postShopId !== null && existingPost.postShopId === userId);

        if (!isAuthorized) {
            res.status(403).json({ error: "Unauthorized to update this post" });
            return;
        }

        const [updatedPost] = await db.update(posts)
            .set({
                postPublished: !existingPost.postPublished,
                postUpdatedAt: new Date()
            })
            .where(eq(posts.postId, postId))
            .returning();

        res.json({
            message: updatedPost.postPublished ? "Post is now visible" : "Post is now hidden",
            post: updatedPost
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// --- Buyer / Public Flow ---

import { PostService } from "../../services/post.service";
import { GetPostsQueryDto } from "../../dtos/post";

export const getPublicPosts = async (req: Request, res: Response): Promise<void> => {
    try {
        const query = req.query as GetPostsQueryDto;
        const responseData = await PostService.getPublicPosts(query);
        res.json(responseData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getPublicPostBySlug = async (req: Request<{ slug: string }>, res: Response): Promise<void> => {
    try {
        await postLifecycleService.syncAutoExpiredPosts();
        const { slug } = req.params;

        const [post] = await db.select().from(posts).where(eq(posts.postSlug, slug)).limit(1);

        if (!post || post.postStatus !== "approved") {
            res.status(404).json({ error: "Post not found or not approved" });
            return;
        }

        // View counting logic with IP caching
        const clientIp = req.ip || req.socket?.remoteAddress || "unknown_ip";
        const cacheKey = `view_${post.postId}_${clientIp}`;

        if (!actionCache.has(cacheKey)) {
            actionCache.add(cacheKey);
            db.update(posts)
                .set({ postViewCount: sql`post_view_count + 1` })
                .where(eq(posts.postId, post.postId))
                .execute()
                .catch(e => console.error("Failed to increment views:", e));

            post.postViewCount = (post.postViewCount || 0) + 1;
        }

        // Fetch related images
        const images = await db.select({
            assetId: mediaAssets.assetId,
            imageUrl: mediaAssets.url,
            sortOrder: mediaAssets.sortOrder,
            metaData: mediaAssets.metaData
        }).from(mediaAssets).where(
            and(
                eq(mediaAssets.targetType, "post"),
                eq(mediaAssets.targetId, post.postId),
                eq(mediaAssets.mediaType, "image")
            )
        );

        // Fetch related videos
        const videos = await db.select({
            assetId: mediaAssets.assetId,
            videoUrl: mediaAssets.url,
            sortOrder: mediaAssets.sortOrder,
            metaData: mediaAssets.metaData
        }).from(mediaAssets).where(
            and(
                eq(mediaAssets.targetType, "post"),
                eq(mediaAssets.targetId, post.postId),
                eq(mediaAssets.mediaType, "video")
            )
        );

        // Fetch related attributes with names
        const attributesData = await db.select({
            id: postAttributeValues.attributeId,
            name: attributes.attributeTitle,
            value: postAttributeValues.attributeValue
        })
            .from(postAttributeValues)
            .leftJoin(attributes, eq(postAttributeValues.attributeId, attributes.attributeId))
            .where(eq(postAttributeValues.postId, post.postId));

        // Fetch shop info if available
        let shop = null;
        if (post.postShopId) {
            [shop] = await db.select().from(shops).where(eq(shops.shopId, post.postShopId)).limit(1);
        }

        res.json({
            ...post,
            images,
            videos,
            attributes: attributesData,
            shop
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const recordContactClick = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
        const postId = parseId(req.params.id as string);
        if (!postId) {
            res.status(400).json({ error: "Post ID is required" });
            return;
        }

        const clientIp = req.ip || req.socket?.remoteAddress || "unknown_ip";
        const cacheKey = `contact_${postId}_${clientIp}`;

        if (!actionCache.has(cacheKey)) {
            actionCache.add(cacheKey);
            await db.update(posts)
                .set({ postContactCount: sql`post_contact_count + 1` })
                .where(eq(posts.postId, postId))
                .execute();
        }

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};


export const checkIsSaved = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const postId = parseId(req.params.id as string);
        if (!userId || !postId) { res.status(400).json({ isSaved: false }); return; }

        const [existingFavorite] = await db.select().from(userFavorites)
            .where(
                and(
                    eq(userFavorites.userId, userId),
                    eq(userFavorites.targetId, postId),
                    eq(userFavorites.targetType, "post")
                )
            )
            .limit(1);

        res.json({ isSaved: !!existingFavorite });
    } catch (error) {
        console.error(error);
        res.status(500).json({ isSaved: false });
    }
};

export const toggleFavoritePost = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const postId = parseId(req.params.id as string);

        if (!userId || !postId) {
            res.status(400).json({ error: "Invalid user or post ID" });
            return;
        }

        const [existingFavorite] = await db.select().from(userFavorites)
            .where(
                and(
                    eq(userFavorites.userId, userId),
                    eq(userFavorites.targetId, postId),
                    eq(userFavorites.targetType, "post")
                )
            )
            .limit(1);

        if (existingFavorite) {
            // Remove from favorites
            await db.delete(userFavorites)
                .where(
                    and(
                        eq(userFavorites.userId, userId),
                        eq(userFavorites.targetId, postId),
                        eq(userFavorites.targetType, "post")
                    )
                );
            res.json({ message: "Post removed from favorites", isSaved: false });
        } else {
            // Add to favorites
            await db.insert(userFavorites)
                .values({
                    userId: userId,
                    targetId: postId,
                    targetType: "post"
                });
            res.json({ message: "Post added to favorites", isSaved: true });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};
