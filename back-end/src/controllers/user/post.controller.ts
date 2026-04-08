import { Request, Response } from "express";
import { db } from "../../config/db.ts";
import { eq, and, ne, sql, inArray } from "drizzle-orm";
import { posts, postImages, postVideos, postAttributeValues, shops, type Post, categories, attributes, users, favoritePosts } from "../../models/schema/index.ts";
import { slugify } from "../../utils/slugify.ts";
import { parseId } from "../../utils/parseId.ts";
import { AuthRequest } from "../../dtos/auth.ts";

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
            postPrice,
            postLocation,
            postContactPhone,
            images,
            attributes: attrValues
        } = req.body;

        if (!postTitle || !categoryId) {
            res.status(400).json({ error: "Title and Category are required" });
            return;
        }

        // Check if user has an active shop
        const [activeShop] = await db.select()
            .from(shops)
            .where(and(eq(shops.shopId, userId), eq(shops.shopStatus, "active")))
            .limit(1);

        const now = new Date();
        const isActiveGardenOwner = Boolean(activeShop);
        const finalSlug = slugify(postTitle) + "-" + Date.now().toString().slice(-4);

        const [newPost] = await db.insert(posts).values({
            postAuthorId: userId,
            postShopId: activeShop?.shopId || null,
            categoryId: Number(categoryId),
            postTitle,
            postSlug: finalSlug,
            postPrice: postPrice?.toString(),
            postLocation,
            postContactPhone,
            postStatus: isActiveGardenOwner ? "approved" : "pending",
            postPublished: isActiveGardenOwner,
            postSubmittedAt: now,
            postPublishedAt: isActiveGardenOwner ? now : null,
            postCreatedAt: now,
            postUpdatedAt: now,
        }).returning();

        // Save images if provided
        if (Array.isArray(images) && images.length > 0) {
            await db.insert(postImages).values(
                images.map((url: string, index: number) => ({
                    postId: newPost.postId,
                    imageUrl: url,
                    imageSortOrder: index,
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

        res.status(201).json(newPost);
    } catch (error) {
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

        const userPosts = await db.select().from(posts).where(
            and(
                eq(posts.postAuthorId, userId),
                ne(posts.postStatus, "hidden")
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
            postId: postImages.postId,
            imageId: postImages.imageId,
            imageUrl: postImages.imageUrl,
            imageSortOrder: postImages.imageSortOrder,
        })
            .from(postImages)
            .where(inArray(postImages.postId, postIds))
            .orderBy(postImages.postId, postImages.imageSortOrder, postImages.imageId);

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

        const response = userPosts.map((post) => {
            const postImagesData = imagesByPostId.get(post.postId) || [];

            return {
                ...post,
                images: postImagesData,
                coverImageUrl: postImagesData[0]?.imageUrl || null,
                attributes: attributesByPostId.get(post.postId) || [],
                author: author || null,
                shop: post.postShopId ? (shopById.get(post.postShopId) || null) : null,
            };
        });

        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
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
            postPrice,
            postLocation,
            postContactPhone,
            attributes: updatedAttributes
        } = req.body;

        // Ensure user owns the post
        const [existingPost] = await db.select().from(posts).where(eq(posts.postId, postId)).limit(1);
        if (!existingPost) {
            res.status(404).json({ error: "Post not found" });
            return;
        }
        if (existingPost.postAuthorId !== userId) {
            res.status(403).json({ error: "Unauthorized to update this post" });
            return;
        }

        // Shop owners with active shops can publish edits immediately.
        const [activeShop] = await db.select()
            .from(shops)
            .where(and(eq(shops.shopId, userId), eq(shops.shopStatus, "active")))
            .limit(1);

        const now = new Date();
        const isActiveGardenOwner = Boolean(activeShop);

        const postUpdatePayload: Record<string, any> = {
            postUpdatedAt: now,
            postStatus: isActiveGardenOwner ? "approved" : "pending",
        };

        if (isActiveGardenOwner) {
            postUpdatePayload.postModeratedAt = now;
            postUpdatePayload.postSubmittedAt = now;
            postUpdatePayload.postPublishedAt = now;
            if (!existingPost.postShopId && activeShop?.shopId) {
                postUpdatePayload.postShopId = activeShop.shopId;
            }
        }

        if (categoryId !== undefined) postUpdatePayload.categoryId = Number(categoryId);
        if (postTitle !== undefined) postUpdatePayload.postTitle = postTitle;

        if (postPrice !== undefined) postUpdatePayload.postPrice = postPrice?.toString();
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

        res.json(updatedPost);
    } catch (error) {
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
        if (existingPost.postAuthorId !== userId) {
            res.status(403).json({ error: "Unauthorized to delete this post" });
            return;
        }

        // Perform soft delete
        const [deletedPost] = await db.update(posts)
            .set({
                postStatus: "hidden",
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

// --- Buyer / Public Flow ---

import { PostService } from "../../services/post.service.ts";
import { GetPostsQueryDto } from "../../dtos/post.ts";

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
        const images = await db.select().from(postImages).where(eq(postImages.postId, post.postId));

        // Fetch related videos
        const videos = await db.select().from(postVideos).where(eq(postVideos.postId, post.postId));

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
        
        const [existingFavorite] = await db.select().from(favoritePosts)
            .where(and(eq(favoritePosts.favoritePostUserId, userId), eq(favoritePosts.favoritePostPostId, postId)))
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

        const [existingFavorite] = await db.select().from(favoritePosts)
            .where(and(eq(favoritePosts.favoritePostUserId, userId), eq(favoritePosts.favoritePostPostId, postId)))
            .limit(1);

        if (existingFavorite) {
            // Remove from favorites
            await db.delete(favoritePosts)
                .where(and(eq(favoritePosts.favoritePostUserId, userId), eq(favoritePosts.favoritePostPostId, postId)));
            res.json({ message: "Post removed from favorites", isSaved: false });
        } else {
            // Add to favorites
            await db.insert(favoritePosts)
                .values({
                    favoritePostUserId: userId,
                    favoritePostPostId: postId
                });
            res.json({ message: "Post added to favorites", isSaved: true });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

