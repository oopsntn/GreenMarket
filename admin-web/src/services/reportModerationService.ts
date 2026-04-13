import { apiClient } from "../lib/apiClient";
import type {
  ApiReportModerationResponse,
  ReportModerationItem,
  ReportModerationStatus,
} from "../types/reportModeration";
import { getAdminProfile } from "../utils/adminSession";

const formatDateTime = (value: string | null) => {
  if (!value) return "Chưa có dữ liệu";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có dữ liệu";

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
    (item.reporterId ? `Người dùng #${item.reporterId}` : "Ẩn danh");

  const reporterSecondaryLabel =
    item.reporterEmail?.trim() ||
    (item.reporterId
      ? `Mã người báo cáo ${item.reporterId}`
      : "Báo cáo ẩn danh");

  return {
    id: item.reportId,
    reporterLabel: reporterDisplayName,
    reporterSecondaryLabel,
    postLabel:
      item.postTitle?.trim() ||
      (item.postId ? `Bài đăng #${item.postId}` : "Chưa liên kết bài đăng"),
    shopLabel:
      item.shopName?.trim() ||
      (item.reportShopId
        ? `Cửa hàng #${item.reportShopId}`
        : "Chưa liên kết cửa hàng"),
    reasonCode: item.reportReasonCode?.trim() || "Chung",
    reason: item.reportReason?.trim() || "Chưa có lý do báo cáo",
    reporterNote: item.reportNote?.trim() || "Chưa có ghi chú người báo cáo",
    adminNote: item.adminNote?.trim() || "Chưa có ghi chú từ quản trị viên",
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
        defaultErrorMessage: "Không thể tải danh sách báo cáo kiểm duyệt.",
      },
    );

    return data.map(mapReportToUi);
  },

  async fetchReportById(reportId: number): Promise<ReportModerationItem> {
    const data = await apiClient.request<ApiReportModerationResponse>(
      `/api/admin/reports/${reportId}`,
      {
        defaultErrorMessage: "Không thể tải chi tiết báo cáo.",
      },
    );

    return mapReportToUi(data);
  },

  async updateReportStatus(
    reportId: number,
    status: Exclude<ReportModerationStatus, "Pending">,
    adminNote?: string,
  ): Promise<ReportModerationItem> {
    const adminProfile = getAdminProfile();

    const data = await apiClient.request<ApiReportModerationResponse>(
      `/api/admin/reports/${reportId}/resolve`,
      {
        method: "PATCH",
        includeJsonContentType: true,
        defaultErrorMessage: "Không thể cập nhật trạng thái báo cáo.",
        body: JSON.stringify({
          status: status.toLowerCase(),
          adminName: adminProfile?.fullName,
          ...(adminNote?.trim() ? { adminNote: adminNote.trim() } : {}),
        }),
      },
    );

    return mapReportToUi(data);
  },
};
