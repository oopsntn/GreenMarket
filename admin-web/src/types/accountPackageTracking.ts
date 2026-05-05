export type AccountPackageTrackingCode =
  | "OWNER_LIFETIME"
  | "PERSONAL_MONTHLY"
  | "SHOP_VIP";

export type AccountPackageTrackingStatus =
  | "permanent"
  | "active"
  | "expiring_soon"
  | "inactive";

export type AccountPackageTrackingSummary = {
  totalTracked: number;
  accountTracked: number;
  shopTracked: number;
  expiringSoon: number;
};

export type AccountPackageTrackingRow = {
  id: string;
  packageCode: AccountPackageTrackingCode;
  packageTitle: string;
  packageGroupLabel: string;
  cycleLabel: string;
  scopeLabel: string;
  holderName: string;
  accountName: string | null;
  holderTypeLabel: string;
  userId: number;
  shopId: number | null;
  phone: string | null;
  email: string | null;
  startedAt: string | null;
  expiresAt: string | null;
  status: AccountPackageTrackingStatus;
  statusLabel: string;
  note: string;
};

export type AccountPackageTrackingPayload = {
  summary: AccountPackageTrackingSummary;
  rows: AccountPackageTrackingRow[];
};
