import { Request, Response } from "express";
import { db } from "../../config/db.ts";
import { eq, and, sql } from "drizzle-orm";
import { posts, postImages, postVideos, postAttributeValues, shops, type Post, categories, attributes, users } from "../../models/schema/index.ts";
import { slugify } from "../../utils/slugify.ts";
import { parseId } from "../../utils/parseId.ts";
import { AuthRequest } from "../../dtos/auth.ts";

const actionCache = new Set<string>();

export const createPost = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const { categoryId, postTitle, postContent, postPrice, postLocation, postContactPhone, images, videos, attributes } = req.body;

        if (!categoryId || !postTitle) {
            res.status(400).json({ error: "Missing required fields (categoryId, postTitle)" });
            return;
        }

        // Check if user has a verified shop
        const [userShop] = await db.select()
            .from(shops)
            .where(and(eq(shops.shopOwnerId, userId), eq(shops.shopStatus, "active")))
            .limit(1);

        // Get user mobile if shop phone isn't available
        let contactPhone = postContactPhone;
        if (!contactPhone) {
            if (userShop?.shopPhone) {
                contactPhone = userShop.shopPhone;
            } else {
                const [userRecord] = await db.select().from(users).where(eq(users.userId, userId)).limit(1);
                contactPhone = userRecord?.userMobile || "";
            }
        }

        const postSlug = `${slugify(postTitle)}-${Date.now()}`;

        const [newPost] = await db.insert(posts).values({
            postAuthorId: userId,
            postShopId: userShop?.shopId || null,
            categoryId,
            postTitle,
            postSlug,
            postContent,
            postPrice: postPrice?.toString() || "0",
            postLocation,
            postContactPhone: contactPhone,
            postStatus: userShop ? "approved" : "pending" // Shop owners are auto-approved
        }).returning();

        // Handle images if provided
        if (images && Array.isArray(images) && images.length > 0) {
            const imageRecords = images.map(url => ({
                postId: newPost.postId,
                imageUrl: url
            }));
            await db.insert(postImages).values(imageRecords);
        }

        // Handle videos if provided
        if (videos && Array.isArray(videos) && videos.length > 0) {
            const videoRecords = videos.map((url, index) => ({
                postId: newPost.postId,
                videoUrl: url,
                videoPosition: index
            }));
            await db.insert(postVideos).values(videoRecords);
        }

        // Handle attributes if provided
        if (attributes && Array.isArray(attributes) && attributes.length > 0) {
            const attrRecords = attributes.map(attr => ({
                postId: newPost.postId,
                attributeId: attr.attributeId,
                attributeValue: attr.value
            }));
            await db.insert(postAttributeValues).values(attrRecords);
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

        const userPosts = await db.select().from(posts).where(eq(posts.postAuthorId, userId));
        res.json(userPosts);
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

        const updateData = req.body;

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

        const [updatedPost] = await db.update(posts)
            .set({
                ...updateData,
                postUpdatedAt: new Date(),
                postStatus: "pending" // Re-moderate on edit
            })
            .where(eq(posts.postId, postId))
            .returning();

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

