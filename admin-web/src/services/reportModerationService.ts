import { apiClient } from "../lib/apiClient";
import type {
  ApiReportModerationResponse,
  ReportModerationItem,
  ReportModerationStatus,
} from "../types/reportModeration";
import { getAdminProfile } from "../utils/adminSession";

const REPORT_REASON_LABELS: Record<string, string> = {
  SUSPICIOUS_PRICING:
    "Giá bán có dấu hiệu bất thường so với mặt bằng chung.",
  COPYRIGHT_MEDIA:
    "Hình ảnh hoặc video có dấu hiệu sao chép từ nguồn khác.",
  WRONG_CATEGORY:
    "Bài đăng đang nằm sai danh mục và gây nhiễu kết quả hiển thị.",
  SCAM_RISK:
    "Nội dung có dấu hiệu lừa đảo hoặc đánh lừa người mua.",
  DUPLICATE_LISTING:
    "Bài đăng bị trùng lặp với nội dung đã đăng trước đó.",
  PROHIBITED_CONTENT:
    "Bài đăng có thể chứa nội dung bị cấm hoặc không phù hợp.",
  SPAM_PROMOTION:
    "Nội dung quảng bá lặp lại quá nhiều hoặc cố tình dẫn người dùng ra ngoài nền tảng.",
};

const REPORT_REASON_CODE_LABELS: Record<string, string> = {
  SUSPICIOUS_PRICING: "Giá bất thường",
  COPYRIGHT_MEDIA: "Nghi ngờ sao chép hình ảnh",
  WRONG_CATEGORY: "Sai danh mục",
  SCAM_RISK: "Nguy cơ lừa đảo",
  DUPLICATE_LISTING: "Bài đăng trùng lặp",
  PROHIBITED_CONTENT: "Nội dung bị cấm",
  SPAM_PROMOTION: "Quảng bá quá mức",
};

const REPORT_TEXT_LABELS: Record<string, string> = {
  "Potential bait pricing. Needs manual moderation follow-up.":
    "Có dấu hiệu đặt giá mồi, cần quản trị viên kiểm tra thủ công thêm.",
  "Pricing was verified with the shop and no policy breach was found.":
    "Đã đối chiếu giá với cửa hàng và chưa ghi nhận vi phạm chính sách.",
  "The post was published under the wrong category and disrupts category relevance.":
    "Bài đăng đang được xếp sai danh mục và làm giảm độ chính xác của phân loại.",
  "Needs category correction and listing clean-up.":
    "Cần chỉnh lại danh mục và làm sạch thông tin bài đăng.",
  "Category was acceptable after manual review.":
    "Sau khi kiểm tra thủ công, danh mục hiện tại vẫn được chấp nhận.",
  "Listing photos appear copied from another marketplace source.":
    "Ảnh bài đăng có dấu hiệu sao chép từ một nguồn sàn khác.",
  "Possible duplicate media set reused across several listings.":
    "Có khả năng cùng một bộ ảnh đang bị dùng lặp ở nhiều bài đăng.",
  "The issue was confirmed and the post owner was asked to replace the media.":
    "Vi phạm đã được xác nhận và chủ bài đăng đã được yêu cầu thay ảnh mới.",
  "The listed price looks abnormal compared with similar ornamental plant posts in the same category.":
    "Mức giá niêm yết đang bất thường so với các bài đăng cây cảnh tương tự trong cùng danh mục.",
  "The post content repeats promotional text and external contact instructions too aggressively.":
    "Nội dung bài đăng lặp lại quá nhiều câu quảng bá và hướng dẫn liên hệ ngoài nền tảng.",
  "Please review whether this listing should stay visible or be rewritten.":
    "Vui lòng rà soát xem bài đăng này nên tiếp tục hiển thị hay cần yêu cầu chỉnh sửa lại nội dung.",
  "Seller was instructed to remove repeated off-platform promotion text before republishing.":
    "Chủ bài đăng đã được yêu cầu gỡ phần quảng bá lặp lại và nội dung dẫn liên hệ ngoài nền tảng trước khi đăng lại.",
  "Post title and product details are not consistent with the attached listing photos.":
    "Tiêu đề bài đăng và thông tin sản phẩm chưa khớp với bộ ảnh đính kèm.",
  "The seller describes a different bonsai shape in the text than in the gallery.":
    "Phần mô tả đang ghi kiểu dáng bonsai khác với hình ảnh trong thư viện.",
  "The post was published under the wrong category and disrupts category relevance":
    "Bài đăng đang được xếp sai danh mục và làm giảm độ chính xác của phân loại.",
};

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "Chưa có dữ liệu";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Chưa có dữ liệu";
  }

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

const translateReportText = (
  value: string | null | undefined,
  fallback: string,
) => {
  const normalized = value?.trim();
  if (!normalized) {
    return fallback;
  }

  return (
    REPORT_TEXT_LABELS[normalized] ||
    REPORT_REASON_LABELS[normalized] ||
    normalized
  );
};

const translateReasonCode = (value: string | null | undefined) => {
  const normalized = value?.trim();
  if (!normalized) {
    return "Chung";
  }

  if (REPORT_REASON_CODE_LABELS[normalized]) {
    return REPORT_REASON_CODE_LABELS[normalized];
  }

  return normalized
    .split("_")
    .map((segment) =>
      segment
        ? segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase()
        : "",
    )
    .join(" ");
};

const mapReportToUi = (item: ApiReportModerationResponse): ReportModerationItem => {
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
    reasonCode: translateReasonCode(item.reportReasonCode),
    reason: translateReportText(item.reportReason, "Chưa có lý do báo cáo"),
    reporterNote: translateReportText(
      item.reportNote,
      "Chưa có ghi chú người báo cáo",
    ),
    adminNote: translateReportText(
      item.adminNote,
      "Chưa có ghi chú từ quản trị viên",
    ),
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
