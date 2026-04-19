import { apiClient } from "../lib/apiClient";
import type {
  FinancialFilters,
  FinancialPayoutDetail,
  FinancialPayoutListResult,
  FinancialPayoutRequest,
  FinancialPayoutSummary,
  FinancialPayoutStatus,
  FinancialRecentRequest,
  FinancialSourceBreakdown,
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
    rejectedRequests: number;
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
    earningSummary: {
      totalEarned: number;
      availableBalance: number;
      pendingBalance: number;
    };
    sourceBreakdown: Array<{
      type: string;
      amount: number;
      count: number;
    }>;
    recentRequests: Array<{
      payoutRequestId: number;
      amount: number;
      status: FinancialPayoutStatus;
      createdAt: string | null;
      processedAt: string | null;
    }>;
  };
};

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
      return "Chờ duyệt";
    case "completed":
      return "Hoàn thành";
    case "rejected":
      return "Từ chối";
    default:
      return "Không xác định";
  }
};

const normalizeRequest = (
  item: FinancialListApiResponse["data"][number],
): FinancialPayoutRequest => ({
  ...item,
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

const normalizeSourceBreakdown = (
  item: FinancialDetailApiResponse["data"]["sourceBreakdown"][number],
): FinancialSourceBreakdown => ({
  ...item,
  amountLabel: formatCurrency(item.amount),
});

const normalizeRecentRequest = (
  item: FinancialDetailApiResponse["data"]["recentRequests"][number],
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

  if (filters.audience !== "all") {
    params.set("audience", filters.audience);
  }

  params.set("page", String(filters.page));
  params.set("limit", String(filters.limit));

  return params.toString();
};

export const financialService = {
  async getPayoutRequests(
    filters: FinancialFilters,
  ): Promise<FinancialPayoutListResult> {
    const query = buildQuery(filters);
    const response = await apiClient.request<FinancialListApiResponse>(
      `/api/admin/financial/payout-requests${query ? `?${query}` : ""}`,
      {
        defaultErrorMessage: "Không thể tải danh sách chi trả.",
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
        defaultErrorMessage: "Không thể tải chi tiết yêu cầu chi trả.",
      },
    );

    return {
      ...response.data,
      amountLabel: formatCurrency(response.data.amount),
      statusLabel: getStatusLabel(response.data.status),
      createdAt: formatDateTime(response.data.createdAt),
      processedAt: response.data.processedAt
        ? formatDateTime(response.data.processedAt)
        : null,
      earningSummary: {
        ...response.data.earningSummary,
        totalEarnedLabel: formatCurrency(response.data.earningSummary.totalEarned),
        availableBalanceLabel: formatCurrency(
          response.data.earningSummary.availableBalance,
        ),
        pendingBalanceLabel: formatCurrency(
          response.data.earningSummary.pendingBalance,
        ),
      },
      sourceBreakdown: response.data.sourceBreakdown.map(normalizeSourceBreakdown),
      recentRequests: response.data.recentRequests.map(normalizeRecentRequest),
    };
  },

  async approvePayoutRequest(id: number, adminNote: string) {
    await apiClient.request(`/api/admin/financial/payout-requests/${id}/approve`, {
      method: "PATCH",
      includeJsonContentType: true,
      body: JSON.stringify({ adminNote }),
      defaultErrorMessage: "Không thể xác nhận hoàn thành chi trả.",
    });
  },

  async rejectPayoutRequest(id: number, adminNote: string) {
    await apiClient.request(`/api/admin/financial/payout-requests/${id}/reject`, {
      method: "PATCH",
      includeJsonContentType: true,
      body: JSON.stringify({ adminNote }),
      defaultErrorMessage: "Không thể từ chối yêu cầu chi trả.",
    });
  },
};
