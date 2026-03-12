import { Router } from "express";

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

router.get("/", getCategories);

router.get("/:id", getCategoryById);

router.post("/", validateCreateCategory, createCategory);

router.put("/:id", validateUpdateCategory, updateCategory);

router.delete("/:id", deleteCategory);

export default router;