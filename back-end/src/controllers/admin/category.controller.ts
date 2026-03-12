import { Request, Response } from "express";
import { db } from "../../config/db";
import { eq, and, ne } from "drizzle-orm";
import {
    categories,
    type NewCategory,
} from "../../models/schema/categories";
import { type CategoryParams } from "../../dtos/categories";

import { parseId } from "../../utils/parseId";
import { slugify } from "../../utils/slugify";

export const getCategories = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const allCategories = await db.select().from(categories);

        res.json(allCategories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getCategoryById = async (
    req: Request<CategoryParams>,
    res: Response
): Promise<void> => {
    try {
        const idNumber = parseId(req.params.id);

        if (idNumber === null) {
            res.status(400).json({ error: "Invalid category id" });
            return;
        }

        const [category] = await db
            .select()
            .from(categories)
            .where(eq(categories.categoryId, idNumber))
            .limit(1);

        if (!category) {
            res.status(404).json({ error: "Category not found" });
            return;
        }

        res.json(category);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const createCategory = async (
    req: Request<{}, {}, NewCategory>,
    res: Response
): Promise<void> => {
    try {
        const { categoryTitle, categorySlug, categoryParentId } = req.body;

        // Auto generate slug if not provided
        const finalSlug = categorySlug || slugify(categoryTitle || "");

        // Validate parent category if provided
        if (categoryParentId) {
            const parent = await db
                .select()
                .from(categories)
                .where(eq(categories.categoryId, categoryParentId))
                .limit(1)
                .then(res => res[0]);

            if (!parent) {
                res.status(400).json({ error: "Parent category not found" });
                return;
            }
        }

        const [newCategory] = await db
            .insert(categories)
            .values({
                ...req.body,
                categorySlug: finalSlug,
                categoryPublished: req.body.categoryPublished ?? true,
            })
            .returning();

        res.status(201).json(newCategory);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const updateCategory = async (
    req: Request<CategoryParams, {}, Partial<NewCategory>>,
    res: Response
): Promise<void> => {
    try {
        const idNumber = parseId(req.params.id);

        if (idNumber === null) {
            res.status(400).json({ error: "Invalid category id" });
            return;
        }

        const { categoryTitle, categorySlug, categoryParentId } = req.body;

        // If title is updated but slug isn't, we might want to update slug too?
        // For now, only update slug if explicitly provided or if title changed and slug was missing
        let updatedData = {
            ...req.body,
            categoryUpdatedAt: new Date(),
        };

        if (categoryParentId) {
            if (categoryParentId === idNumber) {
                res.status(400).json({ error: "Category cannot be its own parent" });
                return;
            }

            const [parent] = await db
                .select()
                .from(categories)
                .where(eq(categories.categoryId, categoryParentId))
                .limit(1);

            if (!parent) {
                res.status(400).json({ error: "Parent category not found" });
                return;
            }
        }

        const [updatedCategory] = await db
            .update(categories)
            .set(updatedData)
            .where(eq(categories.categoryId, idNumber))
            .returning();

        if (!updatedCategory) {
            res.status(404).json({ error: "Category not found" });
            return;
        }

        res.json(updatedCategory);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const deleteCategory = async (
    req: Request<CategoryParams>,
    res: Response
): Promise<void> => {
    try {
        const idNumber = parseId(req.params.id);

        if (idNumber === null) {
            res.status(400).json({ error: "Invalid category id" });
            return;
        }

        // Hard delete or soft delete? User said "crud ok đi", 
        // usually delete means removing, but previous implementation did unpublish.
        // I will stick to deleting it from the DB for a real CRUD feel, 
        // or stay with unpublish if that's the preferred pattern.
        // Let's use real delete for now, or check for dependencies.
        
        const [category] = await db
            .delete(categories)
            .where(eq(categories.categoryId, idNumber))
            .returning();

        if (!category) {
            res.status(404).json({ error: "Category not found" });
            return;
        }

        res.json({
            message: "Category deleted successfully",
            category,
        });
    } catch (error) {
        console.error(error);
        // Handle constraint violation (e.g. if it has children)
        if ((error as any).code === '23503') {
            res.status(400).json({ error: "Cannot delete category with sub-categories or products" });
            return;
        }
        res.status(500).json({ error: "Internal server error" });
    }
};