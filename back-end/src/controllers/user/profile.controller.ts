import { Response } from "express";
import { db } from "../../config/db.ts";
import { eq, desc, inArray, and, ne } from "drizzle-orm";
import { verificationService } from "../../services/verification.service.ts";
import {
  users,
  shops,
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
      userEmailVerified: users.userEmailVerified,
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

    const { userDisplayName, userAvatarUrl, userLocation, userBio } =
      req.body;

    await db
      .update(users)
      .set({
        userDisplayName,
        userAvatarUrl,
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

export const requestUserEmailOTP = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

    const { email } = req.body;
    console.log(`[PROFILE CONTROLLER] Requesting OTP for email: ${email} (User: ${userId})`);
    if (!email) { res.status(400).json({ error: "Email is required" }); return; }

    const [existing] = await db.select().from(users).where(eq(users.userEmail, email)).limit(1);
    if (existing) {
      if (existing.userId !== userId) {
        res.status(400).json({ error: "Email này đã được sử dụng bởi một tài khoản khác" });
        return;
      }
      if (existing.userEmailVerified) {
        res.status(400).json({ error: "Email này đã được xác thực và đang là email hiện tại của bạn" });
        return;
      }
    }

    const result = await verificationService.requestOTP(email, "email", 15);
    if (!result.success) {
      res.status(500).json({ error: result.message });
      return;
    }
    res.json({ message: result.message });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const verifyAndAddUserEmail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

    const { email, otp } = req.body;
    if (!email || !otp) { res.status(400).json({ error: "Missing email or otp" }); return; }

    const result = await verificationService.verifyOTP(email, otp, "email");
    if (!result.success) {
      res.status(400).json({ error: result.message });
      return;
    }

    await db.update(users)
      .set({ userEmail: email, userEmailVerified: true })
      .where(eq(users.userId, userId));

    const [shop] = await db.select().from(shops).where(eq(shops.shopId, userId)).limit(1);
    if (shop) {
      await db.update(shops).set({ shopEmail: email, shopEmailVerified: true }).where(eq(shops.shopId, userId));
    }

    res.json({ message: "Xác thực email thành công", userEmail: email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const removeUserEmail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

    const { otp } = req.body;
    if (!otp) { res.status(400).json({ error: "Missing otp" }); return; }

    const [user] = await db.select().from(users).where(eq(users.userId, userId)).limit(1);
    if (!user || !user.userEmail) { res.status(400).json({ error: "Không tìm thấy email hiện tại" }); return; }

    const result = await verificationService.verifyOTP(user.userEmail, otp, "email");
    if (!result.success) {
      res.status(400).json({ error: result.message });
      return;
    }

    await db.update(users)
      .set({ userEmail: null, userEmailVerified: false })
      .where(eq(users.userId, userId));

    const [shop] = await db.select().from(shops).where(eq(shops.shopId, userId)).limit(1);
    if (shop) {
      await db.update(shops).set({ shopEmail: null, shopEmailVerified: false }).where(eq(shops.shopId, userId));
    }

    res.json({ message: "Gỡ email thành công" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
