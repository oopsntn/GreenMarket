import { Request, Response } from "express";
import { db } from "../../config/db";
import { eq } from "drizzle-orm";
import {
    categories,
    type NewCategory,
} from "../../models/schema/categories";
import { type CategoryParams } from "../../dtos/categories";

import { parseId } from "../../utils/parseId";

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

export const createCategory = async (
    req: Request<{}, {}, NewCategory>,
    res: Response
): Promise<void> => {
    try {
        const [newCategory] = (await db
            .insert(categories)
            .values({
                ...req.body,
                categoryPublished: false,
            })
            .returning());

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

        const [updatedCategory] = (await db
            .update(categories)
            .set({
                ...req.body,
                categoryUpdatedAt: new Date(),
            })
            .where(eq(categories.categoryId, idNumber))
            .returning());

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

        const [category] = (await db
            .update(categories)
            .set({
                categoryPublished: false,
                categoryUpdatedAt: new Date(),
            })
            .where(eq(categories.categoryId, idNumber))
            .returning());

        if (!category) {
            res.status(404).json({ error: "Category not found" });
            return;
        }

        res.json({
            message: "Category unpublished successfully",
            category,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};