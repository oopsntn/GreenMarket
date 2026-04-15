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
    throw new Error("Tên vị trí là bắt buộc.");
  }

  if (!normalizedCode) {
    throw new Error("Mã vị trí là bắt buộc.");
  }

  if (!Number.isFinite(formData.capacity) || formData.capacity < 1) {
    throw new Error("Sức chứa phải lớn hơn hoặc bằng 1.");
  }

  if (!Number.isFinite(formData.priority) || formData.priority < 1) {
    throw new Error("Độ ưu tiên phải lớn hơn hoặc bằng 1.");
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
        : ("Round Robin" as PlacementSlot["displayRule"]),
    priority:
      typeof rules?.priority === "number" && Number.isFinite(rules.priority)
        ? rules.priority
        : 1,
    notes: typeof rules?.notes === "string" ? rules.notes : "",
  };
};

const mapApiSlotToUi = (item: PlacementSlotApiResponse): PlacementSlot => {
  const title = item.placementSlotTitle?.trim() || "Vị trí chưa đặt tên";
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
        defaultErrorMessage: "Không thể tải danh sách vị trí hiển thị.",
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
        subtitle: "Số lượng chiến dịch có thể hiển thị đồng thời",
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
