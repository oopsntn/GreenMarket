import { Router } from "express";
import {
    createRole,
    deleteRole,
    getAdminRoleAssignments,
    getRoles,
    replaceAdminRoleAssignments,
    updateRole,
} from "../../controllers/admin/role.controller.ts";
import { requireRoles } from "../../middlewares/authMiddleware";

const router = Router();

router.get("/", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), getRoles);
router.post("/", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), createRole);
router.patch("/:id", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), updateRole);
router.delete("/:id", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), deleteRole);

router.get(
    "/admins/:adminId/roles",
    requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
    getAdminRoleAssignments
);
router.put(
    "/admins/:adminId/roles",
    requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
    replaceAdminRoleAssignments
);

export default router;
