import { Request, Response } from "express";
import { db } from "../../config/db";
import { eq } from "drizzle-orm";
import { posts, type NewPost } from "../../models/schema/posts";
import { postImages } from "../../models/schema/post-images";
import { postAttributeValues } from "../../models/schema/post-attribute-values";
import { moderationActions } from "../../models/schema/index.ts";
import { parseId } from "../../utils/parseId";
import { slugify } from "../../utils/slugify";

export const getPosts = async (req: Request, res: Response): Promise<void> => {
    try {
        const allPosts = await db.select().from(posts);
        res.json(allPosts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
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
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getPostById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
        const idNumber = parseId(req.params.id);
        if (idNumber === null) {
            res.status(400).json({ error: "Invalid post id" });
            return;
        }

        const [post] = await db.select().from(posts).where(eq(posts.postId, idNumber)).limit(1);
        if (!post) {
            res.status(404).json({ error: "Post not found" });
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
        res.status(500).json({ error: "Internal server error" });
    }
};

export const updatePostStatus = async (req: Request<{ id: string }, {}, { status: string, reason?: string }>, res: Response): Promise<void> => {
    try {
        const idNumber = parseId(req.params.id);
        if (idNumber === null) {
            res.status(400).json({ error: "Invalid post id" });
            return;
        }

        const { status, reason } = req.body;

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
            res.status(404).json({ error: "Post not found" });
            return;
        }

        res.json(updatedPost);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const deletePost = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
        const idNumber = parseId(req.params.id);
        const { adminId, reason } = req.body;

        if (idNumber === null) {
            res.status(400).json({ error: "Invalid post id" });
            return;
        }

        if (!adminId) {
            res.status(400).json({ error: "adminId is required for this action" });
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
            res.status(404).json({ error: "Post not found" });
            return;
        }

        // Log the action
        await db.insert(moderationActions).values({
            moderationActionActionBy: adminId,
            moderationActionPostId: idNumber,
            moderationActionAction: "hidden",
            moderationActionNote: reason || "Admin decided to hide this post",
        });

        res.json({ message: "Post hidden successfully", deletedPost });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};
