import {
  emptyPlacementSlotForm,
  initialPlacementSlots,
} from "../mock-data/placementSlots";
import type {
  PlacementSlot,
  PlacementSlotFormState,
  PlacementSlotStatus,
  PlacementSlotSummaryCard,
} from "../types/placementSlot";

const getNextSlotId = (slots: PlacementSlot[]) => {
  if (slots.length === 0) return 1;
  return Math.max(...slots.map((slot) => slot.id)) + 1;
};

const normalizeText = (value: string) => value.trim();

const validateSlotForm = (
  formData: PlacementSlotFormState,
  existingSlots: PlacementSlot[],
  excludeId?: number,
) => {
  if (!normalizeText(formData.name)) {
    throw new Error("Slot name is required.");
  }

  if (!normalizeText(formData.positionCode)) {
    throw new Error("Position code is required.");
  }

  if (!Number.isFinite(formData.capacity) || formData.capacity < 1) {
    throw new Error("Capacity must be at least 1.");
  }

  if (!Number.isFinite(formData.priority) || formData.priority < 1) {
    throw new Error("Priority must be at least 1.");
  }

  const normalizedCode = normalizeText(formData.positionCode).toLowerCase();

  const isDuplicatedCode = existingSlots.some((slot) => {
    if (excludeId !== undefined && slot.id === excludeId) return false;
    return slot.positionCode.toLowerCase() === normalizedCode;
  });

  if (isDuplicatedCode) {
    throw new Error("Position code already exists. Please use a unique code.");
  }
};

export const placementSlotService = {
  getPlacementSlots(): PlacementSlot[] {
    return initialPlacementSlots;
  },

  getEmptyForm(): PlacementSlotFormState {
    return emptyPlacementSlotForm;
  },

  getSummaryCards(slots: PlacementSlot[]): PlacementSlotSummaryCard[] {
    const activeCount = slots.filter((slot) => slot.status === "Active").length;
    const disabledCount = slots.filter(
      (slot) => slot.status === "Disabled",
    ).length;
    const totalCapacity = slots.reduce((sum, slot) => sum + slot.capacity, 0);

    return [
      {
        title: "Total Slots",
        value: String(slots.length),
        subtitle: "All configured placement positions",
      },
      {
        title: "Active Slots",
        value: String(activeCount),
        subtitle: "Currently available for boosted posts",
      },
      {
        title: "Disabled Slots",
        value: String(disabledCount),
        subtitle: "Temporarily unavailable for campaigns",
      },
      {
        title: "Total Capacity",
        value: String(totalCapacity),
        subtitle: "Maximum concurrent boosted post placements",
      },
    ];
  },

  createPlacementSlot(
    slots: PlacementSlot[],
    formData: PlacementSlotFormState,
  ): PlacementSlot[] {
    validateSlotForm(formData, slots);

    const newSlot: PlacementSlot = {
      id: getNextSlotId(slots),
      name: normalizeText(formData.name),
      scope: formData.scope,
      positionCode: normalizeText(formData.positionCode),
      capacity: formData.capacity,
      displayRule: formData.displayRule,
      priority: formData.priority,
      status: "Active",
      notes: normalizeText(formData.notes),
    };

    return [newSlot, ...slots];
  },

  updatePlacementSlot(
    slots: PlacementSlot[],
    slotId: number,
    formData: PlacementSlotFormState,
  ): PlacementSlot[] {
    validateSlotForm(formData, slots, slotId);

    return slots.map((slot) =>
      slot.id === slotId
        ? {
            ...slot,
            name: normalizeText(formData.name),
            scope: formData.scope,
            positionCode: normalizeText(formData.positionCode),
            capacity: formData.capacity,
            displayRule: formData.displayRule,
            priority: formData.priority,
            notes: normalizeText(formData.notes),
          }
        : slot,
    );
  },

  updatePlacementSlotStatus(
    slots: PlacementSlot[],
    slotId: number,
    status: PlacementSlotStatus,
  ): PlacementSlot[] {
    return slots.map((slot) =>
      slot.id === slotId ? { ...slot, status } : slot,
    );
  },
};
