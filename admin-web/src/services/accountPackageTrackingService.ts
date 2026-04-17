import { apiClient } from "../lib/apiClient";
import type {
  AccountPackageTrackingPayload,
  AccountPackageTrackingRow,
  AccountPackageTrackingStatus,
  AccountPackageTrackingSummary,
} from "../types/accountPackageTracking";

type AccountPackageTrackingApiRow = {
  id: string;
  packageCode: AccountPackageTrackingRow["packageCode"];
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
  latestPaymentAmount: number | null;
  latestPaymentAt: string | null;
  status: AccountPackageTrackingStatus;
  statusLabel: string;
  note: string;
};

type AccountPackageTrackingApiPayload = {
  summary: AccountPackageTrackingSummary;
  rows: AccountPackageTrackingApiRow[];
};

const formatCurrencyLabel = (value: number | null) => {
  if (!Number.isFinite(value ?? Number.NaN) || !value || value <= 0) {
    return null;
  }

  return `${Number(value).toLocaleString("vi-VN")} VND`;
};

const formatDateTimeLabel = (value: string | null) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
};

const normalizeRow = (
  row: AccountPackageTrackingApiRow,
): AccountPackageTrackingRow => ({
  ...row,
  packageTitle: row.packageTitle.trim(),
  packageGroupLabel: row.packageGroupLabel.trim(),
  cycleLabel: row.cycleLabel.trim(),
  scopeLabel: row.scopeLabel.trim(),
  holderName: row.holderName.trim(),
  accountName: row.accountName?.trim() || null,
  holderTypeLabel: row.holderTypeLabel.trim(),
  phone: row.phone?.trim() || null,
  email: row.email?.trim() || null,
  startedAt: formatDateTimeLabel(row.startedAt),
  expiresAt: formatDateTimeLabel(row.expiresAt),
  latestPaymentAt: formatDateTimeLabel(row.latestPaymentAt),
  latestPaymentAmountLabel: formatCurrencyLabel(row.latestPaymentAmount),
  note: row.note.trim(),
});

export const accountPackageTrackingService = {
  getSummaryCards(summary: AccountPackageTrackingSummary) {
    return [
      {
        title: "Tổng đang dùng",
        value: String(summary.totalTracked),
        subtitle: "Số người dùng hoặc shop đang có gói còn hiệu lực.",
      },
      {
        title: "Nhóm tài khoản",
        value: String(summary.accountTracked),
        subtitle: "Chủ vườn vĩnh viễn và Cá nhân theo tháng đang hoạt động.",
      },
      {
        title: "Nhóm shop",
        value: String(summary.shopTracked),
        subtitle: "Các shop đang active hoặc còn VIP để vận hành.",
      },
      {
        title: "Sắp hết hạn",
        value: String(summary.expiringSoon),
        subtitle: "Các gói có ngày hết hạn trong 7 ngày tới.",
      },
    ];
  },

  async getTracking(): Promise<AccountPackageTrackingPayload> {
    const response = await apiClient.request<AccountPackageTrackingApiPayload>(
      "/api/admin/account-packages/tracking",
      {
        defaultErrorMessage:
          "Không thể tải danh sách theo dõi gói tài khoản / shop.",
      },
    );

    return {
      summary: response.summary,
      rows: response.rows.map(normalizeRow),
    };
  },
};
