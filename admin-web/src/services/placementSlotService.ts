import { apiClient } from "../lib/apiClient";
import type {
  PlacementSlot,
  PlacementSlotApiResponse,
  PlacementSlotFormState,
  PlacementSlotStatus,
  PlacementSlotSummaryCard,
} from "../types/placementSlot";

const emptyPlacementSlotForm: PlacementSlotFormState = {
  name: "",
  scope: "Homepage",
  positionCode: "",
  capacity: 1,
  displayRule: "Round Robin",
  priority: 1,
  notes: "",
};

const normalizeText = (value: string) => value.trim();

const sortPlacementSlots = (slots: PlacementSlot[]) =>
  [...slots].sort((left, right) => left.id - right.id);

const validateSlotForm = (
  formData: PlacementSlotFormState,
  existingSlots: PlacementSlot[],
  excludeId?: number,
) => {
  const normalizedName = normalizeText(formData.name);
  const normalizedCode = normalizeText(formData.positionCode).toLowerCase();

  if (!normalizedName) {
    throw new Error("Slot name is required.");
  }

  if (!normalizedCode) {
    throw new Error("Position code is required.");
  }

  if (!Number.isFinite(formData.capacity) || formData.capacity < 1) {
    throw new Error("Capacity must be at least 1.");
  }

  if (!Number.isFinite(formData.priority) || formData.priority < 1) {
    throw new Error("Priority must be at least 1.");
  }

  const isDuplicatedName = existingSlots.some((slot) => {
    if (excludeId !== undefined && slot.id === excludeId) return false;
    return slot.name.trim().toLowerCase() === normalizedName.toLowerCase();
  });

  if (isDuplicatedName) {
    throw new Error("Slot name already exists. Please use a unique slot name.");
  }

  const isDuplicatedCode = existingSlots.some((slot) => {
    if (excludeId !== undefined && slot.id === excludeId) return false;
    return slot.positionCode.trim().toLowerCase() === normalizedCode;
  });

  if (isDuplicatedCode) {
    throw new Error("Position code already exists. Please use a unique code.");
  }
};

const inferScopeFromSlot = (
  code: string,
  title: string,
): PlacementSlot["scope"] => {
  const normalized = `${code} ${title}`.toLowerCase();

  if (normalized.includes("search")) return "Search";
  if (normalized.includes("category")) return "Category";
  return "Homepage";
};

const mapRulesToUi = (rules: Record<string, unknown> | null) => {
  return {
    scope:
      rules?.scope === "Category" || rules?.scope === "Search"
        ? (rules.scope as PlacementSlot["scope"])
        : ("Homepage" as PlacementSlot["scope"]),
    displayRule:
      rules?.displayRule === "First Purchased First Served" ||
      rules?.displayRule === "Random" ||
      rules?.displayRule === "Priority Score"
        ? (rules.displayRule as PlacementSlot["displayRule"])
        : ("Round Robin" as PlacementSlot["displayRule"]),
    priority:
      typeof rules?.priority === "number" && Number.isFinite(rules.priority)
        ? rules.priority
        : 1,
    notes: typeof rules?.notes === "string" ? rules.notes : "",
  };
};

const mapApiSlotToUi = (item: PlacementSlotApiResponse): PlacementSlot => {
  const title = item.placementSlotTitle?.trim() || "Untitled Slot";
  const code = item.placementSlotCode?.trim() || "";
  const mappedRules = mapRulesToUi(item.placementSlotRules);
  const inferredScope = inferScopeFromSlot(code, title);

  return {
    id: item.placementSlotId,
    name: title,
    scope:
      mappedRules.scope === "Homepage" && inferredScope !== "Homepage"
        ? inferredScope
        : mappedRules.scope,
    positionCode: code,
    capacity: item.placementSlotCapacity ?? 1,
    displayRule: mappedRules.displayRule,
    priority: mappedRules.priority,
    status: item.placementSlotPublished ? "Active" : "Disabled",
    notes: mappedRules.notes,
  };
};

const buildSlotPayload = (
  formData: PlacementSlotFormState,
  published: boolean,
) => {
  return {
    placementSlotCode: normalizeText(formData.positionCode),
    placementSlotTitle: normalizeText(formData.name),
    placementSlotCapacity: formData.capacity,
    placementSlotPublished: published,
    placementSlotRules: {
      scope: formData.scope,
      displayRule: formData.displayRule,
      priority: formData.priority,
      notes: normalizeText(formData.notes),
    },
  };
};

export const placementSlotService = {
  async getPlacementSlots(): Promise<PlacementSlot[]> {
    const data = await apiClient.request<PlacementSlotApiResponse[]>(
      "/api/admin/placement-slots",
      {
        defaultErrorMessage: "Unable to load placement slots.",
      },
    );

    return sortPlacementSlots(data.map(mapApiSlotToUi));
  },

  getEmptyForm(): PlacementSlotFormState {
    return { ...emptyPlacementSlotForm };
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

  async createPlacementSlot(
    slots: PlacementSlot[],
    formData: PlacementSlotFormState,
  ): Promise<PlacementSlot[]> {
    validateSlotForm(formData, slots);

    const data = await apiClient.request<PlacementSlotApiResponse>(
      "/api/admin/placement-slots",
      {
        method: "POST",
        includeJsonContentType: true,
        defaultErrorMessage: "Unable to create placement slot.",
        body: JSON.stringify(buildSlotPayload(formData, true)),
      },
    );

    return sortPlacementSlots([...slots, mapApiSlotToUi(data)]);
  },

  async updatePlacementSlot(
    slots: PlacementSlot[],
    slotId: number,
    formData: PlacementSlotFormState,
  ): Promise<PlacementSlot[]> {
    validateSlotForm(formData, slots, slotId);

    const currentSlot = slots.find((slot) => slot.id === slotId);

    const data = await apiClient.request<PlacementSlotApiResponse>(
      `/api/admin/placement-slots/${slotId}`,
      {
        method: "PUT",
        includeJsonContentType: true,
        defaultErrorMessage: "Unable to update placement slot.",
        body: JSON.stringify(
          buildSlotPayload(formData, currentSlot?.status !== "Disabled"),
        ),
      },
    );

    return sortPlacementSlots(
      slots.map((slot) => (slot.id === slotId ? mapApiSlotToUi(data) : slot)),
    );
  },

  async updatePlacementSlotStatus(
    slots: PlacementSlot[],
    slotId: number,
    status: PlacementSlotStatus,
  ): Promise<PlacementSlot[]> {
    const currentSlot = slots.find((slot) => slot.id === slotId);

    if (!currentSlot) {
      return slots;
    }

    const data = await apiClient.request<PlacementSlotApiResponse>(
      `/api/admin/placement-slots/${slotId}`,
      {
        method: "PUT",
        includeJsonContentType: true,
        defaultErrorMessage: "Unable to update placement slot status.",
        body: JSON.stringify(
          buildSlotPayload(
            {
              name: currentSlot.name,
              scope: currentSlot.scope,
              positionCode: currentSlot.positionCode,
              capacity: currentSlot.capacity,
              displayRule: currentSlot.displayRule,
              priority: currentSlot.priority,
              notes: currentSlot.notes,
            },
            status === "Active",
          ),
        ),
      },
    );

    return sortPlacementSlots(
      slots.map((slot) => (slot.id === slotId ? mapApiSlotToUi(data) : slot)),
    );
  },
};
