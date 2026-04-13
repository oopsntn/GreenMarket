import { Request, Response } from "express";
import { eq, asc } from "drizzle-orm";
import { db } from "../../config/db.ts";
import { businessRoles, users } from "../../models/schema/index.ts";
import { parseId } from "../../utils/parseId.ts";

type BusinessRolePayload = {
  businessRoleCode?: string;
  businessRoleTitle?: string;
  businessRoleAudienceGroup?: string | null;
  businessRoleAccessScope?: string | null;
  businessRoleSummary?: string | null;
  businessRoleResponsibilities?: string[] | null;
  businessRoleCapabilities?: string[] | null;
  businessRoleStatus?: string | null;
};

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeStatus = (value: unknown): "active" | "disabled" => {
  return value === "disabled" ? "disabled" : "active";
};

export const getBusinessRoles = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const rows = await db
      .select()
      .from(businessRoles)
      .orderBy(asc(businessRoles.businessRoleId));

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ." });
  }
};

export const getBusinessRoleById = async (
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> => {
  try {
    const roleId = parseId(req.params.id);
    if (roleId === null) {
      res.status(400).json({ error: "Mã vai trò nghiệp vụ không hợp lệ." });
      return;
    }

    const [role] = await db
      .select()
      .from(businessRoles)
      .where(eq(businessRoles.businessRoleId, roleId))
      .limit(1);

    if (!role) {
      res.status(404).json({ error: "Không tìm thấy vai trò nghiệp vụ." });
      return;
    }

    res.json(role);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ." });
  }
};

export const createBusinessRole = async (
  req: Request<{}, {}, BusinessRolePayload>,
  res: Response,
): Promise<void> => {
  try {
    const {
      businessRoleCode,
      businessRoleTitle,
      businessRoleAudienceGroup,
      businessRoleAccessScope,
      businessRoleSummary,
      businessRoleResponsibilities,
      businessRoleCapabilities,
      businessRoleStatus,
    } = req.body;

    if (!businessRoleCode?.trim() || !businessRoleTitle?.trim()) {
      res.status(400).json({
        error: "Mã vai trò và tên vai trò là bắt buộc.",
      });
      return;
    }

    const [createdRole] = await db
      .insert(businessRoles)
      .values({
        businessRoleCode: businessRoleCode.trim().toUpperCase(),
        businessRoleTitle: businessRoleTitle.trim(),
        businessRoleAudienceGroup: businessRoleAudienceGroup?.trim() || null,
        businessRoleAccessScope: businessRoleAccessScope?.trim() || null,
        businessRoleSummary: businessRoleSummary?.trim() || null,
        businessRoleResponsibilities: normalizeStringArray(
          businessRoleResponsibilities,
        ),
        businessRoleCapabilities: normalizeStringArray(
          businessRoleCapabilities,
        ),
        businessRoleStatus: normalizeStatus(businessRoleStatus),
        businessRoleCreatedAt: new Date(),
        businessRoleUpdatedAt: new Date(),
      })
      .returning();

    res.status(201).json(createdRole);
  } catch (error: any) {
    if (error?.code === "23505") {
      res.status(409).json({ error: "Mã vai trò nghiệp vụ đã tồn tại." });
      return;
    }

    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ." });
  }
};

export const updateBusinessRole = async (
  req: Request<{ id: string }, {}, BusinessRolePayload>,
  res: Response,
): Promise<void> => {
  try {
    const roleId = parseId(req.params.id);
    if (roleId === null) {
      res.status(400).json({ error: "Mã vai trò nghiệp vụ không hợp lệ." });
      return;
    }

    const {
      businessRoleCode,
      businessRoleTitle,
      businessRoleAudienceGroup,
      businessRoleAccessScope,
      businessRoleSummary,
      businessRoleResponsibilities,
      businessRoleCapabilities,
      businessRoleStatus,
    } = req.body;

    const updatePayload: Partial<typeof businessRoles.$inferInsert> = {
      businessRoleUpdatedAt: new Date(),
    };

    if (businessRoleCode !== undefined) {
      updatePayload.businessRoleCode = businessRoleCode.trim().toUpperCase();
    }
    if (businessRoleTitle !== undefined) {
      updatePayload.businessRoleTitle = businessRoleTitle.trim();
    }
    if (businessRoleAudienceGroup !== undefined) {
      updatePayload.businessRoleAudienceGroup =
        businessRoleAudienceGroup?.trim() || null;
    }
    if (businessRoleAccessScope !== undefined) {
      updatePayload.businessRoleAccessScope =
        businessRoleAccessScope?.trim() || null;
    }
    if (businessRoleSummary !== undefined) {
      updatePayload.businessRoleSummary = businessRoleSummary?.trim() || null;
    }
    if (businessRoleResponsibilities !== undefined) {
      updatePayload.businessRoleResponsibilities = normalizeStringArray(
        businessRoleResponsibilities,
      );
    }
    if (businessRoleCapabilities !== undefined) {
      updatePayload.businessRoleCapabilities = normalizeStringArray(
        businessRoleCapabilities,
      );
    }
    if (businessRoleStatus !== undefined) {
      updatePayload.businessRoleStatus = normalizeStatus(businessRoleStatus);
    }

    const [updatedRole] = await db
      .update(businessRoles)
      .set(updatePayload)
      .where(eq(businessRoles.businessRoleId, roleId))
      .returning();

    if (!updatedRole) {
      res.status(404).json({ error: "Không tìm thấy vai trò nghiệp vụ." });
      return;
    }

    res.json(updatedRole);
  } catch (error: any) {
    if (error?.code === "23505") {
      res.status(409).json({ error: "Mã vai trò nghiệp vụ đã tồn tại." });
      return;
    }

    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ." });
  }
};

export const updateBusinessRoleStatus = async (
  req: Request<{ id: string }, {}, { businessRoleStatus?: string }>,
  res: Response,
): Promise<void> => {
  try {
    const roleId = parseId(req.params.id);
    if (roleId === null) {
      res.status(400).json({ error: "Mã vai trò nghiệp vụ không hợp lệ." });
      return;
    }

    const nextStatus = normalizeStatus(req.body.businessRoleStatus);

    const [updatedRole] = await db
      .update(businessRoles)
      .set({
        businessRoleStatus: nextStatus,
        businessRoleUpdatedAt: new Date(),
      })
      .where(eq(businessRoles.businessRoleId, roleId))
      .returning();

    if (!updatedRole) {
      res.status(404).json({ error: "Không tìm thấy vai trò nghiệp vụ." });
      return;
    }

    res.json(updatedRole);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ." });
  }
};

export const deleteBusinessRole = async (
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> => {
  try {
    const roleId = parseId(req.params.id);
    if (roleId === null) {
      res.status(400).json({ error: "Mã vai trò nghiệp vụ không hợp lệ." });
      return;
    }

    const [role] = await db
      .select()
      .from(businessRoles)
      .where(eq(businessRoles.businessRoleId, roleId))
      .limit(1);

    if (!role) {
      res.status(404).json({ error: "Không tìm thấy vai trò nghiệp vụ." });
      return;
    }

    const [assignedUser] = await db
      .select({ userId: users.userId })
      .from(users)
      .where(eq(users.userBusinessRoleId, roleId))
      .limit(1);

    if (assignedUser) {
      res.status(400).json({
        error: "Không thể xóa vai trò nghiệp vụ đang được gán cho người dùng.",
      });
      return;
    }

    await db
      .delete(businessRoles)
      .where(eq(businessRoles.businessRoleId, roleId));

    res.json({ message: "Đã xóa vai trò nghiệp vụ thành công." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ." });
  }
};
