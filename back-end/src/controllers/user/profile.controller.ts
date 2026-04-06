import { Response } from "express";
import { db } from "../../config/db.ts";
import { eq, desc } from "drizzle-orm";
import { users } from "../../models/schema/users.ts";
import { favoritePosts, posts, postImages } from "../../models/schema/index.ts";
import { AuthRequest } from "../../dtos/auth";

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const [user] = await db.select().from(users).where(eq(users.userId, userId)).limit(1);
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const { userDisplayName, userAvatarUrl, userEmail, userLocation, userBio } = req.body;

        const [updatedUser] = await db.update(users)
            .set({ 
                userDisplayName: userDisplayName,
                userAvatarUrl: userAvatarUrl,
                userEmail: userEmail,
                userUpdatedAt: new Date()
            })
            .where(eq(users.userId, userId))
            .returning();

        res.json(updatedUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getFavoritePosts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const favorites = await db.select({
            post: posts,
            savedAt: favoritePosts.favoritePostCreatedAt
        })
        .from(favoritePosts)
        .innerJoin(posts, eq(favoritePosts.favoritePostPostId, posts.postId))
        .where(eq(favoritePosts.favoritePostUserId, userId))
        .orderBy(desc(favoritePosts.favoritePostCreatedAt));

        const postIds = favorites.map(f => f.post.postId);
        let imagesData: any[] = [];
        if (postIds.length > 0) {
            const { inArray } = await import("drizzle-orm");
            imagesData = await db.select().from(postImages).where(inArray(postImages.postId, postIds));
        }

        const formattedPosts = favorites.map(f => ({
            ...f.post,
            savedAt: f.savedAt,
            images: imagesData.filter(img => img.postId === f.post.postId)
        }));

        res.json({ posts: formattedPosts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};
