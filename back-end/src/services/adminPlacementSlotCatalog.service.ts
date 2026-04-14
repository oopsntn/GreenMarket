import { db } from "../config/db.ts";
import { placementSlots } from "../models/schema/index.ts";

export type AdminPlacementSlotLabel = string;

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
    const normalizedTitle = slotTitle?.trim();
    if (normalizedTitle) {
        return normalizedTitle;
    }

    const normalizedCode = slotCode?.trim();
    if (normalizedCode) {
        return normalizedCode;
    }

    return "Vị trí chưa đặt tên";
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
    const scopeOrder: Record<AdminPlacementSlotScope, number> = {
        Homepage: 0,
        Category: 1,
        Search: 2,
    };

    return [...items].sort((left, right) => {
        if (scopeOrder[left.scope] !== scopeOrder[right.scope]) {
            return scopeOrder[left.scope] - scopeOrder[right.scope];
        }

        if (left.title !== right.title) {
            return left.title.localeCompare(right.title, "vi");
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
                title: item.placementSlotTitle?.trim() || "Vị trí chưa đặt tên",
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
