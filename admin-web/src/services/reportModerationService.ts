import { apiClient } from "../lib/apiClient";
import type {
  ApiReportModerationResponse,
  ReportModerationItem,
  ReportModerationStatus,
} from "../types/reportModeration";
import { getAdminProfile } from "../utils/adminSession";

const repairMojibake = (value: string) => {
  if (!value || !/[ÃƒÃ‚Ã¡ÂºÃ¡Â»Ã„]/.test(value)) {
    return value;
  }

  try {
    return decodeURIComponent(escape(value));
  } catch {
    return value;
  }
};

const REPORT_REASON_LABELS: Record<string, string> = {
  SUSPICIOUS_PRICING:
    "Thông tin rao bán có dấu hiệu bất thường so với mặt bằng chung.",
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
  MISLEADING_INFO:
    "Thông tin mô tả đang gây hiểu nhầm so với nội dung thực tế của bài đăng.",
  OFF_PLATFORM_CONTACT:
    "Bài đăng đang điều hướng người mua liên hệ hoặc thanh toán ngoài nền tảng.",
  MisleadingInfo: "Thông tin gây hiểu nhầm",
  "Misleading Info": "Thông tin gây hiểu nhầm",
  OffPlatformContact: "Liên hệ ngoài nền tảng",
  "Off Platform Contact": "Liên hệ ngoài nền tảng",
};

const REPORT_REASON_CODE_LABELS: Record<string, string> = {
  SUSPICIOUS_PRICING: "Thông tin rao bán bất thường",
  COPYRIGHT_MEDIA: "Nghi ngờ sao chép hình ảnh",
  WRONG_CATEGORY: "Sai danh mục",
  SCAM_RISK: "Nguy cơ lừa đảo",
  DUPLICATE_LISTING: "Bài đăng trùng lặp",
  PROHIBITED_CONTENT: "Nội dung bị cấm",
  SPAM_PROMOTION: "Quảng bá quá mức",
  MISLEADING_INFO: "Thông tin gây hiểu nhầm",
  OFF_PLATFORM_CONTACT: "Liên hệ ngoài nền tảng",
  MisleadingInfo: "Thông tin gây hiểu nhầm",
  "Misleading Info": "Thông tin gây hiểu nhầm",
  OffPlatformContact: "Liên hệ ngoài nền tảng",
  "Off Platform Contact": "Liên hệ ngoài nền tảng",
};

const normalizeReasonKey = (value: string | null | undefined) =>
  repairMojibake(value?.trim() || "");

const canonicalizeReasonKey = (value: string) =>
  normalizeReasonKey(value)
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .replace(/_+/g, "_")
    .toUpperCase();

const compactReasonKey = (value: string) =>
  canonicalizeReasonKey(value).replaceAll("_", "");

const buildReasonLookup = (labels: Record<string, string>) => {
  const lookup: Record<string, string> = {};

  Object.entries(labels).forEach(([key, label]) => {
    const normalized = normalizeReasonKey(key);

    if (!normalized) {
      return;
    }

    lookup[normalized] = label;
    lookup[canonicalizeReasonKey(normalized)] = label;
    lookup[compactReasonKey(normalized)] = label;
  });

  return lookup;
};

const REPORT_REASON_LABEL_LOOKUP = buildReasonLookup(REPORT_REASON_LABELS);
const REPORT_REASON_CODE_LOOKUP = buildReasonLookup(REPORT_REASON_CODE_LABELS);

const REPORT_TEXT_LABELS: Record<string, string> = {
  "Potential bait pricing. Needs manual moderation follow-up.":
    "Có dấu hiệu dùng thông tin rao bán mập mờ, cần quản trị viên kiểm tra thủ công thêm.",
  "Pricing was verified with the shop and no policy breach was found.":
    "Đã đối chiếu thông tin rao bán với cửa hàng và chưa ghi nhận vi phạm chính sách.",
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
    "Bài đăng có dấu hiệu đưa thông tin rao bán bất thường so với các bài tương tự trong cùng danh mục.",
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
  "Image set looks duplicated from a third-party seller page.":
    "Bộ ảnh trông giống ảnh bị lấy lại từ một trang bán hàng bên thứ ba.",
  "Contains messaging that bypasses marketplace payment flow.":
    "Nội dung có dấu hiệu điều hướng người mua bỏ qua luồng thanh toán của sàn.",
  "Content was edited and compliant version was republished.":
    "Nội dung đã được chỉnh sửa và phiên bản phù hợp đã được đăng lại.",
  "The post description overstates the maturity and shape training of the tree.":
    "Mô tả bài đăng đang nói quá về độ trưởng thành và mức độ tạo dáng của cây.",
  "Customer noted mismatch between wording and actual plant size.":
    "Người dùng phản ánh mô tả không khớp với kích thước thực tế của cây.",
  "Needs moderation note and content clean-up.":
    "Cần ghi chú kiểm duyệt và làm sạch lại nội dung.",
  "Seller removed duplicated promotional slogans and listing stayed visible.":
    "Người bán đã gỡ các câu quảng bá lặp và bài đăng vẫn được giữ hiển thị.",
  "The reported price looks too low compared with product material quality.":
    "Bài đăng có dấu hiệu dùng thông tin rao bán không phù hợp với chất lượng hoặc mô tả sản phẩm.",
  "Possible bait price to attract off-platform contact.":
    "Có dấu hiệu dùng thông tin mập mờ để dẫn người mua sang liên hệ ngoài nền tảng.",
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

const humanizeCode = (value: string) =>
  value.replaceAll("_", " ").replace(/([a-z])([A-Z])/g, "$1 $2").trim();

const toVietnameseTitle = (value: string) =>
  value
    .split(" ")
    .map((segment) =>
      segment ? segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase() : "",
    )
    .join(" ");

const translateReportText = (
  value: string | null | undefined,
  fallback: string,
) => {
  const normalized = normalizeReasonKey(value);
  if (!normalized) {
    return fallback;
  }

  return (
    REPORT_TEXT_LABELS[normalized] ||
    REPORT_REASON_LABEL_LOOKUP[normalized] ||
    REPORT_REASON_LABEL_LOOKUP[canonicalizeReasonKey(normalized)] ||
    REPORT_REASON_LABEL_LOOKUP[compactReasonKey(normalized)] ||
    normalized
  );
};

const translateReasonCode = (value: string | null | undefined) => {
  const normalized = normalizeReasonKey(value);
  if (!normalized) {
    return "Chung";
  }

  const canonical = canonicalizeReasonKey(normalized);
  const compact = compactReasonKey(normalized);

  if (REPORT_REASON_CODE_LOOKUP[normalized]) {
    return REPORT_REASON_CODE_LOOKUP[normalized];
  }

  if (REPORT_REASON_CODE_LOOKUP[canonical]) {
    return REPORT_REASON_CODE_LOOKUP[canonical];
  }

  if (REPORT_REASON_CODE_LOOKUP[compact]) {
    return REPORT_REASON_CODE_LOOKUP[compact];
  }

  return toVietnameseTitle(humanizeCode(normalized));
};

const mapReportToUi = (item: ApiReportModerationResponse): ReportModerationItem => {
  const reporterDisplayName =
    repairMojibake(item.reporterDisplayName?.trim() || "") ||
    (item.reporterId ? `Người dùng #${item.reporterId}` : "Ẩn danh");

  const reporterSecondaryLabel =
    repairMojibake(item.reporterEmail?.trim() || "") ||
    (item.reporterId ? `Mã người báo cáo ${item.reporterId}` : "Báo cáo ẩn danh");

  return {
    id: item.reportId,
    reporterLabel: reporterDisplayName,
    reporterSecondaryLabel,
    postLabel:
      repairMojibake(item.postTitle?.trim() || "") ||
      (item.postId ? `Bài đăng #${item.postId}` : "Chưa liên kết bài đăng"),
    shopLabel:
      repairMojibake(item.shopName?.trim() || "") ||
      (item.reportShopId ? `Cửa hàng #${item.reportShopId}` : "Chưa liên kết cửa hàng"),
    reasonCode: translateReasonCode(item.reportReasonCode),
    reason: translateReportText(item.reportReason, "Chưa có lý do báo cáo"),
    reporterNote: translateReportText(item.reportNote, "Chưa có ghi chú người báo cáo"),
    adminNote: translateReportText(item.adminNote, "Chưa có ghi chú từ quản trị viên"),
    evidenceUrls: Array.isArray(item.evidenceUrls)
      ? item.evidenceUrls
          .filter((value): value is string => typeof value === "string")
          .map((value) => value.trim())
          .filter(Boolean)
      : [],
    status: mapStatus(item.reportStatus),
    createdAt: formatDateTime(item.reportCreatedAt),
    updatedAt: formatDateTime(item.reportUpdatedAt),
    templateAudit: item.templateAudit
      ? {
          templateId:
            typeof item.templateAudit.templateId === "number"
              ? item.templateAudit.templateId
              : null,
          templateName:
            repairMojibake(item.templateAudit.templateName?.trim() || "") || null,
          templateType:
            repairMojibake(item.templateAudit.templateType?.trim() || "") || null,
          finalMessage:
            repairMojibake(item.templateAudit.finalMessage?.trim() || "") || null,
        }
      : null,
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
    templateId?: number,
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
          adminName: adminProfile?.name,
          ...(adminNote?.trim() ? { adminNote: adminNote.trim() } : {}),
          ...(typeof templateId === "number" ? { templateId } : {}),
        }),
      },
    );

    return mapReportToUi(data);
  },
};
