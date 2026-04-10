import { Request, Response } from "express";
import { db } from "../../config/db.ts";
import { eq, asc } from "drizzle-orm";
import { users, businessRoles, eventLogs } from "../../models/schema/index.ts";
import { parseId } from "../../utils/parseId.ts";
import { AuthRequest } from "../../dtos/auth.ts";

const getPerformedBy = (req: AuthRequest) =>
  req.user?.email || req.user?.mobile || "Quản trị viên hệ thống";

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
    res.status(500).json({ error: "Lỗi máy chủ nội bộ." });
  }
};

export const getUserById = async (
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> => {
  try {
    const idNumber = parseId(String(req.params.id));
    if (idNumber === null) {
      res.status(400).json({ error: "Mã người dùng không hợp lệ." });
      return;
    }

    const [user] = await buildUserBaseQuery()
      .where(eq(users.userId, idNumber))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "Không tìm thấy người dùng." });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ." });
  }
};

export const updateUserStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const idNumber = parseId(String(req.params.id));
    if (idNumber === null) {
      res.status(400).json({ error: "Mã người dùng không hợp lệ." });
      return;
    }

    const { status } = req.body as { status: string };

    if (!status?.trim()) {
      res.status(400).json({ error: "Trạng thái người dùng là bắt buộc." });
      return;
    }

    const normalizedStatus = status.trim().toLowerCase();
    const isBlocked = normalizedStatus === "blocked";

    const [updatedUser] = await db
      .update(users)
      .set({
        userStatus: status,
        userUpdatedAt: new Date(),
      })
      .where(eq(users.userId, idNumber))
      .returning();

    if (!updatedUser) {
      res.status(404).json({ error: "Không tìm thấy người dùng." });
      return;
    }

    const [userWithRole] = await buildUserBaseQuery()
      .where(eq(users.userId, idNumber))
      .limit(1);

    await db.insert(eventLogs).values({
      eventLogUserId: idNumber,
      eventLogEventType: isBlocked
        ? "admin_user_locked"
        : "admin_user_unlocked",
      eventLogEventTime: new Date(),
      eventLogMeta: {
        action: isBlocked ? "Khóa tài khoản" : "Mở khóa tài khoản",
        detail: isBlocked
          ? "Tài khoản người dùng đã bị khóa bởi quản trị viên."
          : "Tài khoản người dùng đã được mở khóa bởi quản trị viên.",
        performedBy: getPerformedBy(req),
      },
    });

    res.json(userWithRole ?? updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ." });
  }
};

export const assignUserBusinessRole = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = parseId(String(req.params.id));
    if (userId === null) {
      res.status(400).json({ error: "Mã người dùng không hợp lệ." });
      return;
    }

    const { businessRoleId } = req.body as { businessRoleId?: number | null };

    const [existingUser] = await db
      .select({ userId: users.userId })
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1);

    if (!existingUser) {
      res.status(404).json({ error: "Không tìm thấy người dùng." });
      return;
    }

    if (businessRoleId !== null && businessRoleId !== undefined) {
      if (!Number.isInteger(businessRoleId) || businessRoleId <= 0) {
        res.status(400).json({ error: "Mã vai trò nghiệp vụ không hợp lệ." });
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
        res.status(404).json({ error: "Không tìm thấy vai trò nghiệp vụ." });
        return;
      }

      if (role.businessRoleStatus !== "active") {
        res.status(400).json({
          error: "Chỉ có thể gán vai trò nghiệp vụ đang hoạt động.",
        });
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

    await db.insert(eventLogs).values({
      eventLogUserId: userId,
      eventLogEventType: "admin_user_role_assigned",
      eventLogEventTime: new Date(),
      eventLogMeta: {
        action: "Gán vai trò nghiệp vụ",
        detail: updatedUser?.businessRoleTitle
          ? `Đã gán vai trò nghiệp vụ: ${updatedUser.businessRoleTitle}.`
          : "Đã gỡ vai trò nghiệp vụ khỏi tài khoản người dùng.",
        performedBy: getPerformedBy(req),
      },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ." });
  }
};
