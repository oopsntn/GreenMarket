import { Request, Response } from "express";
import { db } from "../../config/db.ts";
import { eq, and } from "drizzle-orm";
import { posts, postImages, postAttributeValues, shops, type Post } from "../../models/schema/index.ts";
import { slugify } from "../../utils/slugify.ts";
import { parseId } from "../../utils/parseId.ts";

export const createPost = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId, categoryId, postTitle, postContent, postPrice, postLocation, images, attributes } = req.body;

        if (!userId || !categoryId || !postTitle) {
            res.status(400).json({ error: "Missing required fields (userId, categoryId, postTitle)" });
            return;
        }

        // Check if user has a verified shop
        const [userShop] = await db.select()
            .from(shops)
            .where(and(eq(shops.shopOwnerId, userId), eq(shops.shopStatus, "active")))
            .limit(1);

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
            postStatus: "pending" // All user posts must be moderated
        }).returning();

        // Handle images if provided
        if (images && Array.isArray(images) && images.length > 0) {
            const imageRecords = images.map(url => ({
                postId: newPost.postId,
                imageUrl: url
            }));
            await db.insert(postImages).values(imageRecords);
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

export const getMyPosts = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.query;
        if (!userId) {
            res.status(400).json({ error: "User ID is required" });
            return;
        }

        const userPosts = await db.select().from(posts).where(eq(posts.postAuthorId, Number(userId)));
        res.json(userPosts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const updatePost = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
        const postId = parseId(req.params.id);
        const { userId, ...updateData } = req.body;

        if (!postId || !userId) {
            res.status(400).json({ error: "Post ID and User ID are required" });
            return;
        }

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
