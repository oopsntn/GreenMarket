import { Request, Response } from "express";
import { db } from "../../config/db";
import { eq, and } from "drizzle-orm";
import { categories, categoryAttributes, attributes } from "../../models/schema/index.ts";
import { parseId } from "../../utils/parseId";

export const getCategories = async (req: Request, res: Response): Promise<void> => {
    try {
        const allCategories = await db.select()
            .from(categories)
            .where(eq(categories.categoryPublished, true));
        res.json(allCategories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getCategoryAttributes = async (req: Request, res: Response): Promise<void> => {
    try {
        const categoryId = parseId(req.params.id as string);
        if (!categoryId) {
            res.status(400).json({ error: "Invalid category ID" });
            return;
        }

        const categoryAttrs = await db.select({
            attributeId: attributes.attributeId,
            attributeCode: attributes.attributeCode,
            attributeTitle: attributes.attributeTitle,
            attributeDataType: attributes.attributeDataType,
            attributeOptions: attributes.attributeOptions,
            required: categoryAttributes.required
        })
        .from(categoryAttributes)
        .innerJoin(attributes, eq(categoryAttributes.attributeId, attributes.attributeId))
        .where(eq(categoryAttributes.categoryId, categoryId));

        res.json(categoryAttrs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};
