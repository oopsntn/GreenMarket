import { Response } from "express";
import { db } from "../../config/db.ts";
import { eq, desc, inArray, and } from "drizzle-orm";
import {
  users,
  businessRoles,
  userFavorites,
  posts,
  mediaAssets,
} from "../../models/schema/index.ts";
import { AuthRequest } from "../../dtos/auth";

const buildProfileQuery = () =>
  db
    .select({
      userId: users.userId,
      userMobile: users.userMobile,
      userDisplayName: users.userDisplayName,
      userAvatarUrl: users.userAvatarUrl,
      userEmail: users.userEmail,
      userLocation: users.userLocation,
      userBio: users.userBio,
      userStatus: users.userStatus,
      userBusinessRoleId: users.userBusinessRoleId,
      userRegisteredAt: users.userRegisteredAt,
      userLastLoginAt: users.userLastLoginAt,
      userCreatedAt: users.userCreatedAt,
      userUpdatedAt: users.userUpdatedAt,
      businessRoleId: businessRoles.businessRoleId,
      businessRoleCode: businessRoles.businessRoleCode,
      businessRoleTitle: businessRoles.businessRoleTitle,
      businessRoleAudienceGroup: businessRoles.businessRoleAudienceGroup,
      businessRoleAccessScope: businessRoles.businessRoleAccessScope,
      businessRoleStatus: businessRoles.businessRoleStatus,
    })
    .from(users)
    .leftJoin(
      businessRoles,
      eq(users.userBusinessRoleId, businessRoles.businessRoleId),
    );

export const getProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const [user] = await buildProfileQuery()
      .where(eq(users.userId, userId))
      .limit(1);

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

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { userDisplayName, userAvatarUrl, userEmail, userLocation, userBio } =
      req.body;

    await db
      .update(users)
      .set({
        userDisplayName,
        userAvatarUrl,
        userEmail,
        userLocation,
        userBio,
        userUpdatedAt: new Date(),
      })
      .where(eq(users.userId, userId));

    const [updatedUser] = await buildProfileQuery()
      .where(eq(users.userId, userId))
      .limit(1);

    if (!updatedUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getFavoritePosts = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const favorites = await db
      .select({
        post: posts,
        savedAt: userFavorites.createdAt,
      })
      .from(userFavorites)
      .innerJoin(posts, eq(userFavorites.targetId, posts.postId))
      .where(
        and(
          eq(userFavorites.userId, userId),
          eq(userFavorites.targetType, "post"),
        ),
      )
      .orderBy(desc(userFavorites.createdAt));

    const postIds = favorites.map((f) => f.post.postId);
    let imagesData: any[] = [];

    if (postIds.length > 0) {
      imagesData = await db
        .select({
          postId: mediaAssets.targetId,
          imageUrl: mediaAssets.url,
        })
        .from(mediaAssets)
        .where(
          and(
            eq(mediaAssets.targetType, "post"),
            eq(mediaAssets.mediaType, "image"),
            inArray(mediaAssets.targetId, postIds)
          )
        );
    }

    const formattedPosts = favorites.map((f) => ({
      ...f.post,
      savedAt: f.savedAt,
      images: imagesData.filter((img) => img.postId === f.post.postId),
    }));

    res.json({ posts: formattedPosts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
