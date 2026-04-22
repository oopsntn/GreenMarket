import { Request, Response } from "express";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../config/db";
import { admins, adminRoles, roles } from "../../models/schema/index";
import { parseId } from "../../utils/parseId";

export const getRoles = async (_req: Request, res: Response): Promise<void> => {
    try {
        const allRoles = await db.select().from(roles);
        res.json(allRoles);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
    }
};

export const createRole = async (
    req: Request<{}, {}, { roleCode?: string; roleTitle?: string }>,
    res: Response
): Promise<void> => {
    try {
        const { roleCode, roleTitle } = req.body;
        if (!roleCode || !roleTitle) {
            res.status(400).json({ error: "Bắt buộc phải có mã vai trò và tên vai trò" });
            return;
        }

        const [createdRole] = await db.insert(roles).values({
            roleCode,
            roleTitle,
            roleCreatedAt: new Date(),
        }).returning();

        res.status(201).json(createdRole);
    } catch (error: any) {
        if (error?.code === "23505") {
            res.status(409).json({ error: "Mã vai trò đã tồn tại" });
            return;
        }
        console.error(error);
        res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
    }
};

export const updateRole = async (
    req: Request<{ id: string }, {}, { roleCode?: string; roleTitle?: string }>,
    res: Response
): Promise<void> => {
    try {
        const roleId = parseId(req.params.id);
        if (roleId === null) {
            res.status(400).json({ error: "Mã vai trò không hợp lệ" });
            return;
        }

        const { roleCode, roleTitle } = req.body;
        if (roleCode === undefined && roleTitle === undefined) {
            res.status(400).json({ error: "Không có dữ liệu cập nhật" });
            return;
        }

        const [updatedRole] = await db.update(roles)
            .set({
                roleCode,
                roleTitle,
            })
            .where(eq(roles.roleId, roleId))
            .returning();

        if (!updatedRole) {
            res.status(404).json({ error: "Không tìm thấy vai trò" });
            return;
        }

        res.json(updatedRole);
    } catch (error: any) {
        if (error?.code === "23505") {
            res.status(409).json({ error: "Mã vai trò đã tồn tại" });
            return;
        }
        console.error(error);
        res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
    }
};

export const deleteRole = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
        const roleId = parseId(req.params.id);
        if (roleId === null) {
            res.status(400).json({ error: "Mã vai trò không hợp lệ" });
            return;
        }

        const [roleToDelete] = await db.select().from(roles).where(eq(roles.roleId, roleId)).limit(1);
        if (!roleToDelete) {
            res.status(404).json({ error: "Không tìm thấy vai trò" });
            return;
        }

        if (roleToDelete.roleCode === "ROLE_SUPER_ADMIN") {
            res.status(400).json({ error: "Không thể xóa vai trò ROLE_SUPER_ADMIN" });
            return;
        }

        const [deletedRole] = await db.delete(roles).where(eq(roles.roleId, roleId)).returning();
        res.json({ message: "Xóa vai trò thành công", deletedRole });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
    }
};

export const getAdminRoleAssignments = async (
    req: Request<{ adminId: string }>,
    res: Response
): Promise<void> => {
    try {
        const adminId = parseId(req.params.adminId);
        if (adminId === null) {
            res.status(400).json({ error: "Mã quản trị viên không hợp lệ" });
            return;
        }

        const [admin] = await db.select().from(admins).where(eq(admins.adminId, adminId)).limit(1);
        if (!admin) {
            res.status(404).json({ error: "Không tìm thấy quản trị viên" });
            return;
        }

        const assignments = await db.select({
            roleId: roles.roleId,
            roleCode: roles.roleCode,
            roleTitle: roles.roleTitle,
        })
        .from(adminRoles)
        .innerJoin(roles, eq(adminRoles.adminRoleRoleId, roles.roleId))
        .where(eq(adminRoles.adminRoleAdminId, adminId));

        res.json({
            adminId,
            roles: assignments,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
    }
};

export const replaceAdminRoleAssignments = async (
    req: Request<{ adminId: string }, {}, { roleIds?: number[] }>,
    res: Response
): Promise<void> => {
    try {
        const adminId = parseId(req.params.adminId);
        if (adminId === null) {
            res.status(400).json({ error: "Mã quản trị viên không hợp lệ" });
            return;
        }

        const roleIds = Array.isArray(req.body.roleIds) ? req.body.roleIds : [];
        const uniqueRoleIds = [...new Set(roleIds.filter((id) => Number.isInteger(id) && id > 0))];

        const [admin] = await db.select().from(admins).where(eq(admins.adminId, adminId)).limit(1);
        if (!admin) {
            res.status(404).json({ error: "Không tìm thấy quản trị viên" });
            return;
        }

        if (uniqueRoleIds.length > 0) {
            const existingRoles = await db.select({ roleId: roles.roleId })
                .from(roles)
                .where(inArray(roles.roleId, uniqueRoleIds));

            if (existingRoles.length !== uniqueRoleIds.length) {
                res.status(400).json({ error: "Một số vai trò được chọn không tồn tại" });
                return;
            }
        }

        await db.transaction(async (tx) => {
            await tx.delete(adminRoles).where(eq(adminRoles.adminRoleAdminId, adminId));

            if (uniqueRoleIds.length > 0) {
                await tx.insert(adminRoles).values(
                    uniqueRoleIds.map((roleId) => ({
                        adminRoleAdminId: adminId,
                        adminRoleRoleId: roleId,
                    }))
                );
            }
        });

        const assignments = await db.select({
            roleId: roles.roleId,
            roleCode: roles.roleCode,
            roleTitle: roles.roleTitle,
        })
        .from(adminRoles)
        .innerJoin(roles, eq(adminRoles.adminRoleRoleId, roles.roleId))
        .where(eq(adminRoles.adminRoleAdminId, adminId));

        res.json({
            adminId,
            roles: assignments,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
    }
};
