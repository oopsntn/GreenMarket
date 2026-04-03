export type ReportModerationStatus = "Pending" | "Resolved" | "Dismissed";

export type ApiReportModerationResponse = {
  reportId: number;
  reporterId: number | null;
  postId: number | null;
  reportShopId: number | null;
  reportReasonCode: string | null;
  reportReason: string;
  reportNote: string | null;
  reportStatus: string;
  adminNote: string | null;
  reportCreatedAt: string | null;
  reportUpdatedAt: string | null;
};

export type ReportModerationItem = {
  id: number;
  reporterLabel: string;
  postLabel: string;
  shopLabel: string;
  reasonCode: string;
  reason: string;
  reporterNote: string;
  adminNote: string;
  status: ReportModerationStatus;
  createdAt: string;
  updatedAt: string;
};
