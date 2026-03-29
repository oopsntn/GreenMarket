import { Request, Response } from "express";
import { db } from "../../config/db";
import { eq } from "drizzle-orm";
import { placementSlots, type NewPlacementSlot } from "../../models/schema/placement-slots";
import { promotionPackages } from "../../models/schema/promotion-packages";
import { type PlacementSlotParams } from "../../dtos/promotion";
import { parseId } from "../../utils/parseId";

export const getPlacementSlots = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const allSlots = await db.select().from(placementSlots);
        res.json(allSlots);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getPlacementSlotById = async (
    req: Request<PlacementSlotParams>,
    res: Response
): Promise<void> => {
    try {
        const idNumber = parseId(req.params.id);

        if (idNumber === null) {
            res.status(400).json({ error: "Invalid placement slot id" });
            return;
        }

        const [slot] = await db
            .select()
            .from(placementSlots)
            .where(eq(placementSlots.placementSlotId, idNumber))
            .limit(1);

        if (!slot) {
            res.status(404).json({ error: "Placement slot not found" });
            return;
        }

        res.json(slot);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const createPlacementSlot = async (
    req: Request<{}, {}, NewPlacementSlot>,
    res: Response
): Promise<void> => {
    try {
        const { placementSlotCode, placementSlotTitle } = req.body;

        if (!placementSlotCode || !placementSlotTitle) {
            res.status(400).json({ error: "placementSlotCode and placementSlotTitle are required" });
            return;
        }

        const [newSlot] = await db
            .insert(placementSlots)
            .values({
                ...req.body,
                placementSlotPublished: req.body.placementSlotPublished ?? false,
            })
            .returning();

        res.status(201).json(newSlot);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const updatePlacementSlot = async (
    req: Request<PlacementSlotParams, {}, Partial<NewPlacementSlot>>,
    res: Response
): Promise<void> => {
    try {
        const idNumber = parseId(req.params.id);

        if (idNumber === null) {
            res.status(400).json({ error: "Invalid placement slot id" });
            return;
        }

        const [updatedSlot] = await db
            .update(placementSlots)
            .set(req.body)
            .where(eq(placementSlots.placementSlotId, idNumber))
            .returning();

        if (!updatedSlot) {
            res.status(404).json({ error: "Placement slot not found" });
            return;
        }

        res.json(updatedSlot);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const deletePlacementSlot = async (
    req: Request<PlacementSlotParams>,
    res: Response
): Promise<void> => {
    try {
        const idNumber = parseId(req.params.id);

        if (idNumber === null) {
            res.status(400).json({ error: "Invalid placement slot id" });
            return;
        }

        const [slot] = await db
            .delete(placementSlots)
            .where(eq(placementSlots.placementSlotId, idNumber))
            .returning();

        if (!slot) {
            res.status(404).json({ error: "Placement slot not found" });
            return;
        }

        res.json({
            message: "Placement slot deleted successfully",
            slot,
        });
    } catch (error) {
        console.error(error);
        if ((error as any).code === "23503") {
            res.status(400).json({ error: "Cannot delete slot that has promotion packages linked to it" });
            return;
        }
        res.status(500).json({ error: "Internal server error" });
    }
};
