import { Router } from "express";
import { requireRoles } from "../../middlewares/authMiddleware";

import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
} from "../../controllers/admin/category.controller";

import {
    validateCreateCategory,
    validateUpdateCategory,
} from "../../middlewares/validateCategory";

const router = Router();

router.get("/", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), getCategories);

router.get("/:id", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), getCategoryById);

router.post("/", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), validateCreateCategory, createCategory);

router.put("/:id", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), validateUpdateCategory, updateCategory);

router.delete("/:id", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), deleteCategory);

export default router;
