export type FinancialPayoutStatus = "pending" | "completed" | "rejected";
export type FinancialAudienceFilter = "all" | "host" | "collaborator";

export type FinancialPayoutRequest = {
  payoutRequestId: number;
  userId: number;
  userName: string;
  userEmail: string | null;
  userMobile: string | null;
  audienceLabel: string;
  roleCode: string | null;
  amount: number;
  amountLabel: string;
  method: string;
  status: FinancialPayoutStatus;
  statusLabel: string;
  note: string | null;
  createdAt: string;
  processedAt: string | null;
};

export type FinancialPayoutSummary = {
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  rejectedRequests: number;
  pendingAmount: number;
  completedAmount: number;
  pendingAmountLabel: string;
  completedAmountLabel: string;
};

export type FinancialPayoutListResult = {
  data: FinancialPayoutRequest[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  summary: FinancialPayoutSummary;
};

export type FinancialSourceBreakdown = {
  type: string;
  amount: number;
  amountLabel: string;
  count: number;
};

export type FinancialRecentRequest = {
  payoutRequestId: number;
  amount: number;
  amountLabel: string;
  status: FinancialPayoutStatus;
  statusLabel: string;
  createdAt: string;
  processedAt: string | null;
};

export type FinancialPayoutDetail = {
  payoutRequestId: number;
  userId: number;
  userName: string;
  userEmail: string | null;
  userMobile: string | null;
  audienceLabel: string;
  roleCode: string | null;
  amount: number;
  amountLabel: string;
  method: string;
  status: FinancialPayoutStatus;
  statusLabel: string;
  note: string | null;
  createdAt: string;
  processedAt: string | null;
  earningSummary: {
    totalEarned: number;
    totalEarnedLabel: string;
    availableBalance: number;
    availableBalanceLabel: string;
    pendingBalance: number;
    pendingBalanceLabel: string;
  };
  sourceBreakdown: FinancialSourceBreakdown[];
  recentRequests: FinancialRecentRequest[];
};

export type FinancialFilters = {
  keyword: string;
  status: FinancialPayoutStatus | "all";
  audience: FinancialAudienceFilter;
  page: number;
  limit: number;
};
