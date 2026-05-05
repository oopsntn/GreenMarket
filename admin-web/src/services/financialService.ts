import { apiClient } from "../lib/apiClient";
import type {
  CreateFinancialPayoutPayload,
  FinancialFilters,
  FinancialHostPayoutCandidate,
  FinancialPayoutDetail,
  FinancialPayoutListResult,
  FinancialPayoutRequest,
  FinancialPayoutStatus,
  FinancialRecentRequest,
  FinancialSourceBreakdown,
  FinancialSourceDetail,
  FinancialPayoutSummary,
} from "../types/financial";

type FinancialListApiResponse = {
  data: Array<{
    payoutRequestId: number;
    userId: number;
    userName: string;
    userEmail: string | null;
    userMobile: string | null;
    audienceLabel: string;
    roleCode: string | null;
    amount: number;
    method: string;
    status: FinancialPayoutStatus;
    note: string | null;
    createdAt: string | null;
    processedAt: string | null;
  }>;
  meta: FinancialPayoutListResult["meta"];
  summary: {
    totalRequests: number;
    pendingRequests: number;
    completedRequests: number;
    pendingAmount: number;
    completedAmount: number;
  };
};

type FinancialDetailApiResponse = {
  data: {
    payoutRequestId: number;
    userId: number;
    userName: string;
    userEmail: string | null;
    userMobile: string | null;
    audienceLabel: string;
    roleCode: string | null;
    amount: number;
    method: string;
    status: FinancialPayoutStatus;
    note: string | null;
    createdAt: string | null;
    processedAt: string | null;
    earningSummary?: {
      totalEarned: number;
      availableBalance: number;
      pendingBalance: number;
      pendingIncome?: number;
      paidOutAmount?: number;
    };
    sourceBreakdown?: Array<{
      type: string;
      typeLabel: string;
      amount: number;
      count: number;
    }>;
    sourceDetails?: Array<{
      earningId: number;
      sourceId: number | null;
      sourceType: string;
      sourceTypeLabel: string;
      sourceTitle: string;
      sourceStatus: string | null;
      sourceStatusLabel: string;
      amount: number;
      createdAt: string | null;
      payerName: string;
      payerEmail: string | null;
      payerMobile: string | null;
      payerLabel: string;
      shopName: string | null;
      fundingStatus: string;
      fundingStatusLabel: string;
      fundingNote: string;
    }>;
    requiresSourceConfirmation?: boolean;
    approvalHint?: string;
    recentRequests?: Array<{
      payoutRequestId: number;
      amount: number;
      status: FinancialPayoutStatus;
      createdAt: string | null;
      processedAt: string | null;
    }>;
  };
};

type HostPayoutCandidateApiResponse = {
  data: Array<{
    userId: number;
    userName: string;
    userEmail: string | null;
    userMobile: string | null;
    roleCode: string | null;
    totalEarned: number;
    paidOutAmount: number;
    pendingAmount: number;
    availableBalance: number;
  }>;
};

const MOJIBAKE_PATTERN = /[\u00c3\u00c2\u00c6\u00c4\u00e2\u00ba\u00bb]/;

const repairMojibake = (value: string) => {
  if (!value || !MOJIBAKE_PATTERN.test(value)) {
    return value;
  }

  try {
    return decodeURIComponent(escape(value));
  } catch {
    return value;
  }
};

const normalizeTextKey = (value: string | null | undefined) =>
  repairMojibake(value?.trim() || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/[^\p{L}\p{N}\s/]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const formatCurrency = (value: number | string | null | undefined) => {
  const numeric = Number(value ?? 0);
  return `${numeric.toLocaleString("vi-VN")} VND`;
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return "--";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
};

const getStatusLabel = (status: FinancialPayoutStatus) => {
  switch (status) {
    case "pending":
      return "Chờ chi trả";
    case "completed":
      return "Đã chi trả";
    default:
      return "Không xác định";
  }
};

const translateAudienceLabel = (value: string | null | undefined) => {
  const normalized = normalizeTextKey(value);
  if (!normalized) {
    return "Host";
  }

  if (normalized.includes("host")) {
    return "Host";
  }

  return repairMojibake(value?.trim() || "");
};

const translateMethodLabel = (value: string | null | undefined) => {
  const normalized = normalizeTextKey(value);
  const labels: Record<string, string> = {
    banktransfer: "Chuyển khoản ngân hàng",
    "bank transfer": "Chuyển khoản ngân hàng",
    manualtransfer: "Chuyển khoản thủ công",
    "manual transfer": "Chuyển khoản thủ công",
    bank: "Chuyển khoản ngân hàng",
    wallet: "Ví nội bộ",
    internalwallet: "Ví nội bộ",
  };

  return labels[normalized] || repairMojibake(value?.trim() || "") || "--";
};

const translateSourceTypeLabel = (type: string, typeLabel?: string | null) => {
  const normalized = normalizeTextKey(typeLabel || type);
  const labels: Record<string, string> = {
    "nhuan but noi dung": "Nhuận bút cố định theo bài",
    contentearning: "Nhuận bút cố định theo bài",
    "content earning": "Nhuận bút cố định theo bài",
    articlepayout: "Nhuận bút cố định theo bài",
    "article payout": "Nhuận bút cố định theo bài",
    "thuong hieu suat": "Thưởng đạt mốc lượt xem",
    performancebonus: "Thưởng đạt mốc lượt xem",
    "performance bonus": "Thưởng đạt mốc lượt xem",
    bonus: "Thưởng đạt mốc lượt xem",
  };

  return (
    labels[normalized] ||
    repairMojibake(typeLabel?.trim() || "") ||
    repairMojibake(type)
  );
};

const translateSourceStatusLabel = (
  status: string | null | undefined,
  statusLabel?: string | null,
) => {
  const normalized = normalizeTextKey(statusLabel || status);
  const labels: Record<string, string> = {
    available: "Đã ghi nhận",
    pending: "Chờ ghi nhận",
    "da xuat ban": "Đã xuất bản",
    published: "Đã xuất bản",
    rejected: "Từ chối",
    completed: "Hoàn thành",
  };

  return (
    labels[normalized] ||
    repairMojibake(statusLabel?.trim() || "") ||
    repairMojibake(status?.trim() || "") ||
    "--"
  );
};

const translateFundingNote = (value: string | null | undefined) => {
  const raw = repairMojibake(value?.trim() || "");
  const normalized = normalizeTextKey(raw);
  const labels: Record<string, string> = {
    "khoan nay duoc greenmarket ghi nhan noi bo cho tai khoan host va khong di qua luong thanh toan giua khach hang voi cong tac vien":
      "Khoản này được ghi nhận trực tiếp vào sổ thu nhập của Host. Admin sẽ chuyển khoản thủ công khi chốt chi trả.",
    "khoan nay duoc green market ghi nhan noi bo cho tai khoan host va khong di qua luong thanh toan giua khach hang voi cong tac vien":
      "Khoản này được ghi nhận trực tiếp vào sổ thu nhập của Host. Admin sẽ chuyển khoản thủ công khi chốt chi trả.",
    "khoan nay la nhuan but noi dung host do greenmarket tu chi tra sau khi bai duoc ghi nhan hop le":
      "Khoản này là nhuận bút cố định cho một bài Host đã được ghi nhận hợp lệ.",
    "khoan nay la nhuan but noi dung host do green market tu chi tra sau khi bai duoc ghi nhan hop le":
      "Khoản này là nhuận bút cố định cho một bài Host đã được ghi nhận hợp lệ.",
  };

  return labels[normalized] || raw || "Khoản thu nhập này đã được ghi nhận trong hệ thống.";
};

const translateSourceTitle = (value: string | null | undefined) => {
  const raw = repairMojibake(value?.trim() || "");
  const normalized = normalizeTextKey(raw);

  const sourceMatch = normalized.match(/^nguon thu\s+(\d+)$/);
  if (sourceMatch) {
    return `Nguồn thu #${sourceMatch[1]}`;
  }

  if (normalized === "nguon thu noi bo") {
    return "Khoản thưởng nội bộ";
  }

  const contentMatch = normalized.match(/^noi dung\s+(\d+)$/);
  if (contentMatch) {
    return `Nội dung #${contentMatch[1]}`;
  }

  if (normalized === "noi dung chua xac dinh") {
    return "Nội dung chưa xác định";
  }

  return raw;
};

const translateApprovalHint = (value: string | null | undefined) => {
  const raw = repairMojibake(value?.trim() || "");
  return (
    raw ||
    "Admin chuyển khoản thủ công ngoài hệ thống và xác nhận lại sau khi đã chi trả."
  );
};

const normalizeRequest = (
  item: FinancialListApiResponse["data"][number],
): FinancialPayoutRequest => ({
  ...item,
  userName: repairMojibake(item.userName),
  userEmail: repairMojibake(item.userEmail || "") || null,
  userMobile: repairMojibake(item.userMobile || "") || null,
  audienceLabel: translateAudienceLabel(item.audienceLabel),
  method: translateMethodLabel(item.method),
  note: repairMojibake(item.note || "") || null,
  amountLabel: formatCurrency(item.amount),
  statusLabel: getStatusLabel(item.status),
  createdAt: formatDateTime(item.createdAt),
  processedAt: item.processedAt ? formatDateTime(item.processedAt) : null,
});

const normalizeSummary = (
  summary: FinancialListApiResponse["summary"],
): FinancialPayoutSummary => ({
  ...summary,
  pendingAmountLabel: formatCurrency(summary.pendingAmount),
  completedAmountLabel: formatCurrency(summary.completedAmount),
});

const normalizeHostPayoutCandidate = (
  item: HostPayoutCandidateApiResponse["data"][number],
): FinancialHostPayoutCandidate => ({
  ...item,
  userName: repairMojibake(item.userName),
  userEmail: repairMojibake(item.userEmail || "") || null,
  userMobile: repairMojibake(item.userMobile || "") || null,
  totalEarned: Number(item.totalEarned ?? 0),
  totalEarnedLabel: formatCurrency(item.totalEarned),
  paidOutAmount: Number(item.paidOutAmount ?? 0),
  paidOutAmountLabel: formatCurrency(item.paidOutAmount),
  pendingAmount: Number(item.pendingAmount ?? 0),
  pendingAmountLabel: formatCurrency(item.pendingAmount),
  availableBalance: Number(item.availableBalance ?? 0),
  availableBalanceLabel: formatCurrency(item.availableBalance),
});

const normalizeSourceBreakdown = (
  item: NonNullable<FinancialDetailApiResponse["data"]["sourceBreakdown"]>[number],
): FinancialSourceBreakdown => ({
  ...item,
  typeLabel: translateSourceTypeLabel(item.type, item.typeLabel),
  amountLabel: formatCurrency(item.amount),
});

const normalizeSourceDetail = (
  item: NonNullable<FinancialDetailApiResponse["data"]["sourceDetails"]>[number],
): FinancialSourceDetail => ({
  ...item,
  sourceTitle: translateSourceTitle(item.sourceTitle),
  sourceTypeLabel: translateSourceTypeLabel(item.sourceType, item.sourceTypeLabel),
  sourceStatusLabel: translateSourceStatusLabel(
    item.sourceStatus,
    item.sourceStatusLabel,
  ),
  payerName: repairMojibake(item.payerName),
  payerEmail: repairMojibake(item.payerEmail || "") || null,
  payerMobile: repairMojibake(item.payerMobile || "") || null,
  payerLabel: "Đơn vị ghi nhận",
  shopName: repairMojibake(item.shopName || "") || null,
  fundingStatusLabel: "Đã ghi nhận trong hệ thống",
  fundingNote: translateFundingNote(item.fundingNote),
  amountLabel: formatCurrency(item.amount),
  createdAt: formatDateTime(item.createdAt),
});

const normalizeRecentRequest = (
  item: NonNullable<FinancialDetailApiResponse["data"]["recentRequests"]>[number],
): FinancialRecentRequest => ({
  ...item,
  amountLabel: formatCurrency(item.amount),
  statusLabel: getStatusLabel(item.status),
  createdAt: formatDateTime(item.createdAt),
  processedAt: item.processedAt ? formatDateTime(item.processedAt) : null,
});

const buildQuery = (filters: FinancialFilters) => {
  const params = new URLSearchParams();

  if (filters.keyword.trim()) {
    params.set("keyword", filters.keyword.trim());
  }

  if (filters.status !== "all") {
    params.set("status", filters.status);
  }

  params.set("audience", "host");

  params.set("page", String(filters.page));
  params.set("limit", String(filters.limit));

  return params.toString();
};

export const financialService = {
  async getHostPayoutCandidates(): Promise<FinancialHostPayoutCandidate[]> {
    const response = await apiClient.request<HostPayoutCandidateApiResponse>(
      "/api/admin/financial/payout-hosts",
      {
        defaultErrorMessage: "Không thể tải danh sách Host để tạo chi trả.",
      },
    );

    return response.data.map(normalizeHostPayoutCandidate);
  },

  async getPayoutRequests(
    filters: FinancialFilters,
  ): Promise<FinancialPayoutListResult> {
    const query = buildQuery(filters);
    const response = await apiClient.request<FinancialListApiResponse>(
      `/api/admin/financial/payout-requests${query ? `?${query}` : ""}`,
      {
        defaultErrorMessage: "Không thể tải danh sách khoản chi trả.",
      },
    );

    return {
      data: response.data.map(normalizeRequest),
      meta: response.meta,
      summary: normalizeSummary(response.summary),
    };
  },

  async getPayoutRequestDetail(id: number): Promise<FinancialPayoutDetail> {
    const response = await apiClient.request<FinancialDetailApiResponse>(
      `/api/admin/financial/payout-requests/${id}`,
      {
        defaultErrorMessage: "Không thể tải chi tiết khoản chi trả.",
      },
    );

    const earningSummary = response.data.earningSummary ?? {
      totalEarned: 0,
      availableBalance: 0,
      pendingBalance: 0,
      pendingIncome: 0,
      paidOutAmount: 0,
    };

    const sourceBreakdown = response.data.sourceBreakdown ?? [];
    const sourceDetails = response.data.sourceDetails ?? [];
    const recentRequests = response.data.recentRequests ?? [];

    return {
      ...response.data,
      userName: repairMojibake(response.data.userName),
      userEmail: repairMojibake(response.data.userEmail || "") || null,
      userMobile: repairMojibake(response.data.userMobile || "") || null,
      audienceLabel: translateAudienceLabel(response.data.audienceLabel),
      method: translateMethodLabel(response.data.method),
      note: repairMojibake(response.data.note || "") || null,
      amountLabel: formatCurrency(response.data.amount),
      statusLabel: getStatusLabel(response.data.status),
      createdAt: formatDateTime(response.data.createdAt),
      processedAt: response.data.processedAt
        ? formatDateTime(response.data.processedAt)
        : null,
      earningSummary: {
        ...earningSummary,
        totalEarnedLabel: formatCurrency(earningSummary.totalEarned),
        availableBalanceLabel: formatCurrency(earningSummary.availableBalance),
        pendingBalanceLabel: formatCurrency(earningSummary.pendingBalance),
        pendingIncomeLabel: formatCurrency(earningSummary.pendingIncome ?? 0),
        paidOutAmountLabel: formatCurrency(earningSummary.paidOutAmount ?? 0),
      },
      sourceBreakdown: sourceBreakdown.map(normalizeSourceBreakdown),
      sourceDetails: sourceDetails.map(normalizeSourceDetail),
      requiresSourceConfirmation: Boolean(response.data.requiresSourceConfirmation),
      approvalHint: translateApprovalHint(response.data.approvalHint),
      recentRequests: recentRequests.map(normalizeRecentRequest),
    };
  },

  async approvePayoutRequest(id: number, adminNote: string) {
    await apiClient.request(`/api/admin/financial/payout-requests/${id}/approve`, {
      method: "PATCH",
      includeJsonContentType: true,
      body: JSON.stringify({ adminNote }),
        defaultErrorMessage: "Không thể xác nhận khoản chi trả.",
    });
  },

  async createPayoutRequest(payload: CreateFinancialPayoutPayload) {
    await apiClient.request("/api/admin/financial/payout-requests", {
      method: "POST",
      includeJsonContentType: true,
      body: JSON.stringify(payload),
      defaultErrorMessage: "Không thể tạo khoản chi trả Host.",
    });
  },

  async rejectPayoutRequest(id: number, adminNote: string) {
    await apiClient.request(`/api/admin/financial/payout-requests/${id}/reject`, {
      method: "PATCH",
      includeJsonContentType: true,
      body: JSON.stringify({ adminNote }),
      defaultErrorMessage: "Không thể từ chối khoản chi trả.",
    });
  },
};
