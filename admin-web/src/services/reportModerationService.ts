import { apiClient } from "../lib/apiClient";
import type {
  ApiReportModerationResponse,
  ReportModerationItem,
  ReportModerationStatus,
} from "../types/reportModeration";

const formatDateTime = (value: string | null) => {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  const day = date.toISOString().slice(0, 10);
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;

  return `${day} ${time}`;
};

const mapStatus = (value: string | null): ReportModerationStatus => {
  switch ((value || "").toLowerCase()) {
    case "resolved":
      return "Resolved";
    case "dismissed":
      return "Dismissed";
    case "pending":
    default:
      return "Pending";
  }
};

const mapReportToUi = (
  item: ApiReportModerationResponse,
): ReportModerationItem => {
  const reporterDisplayName =
    item.reporterDisplayName?.trim() ||
    (item.reporterId ? `User #${item.reporterId}` : "Anonymous");

  const reporterSecondaryLabel =
    item.reporterEmail?.trim() ||
    (item.reporterId ? `Reporter ID ${item.reporterId}` : "Anonymous report");

  return {
    id: item.reportId,
    reporterLabel: reporterDisplayName,
    reporterSecondaryLabel,
    postLabel:
      item.postTitle?.trim() ||
      (item.postId ? `Post #${item.postId}` : "No post linked"),
    shopLabel:
      item.shopName?.trim() ||
      (item.reportShopId ? `Shop #${item.reportShopId}` : "No shop linked"),
    reasonCode: item.reportReasonCode?.trim() || "General",
    reason: item.reportReason?.trim() || "No report reason",
    reporterNote: item.reportNote?.trim() || "No reporter note",
    adminNote: item.adminNote?.trim() || "No admin note",
    status: mapStatus(item.reportStatus),
    createdAt: formatDateTime(item.reportCreatedAt),
    updatedAt: formatDateTime(item.reportUpdatedAt),
  };
};

export const reportModerationService = {
  async fetchReports(): Promise<ReportModerationItem[]> {
    const data = await apiClient.request<ApiReportModerationResponse[]>(
      "/api/admin/reports",
      {
        defaultErrorMessage: "Unable to load moderation reports.",
      },
    );

    return data.map(mapReportToUi);
  },

  async fetchReportById(reportId: number): Promise<ReportModerationItem> {
    const data = await apiClient.request<ApiReportModerationResponse>(
      `/api/admin/reports/${reportId}`,
      {
        defaultErrorMessage: "Unable to load report details.",
      },
    );

    return mapReportToUi(data);
  },

  async updateReportStatus(
    reportId: number,
    status: Exclude<ReportModerationStatus, "Pending">,
    adminNote?: string,
  ): Promise<ReportModerationItem> {
    const data = await apiClient.request<ApiReportModerationResponse>(
      `/api/admin/reports/${reportId}/resolve`,
      {
        method: "PATCH",
        includeJsonContentType: true,
        defaultErrorMessage: "Unable to update report status.",
        body: JSON.stringify({
          status: status.toLowerCase(),
          ...(adminNote?.trim() ? { adminNote: adminNote.trim() } : {}),
        }),
      },
    );

    return mapReportToUi(data);
  },
};
