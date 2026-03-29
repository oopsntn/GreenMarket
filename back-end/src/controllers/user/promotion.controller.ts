import { Request, Response } from "express";
import { db } from "../../config/db";
import { eq, and } from "drizzle-orm";
import { promotionPackages } from "../../models/schema/promotion-packages";
import { placementSlots } from "../../models/schema/placement-slots";
import { type PromotionPackageParams } from "../../dtos/promotion";
import { parseId } from "../../utils/parseId";

export const getPublishedPackages = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const packages = await db
            .select({
                promotionPackageId: promotionPackages.promotionPackageId,
                promotionPackageTitle: promotionPackages.promotionPackageTitle,
                promotionPackageDurationDays: promotionPackages.promotionPackageDurationDays,
                promotionPackagePrice: promotionPackages.promotionPackagePrice,
                slotCode: placementSlots.placementSlotCode,
                slotTitle: placementSlots.placementSlotTitle,
            })
            .from(promotionPackages)
            .innerJoin(placementSlots, eq(promotionPackages.promotionPackageSlotId, placementSlots.placementSlotId))
            .where(
                and(
                    eq(promotionPackages.promotionPackagePublished, true),
                    eq(placementSlots.placementSlotPublished, true)
                )
            )
            .orderBy(promotionPackages.promotionPackagePrice);

        res.json(packages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getPublishedPackageById = async (
    req: Request<PromotionPackageParams>,
    res: Response
): Promise<void> => {
    try {
        const idNumber = parseId(req.params.id);

        if (idNumber === null) {
            res.status(400).json({ error: "Invalid package id" });
            return;
        }

        const [pkg] = await db
            .select({
                promotionPackageId: promotionPackages.promotionPackageId,
                promotionPackageTitle: promotionPackages.promotionPackageTitle,
                promotionPackageDurationDays: promotionPackages.promotionPackageDurationDays,
                promotionPackagePrice: promotionPackages.promotionPackagePrice,
                slotCode: placementSlots.placementSlotCode,
                slotTitle: placementSlots.placementSlotTitle,
                slotCapacity: placementSlots.placementSlotCapacity,
            })
            .from(promotionPackages)
            .innerJoin(placementSlots, eq(promotionPackages.promotionPackageSlotId, placementSlots.placementSlotId))
            .where(
                and(
                    eq(promotionPackages.promotionPackageId, idNumber),
                    eq(promotionPackages.promotionPackagePublished, true),
                    eq(placementSlots.placementSlotPublished, true)
                )
            )
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
