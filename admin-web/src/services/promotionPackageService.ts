import { apiClient } from "../lib/apiClient";
import type { PlacementSlotApiResponse } from "../types/placementSlot";
import { isHomepageBoostSlotCode } from "../types/placementSlot";
import type {
  PromotionPackage,
  PromotionPackageApiResponse,
  PromotionPackageFormState,
  PromotionPackageSlotOption,
  PromotionPackageStatus,
  PromotionPackageSummaryCard,
} from "../types/promotionPackage";

const emptyPromotionPackageForm: PromotionPackageFormState = {
  name: "",
  slot: "",
  durationDays: 7,
  price: "",
  maxPosts: 1,
  displayQuota: 1000,
  description: "",
};

const SLOT_LABELS: Record<string, string> = {
  "Home Top": "Vị trí 1 trang chủ",
  "Category Top": "Vị trí 2 trang chủ",
  "Search Boost": "Vị trí 3 trang chủ",
};

const normalizeText = (value: string) => value.trim();

const parseCurrencyValue = (value: string) => {
  const numeric = Number(value.replace(/[^\d]/g, ""));
  return Number.isNaN(numeric) ? 0 : numeric;
};

const formatCurrencyLabel = (value: string | number | null) => {
  const numeric = Number(value ?? 0);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "0 VND";
  }

  return `${numeric.toLocaleString("vi-VN")} VND`;
};

const translateSlotLabel = (value: string | null | undefined) =>
  SLOT_LABELS[value?.trim() || ""] || value?.trim() || "";

const mapSlotToUi = (
  slotCode: string | null,
  slotTitle: string | null,
): PromotionPackage["slot"] => {
  const normalizedTitle = translateSlotLabel(slotTitle);
  if (normalizedTitle) return normalizedTitle;

  const normalizedCode = translateSlotLabel(slotCode);
  if (normalizedCode) return normalizedCode;

  return "Vị trí chưa đặt tên";
};

const mapApiPackageToUi = (
  item: PromotionPackageApiResponse,
): PromotionPackage => {
  return {
    id: item.promotionPackageId,
    name: item.promotionPackageTitle?.trim() || "Gói chưa đặt tên",
    slot: mapSlotToUi(item.slotCode ?? null, item.slotTitle ?? null),
    slotCode: item.slotCode?.trim() || "",
    durationDays: item.promotionPackageDurationDays ?? 1,
    price: formatCurrencyLabel(item.promotionPackagePrice),
    maxPosts: item.promotionPackageMaxPosts ?? 1,
    displayQuota: item.promotionPackageDisplayQuota ?? 1,
    status: item.promotionPackagePublished ? "Active" : "Disabled",
    description: item.promotionPackageDescription?.trim() || "",
  };
};

const validatePromotionPackageForm = (
  formData: PromotionPackageFormState,
  existingPackages: PromotionPackage[],
  excludeId?: number,
) => {
  if (!normalizeText(formData.name)) {
    throw new Error("Tên gói là bắt buộc.");
  }

  if (!normalizeText(formData.price)) {
    throw new Error("Giá gói là bắt buộc.");
  }

  if (!Number.isFinite(formData.durationDays) || formData.durationDays < 1) {
    throw new Error("Thời lượng phải lớn hơn hoặc bằng 1 ngày.");
  }

  if (!Number.isFinite(formData.maxPosts) || formData.maxPosts < 1) {
    throw new Error("Số bài đăng tối đa phải lớn hơn hoặc bằng 1.");
  }

  if (!Number.isFinite(formData.displayQuota) || formData.displayQuota < 1) {
    throw new Error("Quota hiển thị phải lớn hơn hoặc bằng 1.");
  }

  if (parseCurrencyValue(formData.price) <= 0) {
    throw new Error("Giá gói phải lớn hơn 0.");
  }

  const normalizedName = normalizeText(formData.name).toLowerCase();

  const isDuplicateName = existingPackages.some((item) => {
    if (excludeId !== undefined && item.id === excludeId) return false;
    return item.name.toLowerCase() === normalizedName;
  });

  if (isDuplicateName) {
    throw new Error("Tên gói đã tồn tại. Vui lòng nhập tên khác.");
  }
};

const buildPackagePayload = (
  formData: PromotionPackageFormState,
  slotId: number,
  published: boolean,
) => ({
  promotionPackageSlotId: slotId,
  promotionPackageTitle: normalizeText(formData.name),
  promotionPackageDurationDays: formData.durationDays,
  promotionPackagePrice: String(parseCurrencyValue(formData.price)),
  promotionPackageMaxPosts: formData.maxPosts,
  promotionPackageDisplayQuota: formData.displayQuota,
  promotionPackageDescription: normalizeText(formData.description),
  promotionPackagePublished: published,
});

export const promotionPackageService = {
  getSlotOptions(slotResponses: PlacementSlotApiResponse[]) {
    return slotResponses
      .map((item) => ({
        id: item.placementSlotId,
        code: item.placementSlotCode?.trim() || "",
        label: mapSlotToUi(
          item.placementSlotCode ?? null,
          item.placementSlotTitle ?? null,
        ),
      }))
      .filter((item) => isHomepageBoostSlotCode(item.code));
  },

  async getPromotionPackages(): Promise<PromotionPackage[]> {
    const data = await apiClient.request<PromotionPackageApiResponse[]>(
      "/api/admin/promotion-packages",
      {
        defaultErrorMessage: "Không thể tải danh sách gói quảng bá.",
      },
    );

    return data
      .map(mapApiPackageToUi)
      .filter((item) => isHomepageBoostSlotCode(item.slotCode));
  },

  getActivePromotionPackages(packages: PromotionPackage[]) {
    return packages.filter((item) => item.status === "Active");
  },

  getEmptyForm(): PromotionPackageFormState {
    return { ...emptyPromotionPackageForm };
  },

  getSummaryCards(packages: PromotionPackage[]): PromotionPackageSummaryCard[] {
    const activeCount = packages.filter(
      (item) => item.status === "Active",
    ).length;
    const disabledCount = packages.filter(
      (item) => item.status === "Disabled",
    ).length;
    const highestPrice =
      packages.length === 0
        ? 0
        : Math.max(...packages.map((item) => parseCurrencyValue(item.price)));
    const totalQuota = packages.reduce(
      (sum, item) => sum + item.displayQuota,
      0,
    );

    return [
      {
        title: "Tổng gói quảng bá",
        value: String(packages.length),
        subtitle: "Tất cả gói quảng bá đã cấu hình",
      },
      {
        title: "Gói đang mở bán",
        value: String(activeCount),
        subtitle: "Đang sẵn sàng bán cho khách hàng",
      },
      {
        title: "Gói tạm ngưng",
        value: String(disabledCount),
        subtitle: "Tạm thời ẩn khỏi danh sách bán",
      },
      {
        title: "Giá cao nhất",
        value: formatCurrencyLabel(highestPrice),
        subtitle: "Mức giá cao nhất trong các gói hiện có",
      },
      {
        title: "Tổng quota",
        value: totalQuota.toLocaleString("en-US"),
        subtitle: "Tổng lượng hiển thị của tất cả gói đã cấu hình",
      },
    ];
  },

  async createPromotionPackage(
    packages: PromotionPackage[],
    slotOptions: PromotionPackageSlotOption[],
    formData: PromotionPackageFormState,
  ): Promise<PromotionPackage[]> {
    validatePromotionPackageForm(formData, packages);
    const targetSlot = slotOptions.find((item) => item.label === formData.slot);

    if (!targetSlot) {
      throw new Error("Không tìm thấy vị trí hiển thị đã chọn.");
    }

    const data = await apiClient.request<PromotionPackageApiResponse>(
      "/api/admin/promotion-packages",
      {
        method: "POST",
        includeJsonContentType: true,
        defaultErrorMessage: "Không thể tạo gói quảng bá.",
        body: JSON.stringify(buildPackagePayload(formData, targetSlot.id, true)),
      },
    );

    return [
      mapApiPackageToUi({
        ...data,
        slotCode: targetSlot.code,
      }),
      ...packages,
    ];
  },

  async updatePromotionPackage(
    packages: PromotionPackage[],
    slotOptions: PromotionPackageSlotOption[],
    packageId: number,
    formData: PromotionPackageFormState,
  ): Promise<PromotionPackage[]> {
    validatePromotionPackageForm(formData, packages, packageId);
    const currentPackage = packages.find((item) => item.id === packageId);
    const targetSlot = slotOptions.find((item) => item.label === formData.slot);

    if (!targetSlot) {
      throw new Error("Không tìm thấy vị trí hiển thị đã chọn.");
    }

    const data = await apiClient.request<PromotionPackageApiResponse>(
      `/api/admin/promotion-packages/${packageId}`,
      {
        method: "PUT",
        includeJsonContentType: true,
        defaultErrorMessage: "Không thể cập nhật gói quảng bá.",
        body: JSON.stringify(
          buildPackagePayload(
            formData,
            targetSlot.id,
            currentPackage?.status !== "Disabled",
          ),
        ),
      },
    );

    return packages.map((item) =>
      item.id === packageId
        ? mapApiPackageToUi({ ...data, slotCode: targetSlot.code })
        : item,
    );
  },

  async updatePromotionPackageStatus(
    packages: PromotionPackage[],
    slotOptions: PromotionPackageSlotOption[],
    packageId: number,
    status: PromotionPackageStatus,
  ): Promise<PromotionPackage[]> {
    const currentPackage = packages.find((item) => item.id === packageId);

    if (!currentPackage) {
      return packages;
    }

    const targetSlot = slotOptions.find(
      (item) => item.label === currentPackage.slot,
    );

    if (!targetSlot) {
      throw new Error("Không tìm thấy vị trí hiển thị đã chọn.");
    }

    const data = await apiClient.request<PromotionPackageApiResponse>(
      `/api/admin/promotion-packages/${packageId}`,
      {
        method: "PUT",
        includeJsonContentType: true,
        defaultErrorMessage: "Không thể cập nhật trạng thái gói quảng bá.",
        body: JSON.stringify(
          buildPackagePayload(
            {
              name: currentPackage.name,
              slot: currentPackage.slot,
              durationDays: currentPackage.durationDays,
              price: currentPackage.price,
              maxPosts: currentPackage.maxPosts,
              displayQuota: currentPackage.displayQuota,
              description: currentPackage.description,
            },
            targetSlot.id,
            status === "Active",
          ),
        ),
      },
    );

    return packages.map((item) =>
      item.id === packageId
        ? mapApiPackageToUi({ ...data, slotCode: targetSlot.code })
        : item,
    );
  },
};
