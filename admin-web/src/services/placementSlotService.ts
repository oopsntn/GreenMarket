import { apiClient } from "../lib/apiClient";
import {
  isHomepageBoostSlotCode,
  isStrictHomepageBoostSlotCode,
} from "../types/placementSlot";
import type {
  PlacementSlot,
  PlacementSlotApiResponse,
  PlacementSlotFormState,
  PlacementSlotStatus,
  PlacementSlotSummaryCard,
} from "../types/placementSlot";

const SLOT_LABELS: Record<string, string> = {
  "Home Top": "Vị trí 1 trang chủ",
  "Category Top": "Vị trí 2 trang chủ",
  "Search Boost": "Vị trí 3 trang chủ",
};

const FIXED_CAPACITY = 1;
const MAX_INTEGER_FIELD = 2_147_483_647;

const emptyPlacementSlotForm: PlacementSlotFormState = {
  name: "",
  scope: "Homepage",
  positionCode: "",
  capacity: FIXED_CAPACITY,
  displayRule: "Priority Score",
  priority: 1,
  notes: "",
};

const normalizeText = (value: string) => value.trim();
const translateSlotLabel = (value: string | null | undefined) =>
  SLOT_LABELS[value?.trim() || ""] || value?.trim() || "";

const sortPlacementSlots = (slots: PlacementSlot[]) =>
  [...slots].sort((left, right) => {
    if (left.priority !== right.priority) {
      return left.priority - right.priority;
    }

    return left.id - right.id;
  });

const getUsedPriorities = (
  slots: PlacementSlot[],
  excludeId?: number,
): Set<number> =>
  new Set(
    slots
      .filter((slot) => (excludeId !== undefined ? slot.id !== excludeId : true))
      .map((slot) => slot.priority)
      .filter((priority) => Number.isFinite(priority) && priority >= 1),
  );

const validateSlotForm = (
  formData: PlacementSlotFormState,
  existingSlots: PlacementSlot[],
  excludeId?: number,
) => {
  const normalizedName = normalizeText(formData.name);
  const normalizedCode = normalizeText(formData.positionCode).toLowerCase();

  if (!normalizedName) {
    throw new Error("Tên vị trí là bắt buộc.");
  }

  if (!normalizedCode) {
    throw new Error("Mã vị trí là bắt buộc.");
  }

  if (!isStrictHomepageBoostSlotCode(normalizedCode)) {
    throw new Error(
      "Mã vị trí phải theo đúng định dạng BOOST_POST hoặc BOOST_POST_<số>.",
    );
  }

  if (formData.capacity !== FIXED_CAPACITY) {
    throw new Error("Sức chứa của vị trí hiển thị được cố định là 1.");
  }

  if (!Number.isFinite(formData.priority) || formData.priority < 1) {
    throw new Error("Thứ tự hiển thị phải lớn hơn hoặc bằng 1.");
  }

  if (!Number.isInteger(formData.priority)) {
    throw new Error("Thứ tự hiển thị phải là số nguyên.");
  }

  if (formData.priority > MAX_INTEGER_FIELD) {
    throw new Error(
      "Thứ tự hiển thị không được vượt quá 2.147.483.647.",
    );
  }

  const usedPriorities = getUsedPriorities(existingSlots, excludeId);
  if (usedPriorities.has(formData.priority)) {
    throw new Error(
      "Thứ tự hiển thị này đã được sử dụng. Vui lòng chọn thứ tự khác.",
    );
  }

  const isDuplicatedName = existingSlots.some((slot) => {
    if (excludeId !== undefined && slot.id === excludeId) return false;
    return slot.name.trim().toLowerCase() === normalizedName.toLowerCase();
  });

  if (isDuplicatedName) {
    throw new Error("Tên vị trí đã tồn tại. Vui lòng nhập tên khác.");
  }

  const isDuplicatedCode = existingSlots.some((slot) => {
    if (excludeId !== undefined && slot.id === excludeId) return false;
    return slot.positionCode.trim().toLowerCase() === normalizedCode;
  });

  if (isDuplicatedCode) {
    throw new Error("Mã vị trí đã tồn tại. Vui lòng nhập mã khác.");
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
        : ("Priority Score" as PlacementSlot["displayRule"]),
    priority:
      typeof rules?.priority === "number" && Number.isFinite(rules.priority)
        ? rules.priority
        : 1,
    notes: typeof rules?.notes === "string" ? rules.notes : "",
  };
};

const mapApiSlotToUi = (item: PlacementSlotApiResponse): PlacementSlot => {
  const title =
    translateSlotLabel(item.placementSlotTitle?.trim()) ||
    "Vị trí chưa đặt tên";
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
    capacity: item.placementSlotCapacity ?? FIXED_CAPACITY,
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
    placementSlotCapacity: FIXED_CAPACITY,
    placementSlotPublished: published,
    placementSlotRules: {
      scope: "Homepage",
      displayRule: "Priority Score",
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
        defaultErrorMessage: "Không thể tải danh sách vị trí hiển thị.",
      },
    );

    return sortPlacementSlots(
      data
        .map(mapApiSlotToUi)
        .filter((slot) => isHomepageBoostSlotCode(slot.positionCode)),
    );
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
        title: "Tổng vị trí",
        value: String(slots.length),
        subtitle: "Tất cả vị trí hiển thị đã cấu hình",
      },
      {
        title: "Vị trí đang hoạt động",
        value: String(activeCount),
        subtitle: "Đang sẵn sàng cho chiến dịch quảng bá",
      },
      {
        title: "Vị trí tạm ngưng",
        value: String(disabledCount),
        subtitle: "Tạm thời chưa cho phép sử dụng",
      },
      {
        title: "Tổng sức chứa",
        value: String(totalCapacity),
        subtitle: "Mỗi vị trí hiển thị cố định một bài cùng thời điểm",
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
        defaultErrorMessage: "Không thể tạo vị trí hiển thị.",
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
        defaultErrorMessage: "Không thể cập nhật vị trí hiển thị.",
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
        defaultErrorMessage: "Không thể cập nhật trạng thái vị trí hiển thị.",
        body: JSON.stringify(
          buildSlotPayload(
            {
              name: currentSlot.name,
              scope: currentSlot.scope,
              positionCode: currentSlot.positionCode,
              capacity: FIXED_CAPACITY,
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
