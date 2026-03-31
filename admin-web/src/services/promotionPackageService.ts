import {
  emptyPromotionPackageForm,
  initialPromotionPackages,
} from "../mock-data/promotionPackages";
import type {
  PromotionPackage,
  PromotionPackageFormState,
  PromotionPackageStatus,
  PromotionPackageSummaryCard,
} from "../types/promotionPackage";

const normalizeText = (value: string) => value.trim();

const getNextPackageId = (packages: PromotionPackage[]) => {
  if (packages.length === 0) return 1;
  return Math.max(...packages.map((item) => item.id)) + 1;
};

const parseCurrencyValue = (value: string) => {
  const numeric = Number(value.replace(/[^\d]/g, ""));
  return Number.isNaN(numeric) ? 0 : numeric;
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

export const promotionPackageService = {
  getPromotionPackages(): PromotionPackage[] {
    return initialPromotionPackages;
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

  createPromotionPackage(
    packages: PromotionPackage[],
    formData: PromotionPackageFormState,
  ): PromotionPackage[] {
    validatePromotionPackageForm(formData, packages);

    const newPackage: PromotionPackage = {
      id: getNextPackageId(packages),
      name: normalizeText(formData.name),
      slot: formData.slot,
      durationDays: formData.durationDays,
      price: normalizeText(formData.price),
      maxPosts: formData.maxPosts,
      displayQuota: formData.displayQuota,
      status: "Active",
      description: normalizeText(formData.description),
    };

    return [newPackage, ...packages];
  },

  updatePromotionPackage(
    packages: PromotionPackage[],
    packageId: number,
    formData: PromotionPackageFormState,
  ): PromotionPackage[] {
    validatePromotionPackageForm(formData, packages, packageId);

    return packages.map((item) =>
      item.id === packageId
        ? {
            ...item,
            name: normalizeText(formData.name),
            slot: formData.slot,
            durationDays: formData.durationDays,
            price: normalizeText(formData.price),
            maxPosts: formData.maxPosts,
            displayQuota: formData.displayQuota,
            description: normalizeText(formData.description),
          }
        : item,
    );
  },

  updatePromotionPackageStatus(
    packages: PromotionPackage[],
    packageId: number,
    status: PromotionPackageStatus,
  ): PromotionPackage[] {
    return packages.map((item) =>
      item.id === packageId ? { ...item, status } : item,
    );
  },
};
