import { Request, Response } from "express";
import { db } from "../../config/db.ts";
import { eq, asc } from "drizzle-orm";
import { users, businessRoles } from "../../models/schema/index.ts";
import { parseId } from "../../utils/parseId.ts";

const buildUserBaseQuery = () =>
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

export const getUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const allUsers = await buildUserBaseQuery().orderBy(asc(users.userId));
    res.json(allUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserById = async (
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> => {
  try {
    const idNumber = parseId(req.params.id);
    if (idNumber === null) {
      res.status(400).json({ error: "Invalid user id" });
      return;
    }

    const [user] = await buildUserBaseQuery()
      .where(eq(users.userId, idNumber))
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

export const updateUserStatus = async (
  req: Request<{ id: string }, {}, { status: string }>,
  res: Response,
): Promise<void> => {
  try {
    const idNumber = parseId(req.params.id);
    if (idNumber === null) {
      res.status(400).json({ error: "Invalid user id" });
      return;
    }

    const { status } = req.body;

    if (!status?.trim()) {
      res.status(400).json({ error: "status is required" });
      return;
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        userStatus: status,
        userUpdatedAt: new Date(),
      })
      .where(eq(users.userId, idNumber))
      .returning();

    if (!updatedUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const [userWithRole] = await buildUserBaseQuery()
      .where(eq(users.userId, idNumber))
      .limit(1);

    res.json(userWithRole ?? updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const assignUserBusinessRole = async (
  req: Request<{ id: string }, {}, { businessRoleId?: number | null }>,
  res: Response,
): Promise<void> => {
  try {
    const userId = parseId(req.params.id);
    if (userId === null) {
      res.status(400).json({ error: "Invalid user id" });
      return;
    }

    const { businessRoleId } = req.body;

    const [existingUser] = await db
      .select({ userId: users.userId })
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1);

    if (!existingUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (businessRoleId !== null && businessRoleId !== undefined) {
      if (!Number.isInteger(businessRoleId) || businessRoleId <= 0) {
        res.status(400).json({ error: "Invalid businessRoleId" });
        return;
      }

      const [role] = await db
        .select({
          businessRoleId: businessRoles.businessRoleId,
          businessRoleStatus: businessRoles.businessRoleStatus,
        })
        .from(businessRoles)
        .where(eq(businessRoles.businessRoleId, businessRoleId))
        .limit(1);

      if (!role) {
        res.status(404).json({ error: "Business role not found" });
        return;
      }

      if (role.businessRoleStatus !== "active") {
        res
          .status(400)
          .json({ error: "Only active business roles can be assigned" });
        return;
      }
    }

    await db
      .update(users)
      .set({
        userBusinessRoleId: businessRoleId ?? null,
        userUpdatedAt: new Date(),
      })
      .where(eq(users.userId, userId));

    const [updatedUser] = await buildUserBaseQuery()
      .where(eq(users.userId, userId))
      .limit(1);

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
