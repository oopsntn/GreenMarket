import { apiClient } from "../lib/apiClient";
import type {
  AccountPackage,
  AccountPackageCatalog,
  AccountPackageCode,
  AccountPackageFormState,
  AccountPackageStatus,
} from "../types/accountPackage";

type AccountPackageApiResponse = {
  code: AccountPackageCode;
  title: string;
  groupLabel: AccountPackage["groupLabel"];
  scopeLabel: string;
  cycleLabel: string;
  price: number;
  maxSales: number | null;
  description: string;
  features: string[];
  durationDays: number | null;
  durationEditable: boolean;
  updatedAt: string | null;
  statusLabel: AccountPackageStatus;
};

const GROUP_LABELS: Record<string, string> = {
  Shop: "Nhà vườn VIP",
  "Shop VIP": "Nhà vườn VIP",
  VIP: "Nhà vườn VIP",
};

const MAX_INTEGER_FIELD = 2_147_483_647;

const formatCurrencyLabel = (value: number | string | null | undefined) => {
  const numeric = Number(value ?? 0);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "0 VND";
  }

  return `${numeric.toLocaleString("vi-VN")} VND`;
};

const formatDateTimeLabel = (value: string | null | undefined) => {
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

const translateGroupLabel = (value: string) => GROUP_LABELS[value] || value;

const normalizePackage = (
  item: AccountPackageApiResponse,
): AccountPackage => ({
  ...item,
  title: item.title.trim(),
  groupLabel: translateGroupLabel(item.groupLabel),
  description: item.description.trim(),
  features: item.features.filter(Boolean),
  priceLabel: formatCurrencyLabel(item.price),
  updatedAt: formatDateTimeLabel(item.updatedAt),
});

const hasOnlyCurrencyCharacters = (value: string) =>
  /^[\d\s.,]+$/.test(value.trim());

const parsePrice = (value: string) => {
  const normalized = value.trim();

  if (!normalized || !hasOnlyCurrencyCharacters(normalized)) {
    return null;
  }

  const digits = normalized.replace(/[^\d]/g, "");
  if (!digits) {
    return null;
  }

  const numeric = Number(digits);
  if (!Number.isSafeInteger(numeric) || numeric <= 0) {
    return null;
  }

  return numeric;
};

export const accountPackageService = {
  getSummaryCards(packages: AccountPackage[]) {
    const totalPackages = packages.length;
    const accountPackages = packages.filter((item) => item.code !== "SHOP_VIP").length;
    const editableDurationCount = packages.filter(
      (item) => item.durationEditable,
    ).length;

    return [
      {
        title: "Tổng gói",
        value: String(totalPackages),
        subtitle: "Ba gói cố định đang được quản trị.",
      },
      {
        title: "Gói tài khoản",
        value: String(accountPackages),
        subtitle: "Giá và giới hạn bán được đồng bộ theo cấu hình hiện có.",
      },
      {
        title: "Gói có sửa thời hạn",
        value: String(editableDurationCount),
        subtitle: "Hiện tại chỉ Nhà vườn VIP được đổi số ngày.",
      },
    ];
  },

  getEmptyForm(selectedPackage: AccountPackage | null): AccountPackageFormState {
    return {
      title: selectedPackage?.title ?? "",
      price: selectedPackage ? String(selectedPackage.price) : "",
      maxSales: selectedPackage?.maxSales ?? 1,
      durationDays: selectedPackage?.durationDays ?? 90,
    };
  },

  async getCatalog(): Promise<AccountPackageCatalog> {
    const response = await apiClient.request<AccountPackageApiResponse[]>(
      "/api/admin/account-packages",
      {
        defaultErrorMessage: "Không thể tải gói tài khoản / shop.",
      },
    );

    return {
      packages: response.map(normalizePackage),
    };
  },

  async updatePackage(
    packageCode: AccountPackageCode,
    formState: AccountPackageFormState,
    currentPackage: AccountPackage,
  ): Promise<AccountPackage> {
    const price = parsePrice(formState.price);

    if (price === null) {
      throw new Error(
        "Giá gói chỉ được gồm chữ số và các dấu phân cách hợp lệ.",
      );
    }

    if (price > MAX_INTEGER_FIELD) {
      throw new Error(
        "Giá gói không được vượt quá 2.147.483.647 VND.",
      );
    }

    if (price <= 0) {
      throw new Error("Giá gói phải lớn hơn 0.");
    }

    const title = formState.title.trim();
    if (!title) {
      throw new Error("Tên gói không được để trống.");
    }

    const maxSales = Number(formState.maxSales);
    if (!Number.isFinite(maxSales) || maxSales <= 0) {
      throw new Error("Số lượt bán tối đa phải lớn hơn 0.");
    }

    if (!Number.isInteger(maxSales)) {
      throw new Error("Số lượt bán tối đa phải là số nguyên.");
    }

    if (maxSales > MAX_INTEGER_FIELD) {
      throw new Error(
        "Số lượt bán tối đa không được vượt quá 2.147.483.647.",
      );
    }

    const payload: {
      title: string;
      price: number;
      maxSales: number;
      durationDays?: number;
    } = {
      title,
      price,
      maxSales: Math.floor(maxSales),
    };

    if (currentPackage.durationEditable) {
      const parsedDuration = Number(formState.durationDays);
      if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
        throw new Error("Thời hạn VIP phải lớn hơn 0 ngày.");
      }

      if (!Number.isInteger(parsedDuration)) {
        throw new Error("Thời hạn VIP phải là số nguyên.");
      }

      if (parsedDuration > MAX_INTEGER_FIELD) {
        throw new Error(
          "Thời hạn VIP không được vượt quá 2.147.483.647 ngày.",
        );
      }

      payload.durationDays = Math.floor(parsedDuration);
    }

    const response = await apiClient.request<AccountPackageApiResponse>(
      `/api/admin/account-packages/${packageCode}`,
      {
        method: "PATCH",
        includeJsonContentType: true,
        body: JSON.stringify(payload),
        defaultErrorMessage: "Không thể cập nhật gói tài khoản / shop.",
      },
    );

    return normalizePackage(response);
  },
};
