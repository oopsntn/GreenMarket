export type AccountPackageCode =
  | "OWNER_LIFETIME"
  | "PERSONAL_MONTHLY"
  | "SHOP_VIP";

export type AccountPackageGroup = "Tài khoản" | "Tài khoản / shop" | "Shop";

export type AccountPackageStatus = "Cố định" | "Đang bán" | "Tạm dừng";

export type AccountPackage = {
  code: AccountPackageCode;
  title: string;
  groupLabel: AccountPackageGroup;
  scopeLabel: string;
  cycleLabel: string;
  price: number;
  priceLabel: string;
  description: string;
  features: string[];
  durationDays: number | null;
  durationEditable: boolean;
  updatedAt: string | null;
  statusLabel: AccountPackageStatus;
};

export type AccountPackageCatalog = {
  packages: AccountPackage[];
};

export type AccountPackageFormState = {
  price: string;
  durationDays: number;
};
