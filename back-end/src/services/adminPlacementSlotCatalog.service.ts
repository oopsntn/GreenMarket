import { db } from "../config/db.ts";
import { placementSlots } from "../models/schema/index.ts";

export type AdminPlacementSlotLabel =
    | "Home Top"
    | "Category Top"
    | "Search Boost";

export type AdminPlacementSlotScope = "Homepage" | "Category" | "Search";

export type AdminPlacementSlotCatalogItem = {
    id: number;
    code: string;
    title: string;
    label: AdminPlacementSlotLabel;
    scope: AdminPlacementSlotScope;
    capacity: number;
    status: "Active" | "Disabled";
};

const normalizeSlotText = (slotCode: string | null, slotTitle: string | null) =>
    `${slotCode ?? ""} ${slotTitle ?? ""}`.toLowerCase();

export const mapPlacementSlotLabel = (
    slotCode: string | null,
    slotTitle: string | null,
): AdminPlacementSlotLabel => {
    const normalized = normalizeSlotText(slotCode, slotTitle);

    if (normalized.includes("search")) {
        return "Search Boost";
    }

    if (normalized.includes("category")) {
        return "Category Top";
    }

    return "Home Top";
};

export const mapPlacementSlotScope = (
    slotCode: string | null,
    slotTitle: string | null,
): AdminPlacementSlotScope => {
    const normalized = normalizeSlotText(slotCode, slotTitle);

    if (normalized.includes("search")) {
        return "Search";
    }

    if (normalized.includes("category")) {
        return "Category";
    }

    return "Homepage";
};

const sortCatalog = (items: AdminPlacementSlotCatalogItem[]) => {
    const slotOrder: Record<AdminPlacementSlotLabel, number> = {
        "Home Top": 0,
        "Category Top": 1,
        "Search Boost": 2,
    };

    return [...items].sort((left, right) => {
        if (slotOrder[left.label] !== slotOrder[right.label]) {
            return slotOrder[left.label] - slotOrder[right.label];
        }

        return left.id - right.id;
    });
};

export const adminPlacementSlotCatalogService = {
    async getCatalog(): Promise<AdminPlacementSlotCatalogItem[]> {
        const rows = await db.select().from(placementSlots);

        return sortCatalog(
            rows.map((item) => ({
                id: item.placementSlotId,
                code: item.placementSlotCode?.trim() || "",
                title: item.placementSlotTitle?.trim() || "Untitled Slot",
                label: mapPlacementSlotLabel(
                    item.placementSlotCode,
                    item.placementSlotTitle,
                ),
                scope: mapPlacementSlotScope(
                    item.placementSlotCode,
                    item.placementSlotTitle,
                ),
                capacity: item.placementSlotCapacity ?? 0,
                status: item.placementSlotPublished ? "Active" : "Disabled",
            })),
        );
    },
};
