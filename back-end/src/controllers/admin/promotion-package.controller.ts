import { Request, Response } from "express";
import {
    and,
    desc,
    eq,
    gt,
    inArray,
    isNull,
    lte,
    or,
} from "drizzle-orm";
import { db } from "../../config/db";
import { promotionPackages } from "../../models/schema/promotion-packages";
import { promotionPackagePrices } from "../../models/schema/promotion-package-prices";
import { placementSlots } from "../../models/schema/placement-slots";
import { postPromotions } from "../../models/schema/post-promotions";
import { type PromotionPackageParams } from "../../dtos/promotion";
import { parseId } from "../../utils/parseId";
import { type AuthRequest } from "../../dtos/auth";

type PackageWithCurrentPrice = {
    promotionPackageId: number;
    promotionPackageSlotId: number;
    promotionPackageTitle: string | null;
    promotionPackageDurationDays: number | null;
    promotionPackageMaxPosts: number | null;
    promotionPackageDisplayQuota: number | null;
    promotionPackageDescription: string | null;
    promotionPackagePublished: boolean | null;
    promotionPackageCreatedAt: Date | null;
    slotCode: string | null;
    slotTitle: string | null;
    promotionPackagePrice: string | null;
    promotionPackagePriceId: number | null;
    promotionPackagePriceEffectiveFrom: Date | null;
};

const parsePositiveInteger = (value: unknown): number | null => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return null;
    }

    return Math.floor(parsed);
};

const parseNonNegativeInteger = (value: unknown, fallback: number): number => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
        return fallback;
    }

    return Math.floor(parsed);
};

const parsePrice = (value: unknown): string | null => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return null;
    }

    return parsed.toFixed(2);
};

const getCurrentPriceRows = async (packageIds: number[]) => {
    if (packageIds.length === 0) {
        return [];
    }

    const now = new Date();

    return db
        .select({
            packageId: promotionPackagePrices.packageId,
            priceId: promotionPackagePrices.priceId,
            price: promotionPackagePrices.price,
            effectiveFrom: promotionPackagePrices.effectiveFrom,
        })
        .from(promotionPackagePrices)
        .where(
            and(
                inArray(promotionPackagePrices.packageId, packageIds),
                lte(promotionPackagePrices.effectiveFrom, now),
                or(
                    isNull(promotionPackagePrices.effectiveTo),
                    gt(promotionPackagePrices.effectiveTo, now),
                ),
            ),
        )
        .orderBy(
            promotionPackagePrices.packageId,
            desc(promotionPackagePrices.effectiveFrom),
            desc(promotionPackagePrices.priceId),
        );
};

const attachCurrentPrices = async (
    rows: Array<Omit<PackageWithCurrentPrice, "promotionPackagePrice" | "promotionPackagePriceId" | "promotionPackagePriceEffectiveFrom">>,
): Promise<PackageWithCurrentPrice[]> => {
    const packageIds = rows.map((row) => row.promotionPackageId);
    const priceRows = await getCurrentPriceRows(packageIds);

    const currentPriceMap = new Map<
        number,
        { price: string | null; priceId: number | null; effectiveFrom: Date | null }
    >();

    for (const priceRow of priceRows) {
        if (currentPriceMap.has(priceRow.packageId)) {
            continue;
        }

        currentPriceMap.set(priceRow.packageId, {
            price: priceRow.price,
            priceId: priceRow.priceId,
            effectiveFrom: priceRow.effectiveFrom,
        });
    }

    return rows.map((row) => {
        const currentPrice = currentPriceMap.get(row.promotionPackageId);
        return {
            ...row,
            promotionPackagePrice: currentPrice?.price ?? null,
            promotionPackagePriceId: currentPrice?.priceId ?? null,
            promotionPackagePriceEffectiveFrom: currentPrice?.effectiveFrom ?? null,
        };
    });
};

const setCurrentPackagePrice = async (params: {
    packageId: number;
    price: string;
    adminId: number | null;
    note: string;
}) => {
    const now = new Date();

    await db
        .update(promotionPackagePrices)
        .set({
            effectiveTo: now,
        })
        .where(
            and(
                eq(promotionPackagePrices.packageId, params.packageId),
                isNull(promotionPackagePrices.effectiveTo),
            ),
        );

    await db.insert(promotionPackagePrices).values({
        packageId: params.packageId,
        price: params.price,
        effectiveFrom: now,
        effectiveTo: null,
        note: params.note,
        createdBy: params.adminId,
        createdAt: now,
    });
};

export const getPromotionPackages = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const allPackages = await db
            .select({
                promotionPackageId: promotionPackages.promotionPackageId,
                promotionPackageSlotId: promotionPackages.promotionPackageSlotId,
                promotionPackageTitle: promotionPackages.promotionPackageTitle,
                promotionPackageDurationDays: promotionPackages.promotionPackageDurationDays,
                promotionPackageMaxPosts: promotionPackages.promotionPackageMaxPosts,
                promotionPackageDisplayQuota: promotionPackages.promotionPackageDisplayQuota,
                promotionPackageDescription: promotionPackages.promotionPackageDescription,
                promotionPackagePublished: promotionPackages.promotionPackagePublished,
                promotionPackageCreatedAt: promotionPackages.promotionPackageCreatedAt,
                slotCode: placementSlots.placementSlotCode,
                slotTitle: placementSlots.placementSlotTitle,
            })
            .from(promotionPackages)
            .leftJoin(
                placementSlots,
                eq(
                    promotionPackages.promotionPackageSlotId,
                    placementSlots.placementSlotId,
                ),
            );

        const hydrated = await attachCurrentPrices(allPackages);
        res.json(hydrated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getPromotionPackageById = async (
    req: Request<PromotionPackageParams>,
    res: Response,
): Promise<void> => {
    try {
        const idNumber = parseId(req.params.id);

        if (idNumber === null) {
            res.status(400).json({ error: "Invalid promotion package id" });
            return;
        }

        const rows = await db
            .select({
                promotionPackageId: promotionPackages.promotionPackageId,
                promotionPackageSlotId: promotionPackages.promotionPackageSlotId,
                promotionPackageTitle: promotionPackages.promotionPackageTitle,
                promotionPackageDurationDays: promotionPackages.promotionPackageDurationDays,
                promotionPackageMaxPosts: promotionPackages.promotionPackageMaxPosts,
                promotionPackageDisplayQuota: promotionPackages.promotionPackageDisplayQuota,
                promotionPackageDescription: promotionPackages.promotionPackageDescription,
                promotionPackagePublished: promotionPackages.promotionPackagePublished,
                promotionPackageCreatedAt: promotionPackages.promotionPackageCreatedAt,
                slotCode: placementSlots.placementSlotCode,
                slotTitle: placementSlots.placementSlotTitle,
            })
            .from(promotionPackages)
            .leftJoin(
                placementSlots,
                eq(
                    promotionPackages.promotionPackageSlotId,
                    placementSlots.placementSlotId,
                ),
            )
            .where(eq(promotionPackages.promotionPackageId, idNumber))
            .limit(1);

        const [pkg] = await attachCurrentPrices(rows);
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
    req: AuthRequest,
    res: Response,
): Promise<void> => {
    try {
        const {
            promotionPackageSlotId,
            promotionPackageTitle,
            promotionPackageDurationDays,
            promotionPackageMaxPosts,
            promotionPackageDisplayQuota,
            promotionPackageDescription,
            promotionPackagePublished,
        } = req.body as Record<string, unknown>;
        const rawPrice = (req.body as Record<string, unknown>).promotionPackagePrice;

        const slotId = parsePositiveInteger(promotionPackageSlotId);
        const durationDays = parsePositiveInteger(promotionPackageDurationDays);
        const parsedPrice = parsePrice(rawPrice);

        if (!slotId || !promotionPackageTitle || !durationDays || !parsedPrice) {
            res.status(400).json({
                error: "slotId, title, durationDays, and price are required",
            });
            return;
        }

        const maxPosts = parseNonNegativeInteger(promotionPackageMaxPosts, 1);
        const displayQuota = parseNonNegativeInteger(promotionPackageDisplayQuota, 1);
        if (maxPosts < 1 || displayQuota < 1) {
            res.status(400).json({
                error: "maxPosts and displayQuota must be at least 1 when provided",
            });
            return;
        }

        const [slot] = await db
            .select()
            .from(placementSlots)
            .where(eq(placementSlots.placementSlotId, slotId))
            .limit(1);

        if (!slot) {
            res.status(400).json({ error: "Placement slot not found" });
            return;
        }

        const [newPkg] = await db
            .insert(promotionPackages)
            .values({
                promotionPackageSlotId: slotId,
                promotionPackageTitle: String(promotionPackageTitle),
                promotionPackageDurationDays: durationDays,
                promotionPackageMaxPosts: maxPosts,
                promotionPackageDisplayQuota: displayQuota,
                promotionPackageDescription:
                    typeof promotionPackageDescription === "string"
                        ? promotionPackageDescription
                        : null,
                promotionPackagePublished: Boolean(promotionPackagePublished),
            })
            .returning();

        await setCurrentPackagePrice({
            packageId: newPkg.promotionPackageId,
            price: parsedPrice,
            adminId: req.user?.id ?? null,
            note: "Initial package price",
        });

        const [created] = await attachCurrentPrices([
            {
                promotionPackageId: newPkg.promotionPackageId,
                promotionPackageSlotId: newPkg.promotionPackageSlotId,
                promotionPackageTitle: newPkg.promotionPackageTitle,
                promotionPackageDurationDays: newPkg.promotionPackageDurationDays,
                promotionPackageMaxPosts: newPkg.promotionPackageMaxPosts,
                promotionPackageDisplayQuota: newPkg.promotionPackageDisplayQuota,
                promotionPackageDescription: newPkg.promotionPackageDescription,
                promotionPackagePublished: newPkg.promotionPackagePublished,
                promotionPackageCreatedAt: newPkg.promotionPackageCreatedAt,
                slotCode: slot.placementSlotCode,
                slotTitle: slot.placementSlotTitle,
            },
        ]);

        res.status(201).json(created);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const updatePromotionPackage = async (
    req: AuthRequest & Request<PromotionPackageParams, {}, Record<string, unknown>>,
    res: Response,
): Promise<void> => {
    try {
        const idNumber = parseId(req.params.id);

        if (idNumber === null) {
            res.status(400).json({ error: "Invalid promotion package id" });
            return;
        }

        const body = req.body as Record<string, unknown>;
        const hasPriceInput = Object.prototype.hasOwnProperty.call(
            body,
            "promotionPackagePrice",
        );
        const parsedPrice = hasPriceInput
            ? parsePrice(body.promotionPackagePrice)
            : null;

        if (hasPriceInput && !parsedPrice) {
            res.status(400).json({ error: "promotionPackagePrice must be > 0" });
            return;
        }

        const updatePayload: Record<string, unknown> = {};

        if (Object.prototype.hasOwnProperty.call(body, "promotionPackageSlotId")) {
            const nextSlotId = parsePositiveInteger(body.promotionPackageSlotId);
            if (!nextSlotId) {
                res.status(400).json({ error: "Invalid placement slot id" });
                return;
            }

            const [slot] = await db
                .select()
                .from(placementSlots)
                .where(eq(placementSlots.placementSlotId, nextSlotId))
                .limit(1);

            if (!slot) {
                res.status(400).json({ error: "Placement slot not found" });
                return;
            }

            updatePayload.promotionPackageSlotId = nextSlotId;
        }

        if (Object.prototype.hasOwnProperty.call(body, "promotionPackageTitle")) {
            updatePayload.promotionPackageTitle =
                body.promotionPackageTitle === null
                    ? null
                    : String(body.promotionPackageTitle);
        }

        if (Object.prototype.hasOwnProperty.call(body, "promotionPackageDurationDays")) {
            const parsedDuration = parsePositiveInteger(
                body.promotionPackageDurationDays,
            );
            if (!parsedDuration) {
                res.status(400).json({ error: "promotionPackageDurationDays must be > 0" });
                return;
            }
            updatePayload.promotionPackageDurationDays = parsedDuration;
        }

        if (Object.prototype.hasOwnProperty.call(body, "promotionPackageMaxPosts")) {
            const parsedMaxPosts = parseNonNegativeInteger(
                body.promotionPackageMaxPosts,
                -1,
            );
            if (parsedMaxPosts < 1) {
                res.status(400).json({
                    error: "promotionPackageMaxPosts must be at least 1",
                });
                return;
            }
            updatePayload.promotionPackageMaxPosts = parsedMaxPosts;
        }

        if (
            Object.prototype.hasOwnProperty.call(body, "promotionPackageDisplayQuota")
        ) {
            const parsedDisplayQuota = parseNonNegativeInteger(
                body.promotionPackageDisplayQuota,
                -1,
            );
            if (parsedDisplayQuota < 1) {
                res.status(400).json({
                    error: "promotionPackageDisplayQuota must be at least 1",
                });
                return;
            }
            updatePayload.promotionPackageDisplayQuota = parsedDisplayQuota;
        }

        if (
            Object.prototype.hasOwnProperty.call(body, "promotionPackageDescription")
        ) {
            updatePayload.promotionPackageDescription =
                body.promotionPackageDescription === null
                    ? null
                    : String(body.promotionPackageDescription);
        }

        if (
            Object.prototype.hasOwnProperty.call(body, "promotionPackagePublished")
        ) {
            updatePayload.promotionPackagePublished = Boolean(
                body.promotionPackagePublished,
            );
        }

        if (Object.keys(updatePayload).length === 0 && !hasPriceInput) {
            res.status(400).json({
                error: "No valid fields to update",
            });
            return;
        }

        const [updatedPkg] = Object.keys(updatePayload).length
            ? await db
                  .update(promotionPackages)
                  .set(updatePayload)
                  .where(eq(promotionPackages.promotionPackageId, idNumber))
                  .returning()
            : await db
                  .select()
                  .from(promotionPackages)
                  .where(eq(promotionPackages.promotionPackageId, idNumber))
                  .limit(1);

        if (!updatedPkg) {
            res.status(404).json({ error: "Promotion package not found" });
            return;
        }

        if (hasPriceInput && parsedPrice) {
            await setCurrentPackagePrice({
                packageId: idNumber,
                price: parsedPrice,
                adminId: req.user?.id ?? null,
                note: "Price updated via admin package API",
            });
        }

        const [slot] = await db
            .select({
                slotCode: placementSlots.placementSlotCode,
                slotTitle: placementSlots.placementSlotTitle,
            })
            .from(placementSlots)
            .where(eq(placementSlots.placementSlotId, updatedPkg.promotionPackageSlotId))
            .limit(1);

        const [hydrated] = await attachCurrentPrices([
            {
                promotionPackageId: updatedPkg.promotionPackageId,
                promotionPackageSlotId: updatedPkg.promotionPackageSlotId,
                promotionPackageTitle: updatedPkg.promotionPackageTitle,
                promotionPackageDurationDays: updatedPkg.promotionPackageDurationDays,
                promotionPackageMaxPosts: updatedPkg.promotionPackageMaxPosts,
                promotionPackageDisplayQuota: updatedPkg.promotionPackageDisplayQuota,
                promotionPackageDescription: updatedPkg.promotionPackageDescription,
                promotionPackagePublished: updatedPkg.promotionPackagePublished,
                promotionPackageCreatedAt: updatedPkg.promotionPackageCreatedAt,
                slotCode: slot?.slotCode ?? null,
                slotTitle: slot?.slotTitle ?? null,
            },
        ]);

        res.json(hydrated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const deletePromotionPackage = async (
    req: Request<PromotionPackageParams>,
    res: Response,
): Promise<void> => {
    try {
        const idNumber = parseId(req.params.id);

        if (idNumber === null) {
            res.status(400).json({ error: "Invalid promotion package id" });
            return;
        }

        const linkedPromotions = await db
            .select()
            .from(postPromotions)
            .where(eq(postPromotions.postPromotionPackageId, idNumber))
            .limit(1);

        if (linkedPromotions.length > 0) {
            res.status(400).json({
                error: "Cannot delete package that has active promotions linked to it",
            });
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
