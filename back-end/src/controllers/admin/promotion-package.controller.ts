import { Request, Response } from "express";
import { db } from "../../config/db";
import { eq } from "drizzle-orm";
import { promotionPackages, type NewPromotionPackage } from "../../models/schema/promotion-packages";
import { placementSlots } from "../../models/schema/placement-slots";
import { postPromotions } from "../../models/schema/post-promotions";
import { type PromotionPackageParams } from "../../dtos/promotion";
import { parseId } from "../../utils/parseId";

export const getPromotionPackages = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const allPackages = await db
            .select({
                promotionPackageId: promotionPackages.promotionPackageId,
                promotionPackageSlotId: promotionPackages.promotionPackageSlotId,
                promotionPackageTitle: promotionPackages.promotionPackageTitle,
                promotionPackageDurationDays: promotionPackages.promotionPackageDurationDays,
                promotionPackagePrice: promotionPackages.promotionPackagePrice,
                promotionPackageMaxPosts: promotionPackages.promotionPackageMaxPosts,
                promotionPackageDisplayQuota: promotionPackages.promotionPackageDisplayQuota,
                promotionPackageDescription: promotionPackages.promotionPackageDescription,
                promotionPackagePublished: promotionPackages.promotionPackagePublished,
                promotionPackageCreatedAt: promotionPackages.promotionPackageCreatedAt,
                slotCode: placementSlots.placementSlotCode,
                slotTitle: placementSlots.placementSlotTitle,
            })
            .from(promotionPackages)
            .leftJoin(placementSlots, eq(promotionPackages.promotionPackageSlotId, placementSlots.placementSlotId));

        res.json(allPackages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getPromotionPackageById = async (
    req: Request<PromotionPackageParams>,
    res: Response
): Promise<void> => {
    try {
        const idNumber = parseId(req.params.id);

        if (idNumber === null) {
            res.status(400).json({ error: "Invalid promotion package id" });
            return;
        }

        const [pkg] = await db
            .select({
                promotionPackageId: promotionPackages.promotionPackageId,
                promotionPackageSlotId: promotionPackages.promotionPackageSlotId,
                promotionPackageTitle: promotionPackages.promotionPackageTitle,
                promotionPackageDurationDays: promotionPackages.promotionPackageDurationDays,
                promotionPackagePrice: promotionPackages.promotionPackagePrice,
                promotionPackageMaxPosts: promotionPackages.promotionPackageMaxPosts,
                promotionPackageDisplayQuota: promotionPackages.promotionPackageDisplayQuota,
                promotionPackageDescription: promotionPackages.promotionPackageDescription,
                promotionPackagePublished: promotionPackages.promotionPackagePublished,
                promotionPackageCreatedAt: promotionPackages.promotionPackageCreatedAt,
                slotCode: placementSlots.placementSlotCode,
                slotTitle: placementSlots.placementSlotTitle,
            })
            .from(promotionPackages)
            .leftJoin(placementSlots, eq(promotionPackages.promotionPackageSlotId, placementSlots.placementSlotId))
            .where(eq(promotionPackages.promotionPackageId, idNumber))
            .limit(1);

        if (!pkg) {
            res.status(404).json({ error: "Promotion package not found" });
            return;
        }

        res.json(pkg);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const createPromotionPackage = async (
    req: Request<{}, {}, NewPromotionPackage>,
    res: Response
): Promise<void> => {
    try {
        const {
            promotionPackageSlotId,
            promotionPackageTitle,
            promotionPackageDurationDays,
            promotionPackagePrice,
            promotionPackageMaxPosts,
            promotionPackageDisplayQuota,
        } = req.body;

        if (
            !promotionPackageSlotId ||
            !promotionPackageTitle ||
            !promotionPackageDurationDays ||
            !promotionPackagePrice
        ) {
            res.status(400).json({ error: "slotId, title, durationDays, and price are required" });
            return;
        }

        if (
            (promotionPackageMaxPosts !== undefined && Number(promotionPackageMaxPosts) < 1) ||
            (promotionPackageDisplayQuota !== undefined && Number(promotionPackageDisplayQuota) < 1)
        ) {
            res.status(400).json({ error: "maxPosts and displayQuota must be at least 1 when provided" });
            return;
        }

        // Validate slot exists
        const [slot] = await db
            .select()
            .from(placementSlots)
            .where(eq(placementSlots.placementSlotId, promotionPackageSlotId))
            .limit(1);

        if (!slot) {
            res.status(400).json({ error: "Placement slot not found" });
            return;
        }

        const [newPkg] = await db
            .insert(promotionPackages)
            .values({
                ...req.body,
                promotionPackageMaxPosts: req.body.promotionPackageMaxPosts ?? 1,
                promotionPackageDisplayQuota: req.body.promotionPackageDisplayQuota ?? 1,
                promotionPackagePublished: req.body.promotionPackagePublished ?? false,
            })
            .returning();

        res.status(201).json(newPkg);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const updatePromotionPackage = async (
    req: Request<PromotionPackageParams, {}, Partial<NewPromotionPackage>>,
    res: Response
): Promise<void> => {
    try {
        const idNumber = parseId(req.params.id);

        if (idNumber === null) {
            res.status(400).json({ error: "Invalid promotion package id" });
            return;
        }

        // If slotId is being updated, validate it exists
        if (req.body.promotionPackageSlotId) {
            const [slot] = await db
                .select()
                .from(placementSlots)
                .where(eq(placementSlots.placementSlotId, req.body.promotionPackageSlotId))
                .limit(1);

            if (!slot) {
                res.status(400).json({ error: "Placement slot not found" });
                return;
            }
        }

        const [updatedPkg] = await db
            .update(promotionPackages)
            .set(req.body)
            .where(eq(promotionPackages.promotionPackageId, idNumber))
            .returning();

        if (!updatedPkg) {
            res.status(404).json({ error: "Promotion package not found" });
            return;
        }

        res.json(updatedPkg);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const deletePromotionPackage = async (
    req: Request<PromotionPackageParams>,
    res: Response
): Promise<void> => {
    try {
        const idNumber = parseId(req.params.id);

        if (idNumber === null) {
            res.status(400).json({ error: "Invalid promotion package id" });
            return;
        }

        // Check for linked post promotions before deleting (CASCADE would silently delete them)
        const linkedPromotions = await db
            .select()
            .from(postPromotions)
            .where(eq(postPromotions.postPromotionPackageId, idNumber))
            .limit(1);

        if (linkedPromotions.length > 0) {
            res.status(400).json({ error: "Cannot delete package that has active promotions linked to it" });
            return;
        }

        const [pkg] = await db
            .delete(promotionPackages)
            .where(eq(promotionPackages.promotionPackageId, idNumber))
            .returning();

        if (!pkg) {
            res.status(404).json({ error: "Promotion package not found" });
            return;
        }

        res.json({
            message: "Promotion package deleted successfully",
            package: pkg,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};
