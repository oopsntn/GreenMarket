import { Request, Response } from "express";
import { db } from "../../config/db";
import { eq, and, lte, or, isNull, gt, inArray } from "drizzle-orm";
import { promotionPackages } from "../../models/schema/promotion-packages";
import { placementSlots } from "../../models/schema/placement-slots";
import { promotionPackagePrices } from "../../models/schema/promotion-package-prices";
import { shops } from "../../models/schema/shops";
import { type PromotionPackageParams } from "../../dtos/promotion";
import { parseId } from "../../utils/parseId";
import { type AuthRequest } from "../../dtos/auth";
import { BOOST_POST_SLOT_CODE, SHOP_VIP_SLOT_CODE } from "../../constants/promotion";

const queryPublishedPackages = async (slotCodes: string[]) => {
    const now = new Date();
    return db
        .select({
            promotionPackageId: promotionPackages.promotionPackageId,
            promotionPackageTitle: promotionPackages.promotionPackageTitle,
            promotionPackageDurationDays: promotionPackages.promotionPackageDurationDays,
            promotionPackagePrice: promotionPackagePrices.price,
            promotionPackageMaxPosts: promotionPackages.promotionPackageMaxPosts,
            promotionPackageDisplayQuota: promotionPackages.promotionPackageDisplayQuota,
            promotionPackageDescription: promotionPackages.promotionPackageDescription,
            slotCode: placementSlots.placementSlotCode,
            slotTitle: placementSlots.placementSlotTitle,
            slotCapacity: placementSlots.placementSlotCapacity,
            slotRules: placementSlots.placementSlotRules,
        })
        .from(promotionPackages)
        .innerJoin(placementSlots, eq(promotionPackages.promotionPackageSlotId, placementSlots.placementSlotId))
        .leftJoin(
            promotionPackagePrices,
            and(
                eq(promotionPackagePrices.packageId, promotionPackages.promotionPackageId),
                lte(promotionPackagePrices.effectiveFrom, now),
                or(
                    isNull(promotionPackagePrices.effectiveTo),
                    gt(promotionPackagePrices.effectiveTo, now)
                )
            )
        )
        .where(
            and(
                eq(promotionPackages.promotionPackagePublished, true),
                eq(placementSlots.placementSlotPublished, true),
                inArray(placementSlots.placementSlotCode, slotCodes)
            )
        )
        .orderBy(promotionPackages.promotionPackageDurationDays);
};

export const getPublishedPackages = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const packages = await queryPublishedPackages([BOOST_POST_SLOT_CODE]);

        res.json(packages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getEligiblePackages = async (
    req: AuthRequest,
    res: Response,
): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const [activeShop] = await db
            .select({
                shopId: shops.shopId,
            })
            .from(shops)
            .where(and(eq(shops.shopId, userId), eq(shops.shopStatus, "active")))
            .limit(1);

        const packages = await queryPublishedPackages([BOOST_POST_SLOT_CODE]);
        
        res.json({
            audience: activeShop ? "garden_owner" : "individual",
            packages,
        });
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

        const now = new Date();
        const [pkg] = await db
            .select({
                promotionPackageId: promotionPackages.promotionPackageId,
                promotionPackageTitle: promotionPackages.promotionPackageTitle,
                promotionPackageDurationDays: promotionPackages.promotionPackageDurationDays,
                promotionPackagePrice: promotionPackagePrices.price,
                promotionPackageMaxPosts: promotionPackages.promotionPackageMaxPosts,
                promotionPackageDisplayQuota: promotionPackages.promotionPackageDisplayQuota,
                promotionPackageDescription: promotionPackages.promotionPackageDescription,
                slotCode: placementSlots.placementSlotCode,
                slotTitle: placementSlots.placementSlotTitle,
                slotCapacity: placementSlots.placementSlotCapacity,
                slotRules: placementSlots.placementSlotRules,
            })
            .from(promotionPackages)
            .innerJoin(placementSlots, eq(promotionPackages.promotionPackageSlotId, placementSlots.placementSlotId))
            .leftJoin(
                promotionPackagePrices,
                and(
                    eq(promotionPackagePrices.packageId, promotionPackages.promotionPackageId),
                    lte(promotionPackagePrices.effectiveFrom, now),
                    or(
                        isNull(promotionPackagePrices.effectiveTo),
                        gt(promotionPackagePrices.effectiveTo, now)
                    )
                )
            )
            .where(
                and(
                    eq(promotionPackages.promotionPackageId, idNumber),
                    eq(promotionPackages.promotionPackagePublished, true),
                    eq(placementSlots.placementSlotPublished, true),
                    eq(placementSlots.placementSlotCode, BOOST_POST_SLOT_CODE)
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

export const getShopVipPackage = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const [vipPackage] = await queryPublishedPackages([SHOP_VIP_SLOT_CODE]);

        if (!vipPackage) {
            res.status(404).json({ error: "Shop VIP package not found" });
            return;
        }

        res.json(vipPackage);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};
