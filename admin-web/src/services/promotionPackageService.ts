import { emptyPromotionPackageForm } from "../mock-data/promotionPackages";
import { apiClient } from "../lib/apiClient";
import type { PlacementSlotApiResponse } from "../types/placementSlot";
import type {
  PromotionPackage,
  PromotionPackageApiResponse,
  PromotionPackageFormState,
  PromotionPackageStatus,
  PromotionPackageSummaryCard,
} from "../types/promotionPackage";

type PromotionPackageSlotOption = {
  id: number;
  code: string;
  label: PromotionPackage["slot"];
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

  return `${numeric.toLocaleString("en-US")} VND`;
};

const mapSlotToUi = (
  slotCode: string | null,
  slotTitle: string | null,
): PromotionPackage["slot"] => {
  const normalized = `${slotCode ?? ""} ${slotTitle ?? ""}`.toLowerCase();

  if (normalized.includes("search")) return "Search Boost";
  if (normalized.includes("category")) return "Category Top";
  return "Home Top";
};

const mapApiPackageToUi = (
  item: PromotionPackageApiResponse,
): PromotionPackage => {
  return {
    id: item.promotionPackageId,
    name: item.promotionPackageTitle?.trim() || "Untitled Package",
    slot: mapSlotToUi(item.slotCode ?? null, item.slotTitle ?? null),
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
    throw new Error("Package name is required.");
  }

  if (!normalizeText(formData.price)) {
    throw new Error("Package price is required.");
  }

  if (!Number.isFinite(formData.durationDays) || formData.durationDays < 1) {
    throw new Error("Duration must be at least 1 day.");
  }

  if (!Number.isFinite(formData.maxPosts) || formData.maxPosts < 1) {
    throw new Error("Max posts must be at least 1.");
  }

  if (!Number.isFinite(formData.displayQuota) || formData.displayQuota < 1) {
    throw new Error("Display quota must be at least 1.");
  }

  if (parseCurrencyValue(formData.price) <= 0) {
    throw new Error("Package price must be greater than 0.");
  }

  const normalizedName = normalizeText(formData.name).toLowerCase();

  const isDuplicateName = existingPackages.some((item) => {
    if (excludeId !== undefined && item.id === excludeId) return false;
    return item.name.toLowerCase() === normalizedName;
  });

  if (isDuplicateName) {
    throw new Error("Package name already exists. Please use a unique name.");
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
    return slotResponses.map((item) => ({
      id: item.placementSlotId,
      code: item.placementSlotCode?.trim() || "",
      label: mapSlotToUi(item.placementSlotCode ?? null, item.placementSlotTitle ?? null),
    }));
  },

  async getPromotionPackages(): Promise<PromotionPackage[]> {
    const data = await apiClient.request<PromotionPackageApiResponse[]>(
      "/api/admin/promotion-packages",
      {
        defaultErrorMessage: "Unable to load promotion packages.",
      },
    );

    return data.map(mapApiPackageToUi);
  },

  getActivePromotionPackages(packages: PromotionPackage[]) {
    return packages.filter((item) => item.status === "Active");
  },

  getEmptyForm(): PromotionPackageFormState {
    return emptyPromotionPackageForm;
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
        title: "Total Packages",
        value: String(packages.length),
        subtitle: "All configured promotion plans",
      },
      {
        title: "Active Packages",
        value: String(activeCount),
        subtitle: "Currently available for sale",
      },
      {
        title: "Disabled Packages",
        value: String(disabledCount),
        subtitle: "Temporarily hidden from package sales",
      },
      {
        title: "Peak Price",
        value: highestPrice.toLocaleString("en-US"),
        subtitle: "Highest package price across all active and disabled plans",
      },
      {
        title: "Total Quota",
        value: totalQuota.toLocaleString("en-US"),
        subtitle: "Combined delivery quota across all configured packages",
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
      throw new Error("Selected placement slot could not be found.");
    }

    const data = await apiClient.request<PromotionPackageApiResponse>(
      "/api/admin/promotion-packages",
      {
        method: "POST",
        includeJsonContentType: true,
        defaultErrorMessage: "Unable to create promotion package.",
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
      throw new Error("Selected placement slot could not be found.");
    }

    const data = await apiClient.request<PromotionPackageApiResponse>(
      `/api/admin/promotion-packages/${packageId}`,
      {
        method: "PUT",
        includeJsonContentType: true,
        defaultErrorMessage: "Unable to update promotion package.",
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
      throw new Error("Selected placement slot could not be found.");
    }

    const data = await apiClient.request<PromotionPackageApiResponse>(
      `/api/admin/promotion-packages/${packageId}`,
      {
        method: "PUT",
        includeJsonContentType: true,
        defaultErrorMessage: "Unable to update promotion package status.",
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
