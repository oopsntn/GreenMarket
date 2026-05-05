import { Request, Response } from "express";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "../../config/db";
import { users, businessRoles, eventLogs, shops } from "../../models/schema/index";
import { parseId } from "../../utils/parseId";
import { AuthRequest } from "../../dtos/auth";
import { toAdminBangkokIsoString } from "../../utils/adminDateTime";

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

const formatDateTime = (value: Date | string | null | undefined) => {
  return toAdminBangkokIsoString(value);
};

const buildUserDetailPayload = async (userId: number) => {
  const [user] = await buildUserBaseQuery()
    .where(eq(users.userId, userId))
    .limit(1);

  if (!user) {
    return null;
  }

  const historyRows = await db
    .select({
      eventLogId: eventLogs.eventLogId,
      eventLogEventType: eventLogs.eventLogEventType,
      eventLogEventTime: eventLogs.eventLogEventTime,
      eventLogMeta: eventLogs.eventLogMeta,
    })
    .from(eventLogs)
    .where(eq(eventLogs.eventLogUserId, userId))
    .orderBy(desc(eventLogs.eventLogEventTime));

  const activityHistory = historyRows.map((item) => {
    const meta = (item.eventLogMeta ?? {}) as Record<string, unknown>;

    return {
      id: item.eventLogId,
      action: String(meta.action ?? "Hoạt động hệ thống"),
      detail: String(meta.detail ?? "Không có chi tiết."),
      performedBy: String(meta.performedBy ?? "Quản trị viên hệ thống"),
      performedAt: formatDateTime(item.eventLogEventTime),
      reason:
        typeof meta.reason === "string" && meta.reason.trim()
          ? meta.reason.trim()
          : null,
    };
  });

  const roleHistory = historyRows
    .filter((item) => item.eventLogEventType === "admin_user_role_assigned")
    .map((item) => {
      const meta = (item.eventLogMeta ?? {}) as Record<string, unknown>;

      return {
        id: item.eventLogId,
        previousRole:
          typeof meta.previousRole === "string" ? meta.previousRole : null,
        nextRole: typeof meta.nextRole === "string" ? meta.nextRole : null,
        assignedBy: String(meta.performedBy ?? "Quản trị viên hệ thống"),
        assignedAt: formatDateTime(item.eventLogEventTime),
        note: String(meta.detail ?? "Cập nhật vai trò nghiệp vụ."),
      };
    });

  return {
    ...user,
    activityHistory,
    roleHistory,
  };
};

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

    const user = await buildUserDetailPayload(idNumber);

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

    const { status, reason } = req.body as { status?: string; reason?: string };

    if (!status?.trim()) {
      res.status(400).json({ error: "Trạng thái người dùng là bắt buộc." });
      return;
    }

    if (!reason?.trim()) {
      res.status(400).json({ error: "Vui lòng nhập lý do khóa hoặc mở khóa." });
      return;
    }

    const normalizedStatus = status.trim().toLowerCase();
    const isBlocked = normalizedStatus === "blocked";

    const [updatedUser] = await db
      .update(users)
      .set({
        userStatus: normalizedStatus,
        userUpdatedAt: new Date(),
      })
      .where(eq(users.userId, idNumber))
      .returning();

    if (!updatedUser) {
      res.status(404).json({ error: "Không tìm thấy người dùng." });
      return;
    }

    await db.insert(eventLogs).values({
      eventLogUserId: null, // Performer is admin, but we don't store AdminID in eventLogUserId yet
      eventLogTargetType: "user",
      eventLogTargetId: idNumber,
      eventLogEventType: isBlocked
        ? "admin_user_locked"
        : "admin_user_unlocked",
      eventLogEventTime: new Date(),
      eventLogMeta: {
        action: isBlocked ? "Khóa tài khoản" : "Mở khóa tài khoản",
        detail: isBlocked
          ? `Tài khoản đã bị khóa. Lý do: ${reason.trim()}`
          : `Tài khoản đã được mở khóa. Lý do: ${reason.trim()}`,
        performedBy: getPerformedBy(req),
        reason: reason.trim(),
        result: isBlocked ? "Đã khóa" : "Đã mở khóa",
        moduleLabel: "Người dùng",
        targetType: "Tài khoản người dùng",
        targetName:
          updatedUser.userDisplayName ||
          updatedUser.userEmail ||
          updatedUser.userMobile ||
          `Người dùng #${updatedUser.userId}`,
      },
    });

    const userWithHistory = await buildUserDetailPayload(idNumber);
    res.json(userWithHistory ?? updatedUser);
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

    const [existingUser] = await buildUserBaseQuery()
      .where(eq(users.userId, userId))
      .limit(1);

    if (!existingUser) {
      res.status(404).json({ error: "Không tìm thấy người dùng." });
      return;
    }

    let nextRoleTitle: string | null = null;

    if (businessRoleId !== null && businessRoleId !== undefined) {
      if (!Number.isInteger(businessRoleId) || businessRoleId <= 0) {
        res.status(400).json({ error: "Mã vai trò nghiệp vụ không hợp lệ." });
        return;
      }

      const [role] = await db
        .select({
          businessRoleId: businessRoles.businessRoleId,
          businessRoleCode: businessRoles.businessRoleCode,
          businessRoleStatus: businessRoles.businessRoleStatus,
          businessRoleTitle: businessRoles.businessRoleTitle,
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

      if (role.businessRoleCode?.toUpperCase() === "USER") {
        const [ownedShop] = await db
          .select({ shopId: shops.shopId })
          .from(shops)
          .where(eq(shops.shopId, userId))
          .limit(1);

        if (
          existingUser.businessRoleCode?.toUpperCase() === "HOST" ||
          ownedShop
        ) {
          res.status(400).json({
            error:
              "Tài khoản đang là chủ vườn hoặc đang sở hữu cửa hàng nên không thể gán về vai trò Người dùng.",
          });
          return;
        }
      }

      nextRoleTitle = role.businessRoleTitle;
    }

    await db
      .update(users)
      .set({
        userBusinessRoleId: businessRoleId ?? null,
        userUpdatedAt: new Date(),
      })
      .where(eq(users.userId, userId));

    await db.insert(eventLogs).values({
      eventLogUserId: null,
      eventLogTargetType: "user",
      eventLogTargetId: userId,
      eventLogEventType: "admin_user_role_assigned",
      eventLogEventTime: new Date(),
      eventLogMeta: {
        action: "Cập nhật vai trò nghiệp vụ",
        detail: nextRoleTitle
          ? `Đã đổi vai trò từ ${existingUser.businessRoleTitle ?? "Chưa gán"} sang ${nextRoleTitle}.`
          : `Đã gỡ vai trò ${existingUser.businessRoleTitle ?? "hiện tại"} khỏi tài khoản người dùng.`,
        performedBy: getPerformedBy(req),
        previousRole: existingUser.businessRoleTitle ?? null,
        nextRole: nextRoleTitle,
        result: "Đã cập nhật",
        moduleLabel: "Người dùng",
        targetType: "Tài khoản người dùng",
        targetName:
          existingUser.userDisplayName ||
          existingUser.userEmail ||
          existingUser.userMobile ||
          `Người dùng #${existingUser.userId}`,
      },
    });

    const updatedUser = await buildUserDetailPayload(userId);
    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ." });
  }
};
