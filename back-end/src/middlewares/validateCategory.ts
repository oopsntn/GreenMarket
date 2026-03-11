import { Request, Response, NextFunction } from "express";
import { CreateCategoryBody, UpdateCategoryBody } from "../dtos/categories";

export const validateCreateCategory = (
    req: Request<{}, {}, CreateCategoryBody>,
    res: Response,
    next: NextFunction
) => {
    const { categoryTitle, categorySlug } = req.body;

    if (!categoryTitle || typeof categoryTitle !== "string") {
        return res.status(400).json({
            error: "categoryTitle is required and must be a string",
        });
    }

    if (categorySlug && typeof categorySlug !== "string") {
        return res.status(400).json({ error: "categorySlug must be a string" });
    }

    next();
};

export const validateUpdateCategory = (
    req: Request<{}, {}, UpdateCategoryBody>,
    res: Response,
    next: NextFunction
) => {
    const { categoryTitle, categorySlug, categoryPublished } = req.body;

    if (categoryTitle && typeof categoryTitle !== "string") {
        return res.status(400).json({ error: "categoryTitle must be a string" });
    }

    if (categorySlug && typeof categorySlug !== "string") {
        return res.status(400).json({ error: "categorySlug must be a string" });
    }

    if (categoryPublished !== undefined && typeof categoryPublished !== "boolean") {
        return res.status(400).json({ error: "categoryPublished must be a boolean" });
    }

    next();
};