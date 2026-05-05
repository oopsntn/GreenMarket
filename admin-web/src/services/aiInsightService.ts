import { apiClient } from "../lib/apiClient";
import type {
  AIInsightFocus,
  AIInsightFocusFilter,
  AIInsightHistoryItem,
  AIInsightOverview,
  AIInsightSettings,
  AIInsightSummaryCard,
  AIInsightTone,
  AITrendScoreRow,
} from "../types/aiInsight";
import { formatAdminDateTime } from "../utils/adminDateTime";

const AI_INSIGHTS_API_PATH = "/api/admin/ai-insights";
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIMESTAMP_WITH_TIME_ZONE_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;

const TEXT_REPLACEMENTS: Array<[string, string]> = [
  ["System Setup", "Thiết lập hệ thống"],
  ["Hệ Thống Admin", "Hệ thống Admin"],
  ["Gemini gemini-2.5-flash", "Mô hình Gemini 2.5 Flash"],
  ["Gemini gemini-2.0-flash", "Mô hình Gemini 2.0 Flash"],
  ["GreenMarket Fallback fallback-local-v1", "Bộ phân tích dự phòng GreenMarket"],
  ["System Administrator", "Quản trị viên hệ thống"],
  ["Home Top", "Vị trí 1 trang chủ"],
  ["Category Top", "Vị trí 2 trang chủ"],
  ["Search Boost", "Vị trí 3 trang chủ"],
  ["Placement Performance summary", "Tóm tắt hiệu quả vị trí hiển thị"],
  ["Promotion Watchlist summary", "Tóm tắt quảng bá cần theo dõi"],
  ["Revenue Signals summary", "Tóm tắt tín hiệu doanh thu"],
  ["Operator Load summary", "Tóm tắt khối lượng vận hành"],
  ["Needs Review", "Cần duyệt lại"],
  ["Generated", "Đã tạo"],
  ["Archived", "Lưu trữ"],
];

const translateText = (value: string) =>
  TEXT_REPLACEMENTS.reduce(
    (result, [source, target]) => result.replaceAll(source, target),
    value,
  );

const normalizeInsightLine = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const isGenericInsightLine = (value: string) => {
  const normalized = normalizeInsightLine(value);
  return (
    normalized.startsWith("chao ") ||
    normalized.startsWith("duoi day la ban danh gia") ||
    normalized.startsWith("tom tat ") ||
    normalized === "tom tat dieu hanh:" ||
    normalized === "chi so chinh:" ||
    normalized === "rui ro can luu y:" ||
    normalized === "hanh dong de xuat:" ||
    normalized === "du lieu dung de ket luan:"
  );
};

const getFallbackSummaryByFocus = (focus: AIInsightFocus) => {
  if (focus === "Executive Summary") {
    return "Bản này tập trung vào bức tranh kinh doanh tổng thể, rủi ro vận hành và ưu tiên điều hành trong kỳ dữ liệu đã chọn.";
  }

  if (focus === "Placement Performance") {
    return "Bản này tập trung vào hiệu quả các vị trí hiển thị, CTR và mức đóng góp doanh thu của từng slot.";
  }

  if (focus === "Promotion Watchlist") {
    return "Bản này tập trung vào các chiến dịch quảng bá cần theo dõi, các ca rủi ro và ưu tiên kiểm tra trước.";
  }

  if (focus === "Revenue Signals") {
    return "Bản này tập trung vào tín hiệu doanh thu, gói bán hiệu quả và khu vực đang tạo đóng góp chính.";
  }

  if (focus === "Customer Spending") {
    return "Bản này tập trung vào khách hàng chi tiêu nổi bật, mức độ tập trung doanh thu và tín hiệu giữ chân khách.";
  }

  return "Bản này tập trung vào khối lượng vận hành, mức phân bổ xử lý và các điểm cần ưu tiên phối hợp.";
};

const deriveReadableInsightSummary = (
  summary: string,
  detail: string,
  focus: AIInsightFocus,
) => {
  const translatedSummary = translateText(summary).trim();
  const translatedDetail = translateText(detail).trim();

  if (translatedSummary && !isGenericInsightLine(translatedSummary)) {
    return translatedSummary.length > 180
      ? `${translatedSummary.slice(0, 177)}...`
      : translatedSummary;
  }

  const meaningfulLine = translatedDetail
    .split("\n")
    .map((item) =>
      item
        .replace(/^[-*•]\s*/, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .find((item) => item && !isGenericInsightLine(item));

  if (!meaningfulLine) {
    return getFallbackSummaryByFocus(focus);
  }

  return meaningfulLine.length > 180
    ? `${meaningfulLine.slice(0, 177)}...`
    : meaningfulLine;
};

const getFocusLabel = (focus: AIInsightFocusFilter): AIInsightFocus =>
  focus === "All Focus Areas" ? "Executive Summary" : focus;

const getFocusTitleVi = (focus: AIInsightFocus) => {
  if (focus === "Executive Summary") return "Tổng quan điều hành";
  if (focus === "Placement Performance") return "Hiệu quả vị trí hiển thị";
  if (focus === "Promotion Watchlist") return "Quảng bá cần theo dõi";
  if (focus === "Revenue Signals") return "Tín hiệu doanh thu";
  if (focus === "Customer Spending") return "Chi tiêu khách hàng";
  return "Khối lượng vận hành";
};

const getToneLead = (tone: AIInsightSettings["recommendationTone"]) => {
  if (tone === "Conservative") {
    return "Ưu tiên giữ an toàn vận hành, kiểm tra rủi ro trước khi mở rộng thay đổi.";
  }

  if (tone === "Aggressive") {
    return "Ưu tiên tăng trưởng, đẩy nhanh các điểm có tín hiệu tốt và chấp nhận thử nghiệm mạnh hơn.";
  }

  return "Cân bằng giữa tăng trưởng và kiểm soát rủi ro, ưu tiên các bước có thể triển khai ngay.";
};

const getToneRecommendationLine = (
  tone: AIInsightSettings["recommendationTone"],
) => {
  if (tone === "Conservative") {
    return "Giữ thay đổi ở quy mô nhỏ, xác minh thêm trước khi tăng ngân sách hoặc mở rộng vận hành.";
  }

  if (tone === "Aggressive") {
    return "Có thể tăng nhịp thử nghiệm ở các nhóm đang cho tín hiệu tốt để chốt cơ hội tăng trưởng sớm.";
  }

  return "Nên triển khai theo từng bước, vừa quan sát dữ liệu vừa điều chỉnh để tránh lệch vận hành.";
};

const getToneBadgeLabel = (tone: AIInsightSettings["recommendationTone"]) => {
  if (tone === "Conservative") {
    return "Thận trọng";
  }

  if (tone === "Aggressive") {
    return "Quyết liệt";
  }

  return "Cân bằng";
};

const getToneDetailLead = (tone: AIInsightSettings["recommendationTone"]) => {
  if (tone === "Conservative") {
    return "Định hướng giọng điệu: ưu tiên kiểm soát rủi ro, xác minh trước khi mở rộng.";
  }

  if (tone === "Aggressive") {
    return "Định hướng giọng điệu: ưu tiên tăng trưởng nhanh, đẩy mạnh các tín hiệu đang tốt.";
  }

  return "Định hướng giọng điệu: cân bằng giữa tăng trưởng và ổn định vận hành.";
};

const formatLocalDateTime = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

const resolveDisplayDateTime = (
  value: string | null | undefined,
  isoValue?: string,
) => {
  const normalizedIso = isoValue?.trim() || "";
  if (normalizedIso) {
    return formatAdminDateTime(normalizedIso) || value?.trim() || "Chưa có dữ liệu";
  }

  const normalizedValue = value?.trim() || "";
  if (!normalizedValue) {
    return "Chưa có dữ liệu";
  }

  if (DATE_ONLY_PATTERN.test(normalizedValue)) {
    return normalizedValue;
  }

  if (TIMESTAMP_WITH_TIME_ZONE_PATTERN.test(normalizedValue)) {
    return formatAdminDateTime(normalizedValue) || normalizedValue;
  }

  return normalizedValue;
};

const applyToneToHistoryItem = (
  item: AIInsightHistoryItem,
  tone: AIInsightSettings["recommendationTone"],
): AIInsightHistoryItem => {
  const toneLabel = getToneBadgeLabel(tone);
  const title = item.title.includes(`• ${toneLabel}`)
    ? item.title
    : `${item.title} • ${toneLabel}`;

  const lead =
    tone === "Conservative"
      ? "Ưu tiên kiểm soát rủi ro:"
      : tone === "Aggressive"
        ? "Ưu tiên tăng trưởng nhanh:"
        : "Ưu tiên cân bằng vận hành:";

  const summary = item.summary.startsWith(lead)
    ? item.summary
    : `${lead} ${item.summary}`;

  const detailLead = getToneDetailLead(tone);
  const detail = item.detail.startsWith(detailLead)
    ? item.detail
    : `${detailLead}\n\n${item.detail}`;

  return {
    ...item,
    title,
    summary,
    detail,
  };
};

const normalizeHistoryItem = (item: AIInsightHistoryItem): AIInsightHistoryItem => ({
  ...item,
  title: translateText(item.title),
  summary: deriveReadableInsightSummary(
    item.summary,
    item.detail || item.summary,
    item.focus,
  ),
  detail: translateText(item.detail || item.summary),
  generatedBy: translateText(item.generatedBy),
  generatedAt: resolveDisplayDateTime(item.generatedAt, item.generatedAtIso),
});

const normalizeTrendRow = (item: AITrendScoreRow): AITrendScoreRow => ({
  ...item,
  entity: translateText(item.entity),
  scoreNote: translateText(item.scoreNote),
  momentumNote: translateText(item.momentumNote),
  recommendation: translateText(item.recommendation),
  updatedAt: resolveDisplayDateTime(item.updatedAt, item.updatedAtIso),
});

const normalizeOverview = (overview: AIInsightOverview): AIInsightOverview => ({
  ...overview,
  summaryCards: overview.summaryCards.map((item) => ({
    ...item,
    title: translateText(item.title),
    value: translateText(item.value),
    subtitle: translateText(item.subtitle),
  })),
  executiveSummary: overview.executiveSummary.map((item) => translateText(item)),
  highlightCards: overview.highlightCards.map((item) => ({
    ...item,
    title: translateText(item.title),
    body: translateText(item.body),
  })),
  recommendations: overview.recommendations.map((item) => ({
    ...item,
    title: translateText(item.title),
    body: translateText(item.body),
  })),
  topRows: overview.topRows.map((item) => ({
    ...item,
    label: translateText(item.label),
    value: translateText(item.value),
    detail: translateText(item.detail),
  })),
});

const formatOverviewRow = (label: string, value: string, detail: string) =>
  `${label}: ${value}. ${detail}`;

const buildLocalInsightDetail = (
  focus: AIInsightFocus,
  overview: AIInsightOverview,
  trendRows: AITrendScoreRow[],
  summary: string,
  tone: AIInsightSettings["recommendationTone"],
) => {
  const relevantTrendRows = trendRows.filter(
    (item) => focus === "Executive Summary" || item.focus === focus,
  );
  const trendHighlights = relevantTrendRows
    .slice(0, 3)
    .map((item) => `${item.entity}: ${item.scoreNote}. ${item.recommendation}`);

  const executiveItems =
    overview.executiveSummary.length > 0
      ? overview.executiveSummary.slice(0, 3)
      : [summary];
  const metricItems =
    overview.topRows.length > 0
      ? overview.topRows
          .slice(0, 3)
          .map((item) => formatOverviewRow(item.label, item.value, item.detail))
      : ["Chưa có đủ số liệu nền nổi bật để tổng hợp trong kỳ này."];
  const recommendationItems =
    overview.recommendations.length > 0
      ? overview.recommendations
          .slice(0, 3)
          .map((item) => `${item.title}: ${item.body}`)
      : [
          "Tiếp tục theo dõi thêm một chu kỳ dữ liệu trước khi thay đổi lớn về ngân sách hoặc vận hành.",
        ];

  return [
    "TÓM TẮT ĐIỀU HÀNH:",
    `- ${getToneLead(tone)}`,
    ...executiveItems.map((item) => `- ${item}`),
    "CHỈ SỐ CHÍNH:",
    ...metricItems.map((item) => `- ${item}`),
    "RỦI RO CẦN LƯU Ý:",
    ...(trendHighlights.length > 0
      ? trendHighlights.map((item) => `- ${item}`)
      : ["- Chưa có tín hiệu rủi ro nổi bật trong kỳ dữ liệu đang chọn."]),
    "HÀNH ĐỘNG ĐỀ XUẤT:",
    `- ${getToneRecommendationLine(tone)}`,
    ...recommendationItems.map((item) => `- ${item}`),
    "DỮ LIỆU DÙNG ĐỂ KẾT LUẬN:",
    ...metricItems.slice(0, 2).map((item) => `- ${item}`),
  ].join("\n");
};

const shouldUseLocalFallback = (error: unknown) => {
  void error;
  return false;
};

const fetchOverview = (
  fromDate?: string,
  toDate?: string,
  focus?: AIInsightFocusFilter,
) => {
  const params = new URLSearchParams();
  if (fromDate) params.set("fromDate", fromDate);
  if (toDate) params.set("toDate", toDate);
  if (focus && focus !== "All Focus Areas") params.set("focus", focus);
  const query = params.toString();

  return apiClient
    .request<AIInsightOverview>(
      `${AI_INSIGHTS_API_PATH}/overview${query ? `?${query}` : ""}`,
      {
        defaultErrorMessage: "Không thể tải tổng quan AI.",
      },
    )
    .then(normalizeOverview);
};

const fetchTrendRows = (fromDate?: string, toDate?: string) => {
  const params = new URLSearchParams();
  if (fromDate) params.set("fromDate", fromDate);
  if (toDate) params.set("toDate", toDate);
  const query = params.toString();

  return apiClient
    .request<AITrendScoreRow[]>(
      `${AI_INSIGHTS_API_PATH}/trends${query ? `?${query}` : ""}`,
      {
        defaultErrorMessage: "Không thể tải dữ liệu tín hiệu xu hướng AI.",
      },
    )
    .then((items) => items.map(normalizeTrendRow));
};

const fetchHistory = () =>
  apiClient
    .request<AIInsightHistoryItem[]>(`${AI_INSIGHTS_API_PATH}/history`, {
      defaultErrorMessage: "Không thể tải lịch sử nhận định AI.",
    })
    .then((items) => items.map(normalizeHistoryItem));

const buildLocalGeneratedInsight = async (
  items: AIInsightHistoryItem[],
  fromDate: string,
  toDate: string,
  focus: AIInsightFocusFilter,
  settings: AIInsightSettings,
): Promise<AIInsightHistoryItem> => {
  const resolvedFocus = getFocusLabel(focus);
  const [overview, trendRows] = await Promise.all([
    fetchOverview(fromDate, toDate, focus),
    fetchTrendRows(fromDate, toDate),
  ]);

  const summary =
    overview.executiveSummary[0] || getFallbackSummaryByFocus(resolvedFocus);
  const detail = buildLocalInsightDetail(
    resolvedFocus,
    overview,
    trendRows,
    summary,
    settings.recommendationTone,
  );
  const nextId =
    items.length > 0 ? Math.max(...items.map((item) => item.id)) + 1 : 1;

  return applyToneToHistoryItem(
    normalizeHistoryItem({
      id: nextId,
      title: `Tóm tắt ${getFocusTitleVi(resolvedFocus)}`,
      focus: resolvedFocus,
      summary,
      detail,
      generatedBy: "Bộ phân tích nội bộ",
      generatedAt: formatLocalDateTime(new Date()),
      status: settings.reviewMode === "Required" ? "Needs Review" : "Generated",
    }),
    settings.recommendationTone,
  );
};

export const aiInsightService = {
  getSettings(): Promise<AIInsightSettings> {
    return apiClient.request<AIInsightSettings>(`${AI_INSIGHTS_API_PATH}/settings`, {
      defaultErrorMessage: "Không thể tải cấu hình nhận định AI.",
    });
  },

  updateSettings(settings: AIInsightSettings): Promise<AIInsightSettings> {
    return apiClient.request<AIInsightSettings>(`${AI_INSIGHTS_API_PATH}/settings`, {
      method: "PUT",
      includeJsonContentType: true,
      defaultErrorMessage: "Không thể cập nhật cấu hình nhận định AI.",
      body: JSON.stringify(settings),
    });
  },

  getOverview(
    fromDate?: string,
    toDate?: string,
    focus?: AIInsightFocusFilter,
  ): Promise<AIInsightOverview> {
    return fetchOverview(fromDate, toDate, focus);
  },

  getTrendRows(fromDate?: string, toDate?: string): Promise<AITrendScoreRow[]> {
    return fetchTrendRows(fromDate, toDate);
  },

  getHistory(): Promise<AIInsightHistoryItem[]> {
    return fetchHistory();
  },

  getSummaryCards(
    settings: AIInsightSettings,
    trendRows: AITrendScoreRow[],
    historyItems: AIInsightHistoryItem[],
  ): AIInsightSummaryCard[] {
    const toneLabels: Record<AIInsightTone, string> = {
      Conservative: "Thận trọng",
      Balanced: "Cân bằng",
      Aggressive: "Quyết liệt",
    };
    const reviewCount = historyItems.filter(
      (item) => item.status === "Needs Review",
    ).length;
    const watchlistCount = trendRows.filter(
      (item) => item.score >= settings.confidenceThreshold,
    ).length;

    return [
      {
        title: "Bản phân tích đã tạo",
        value: String(historyItems.length),
        subtitle: "Tổng số bản nhận định AI đang được lưu",
      },
      {
        title: "Cần quản trị viên xem lại",
        value: String(reviewCount),
        subtitle: "Các bản AI đang ở trạng thái cần kiểm tra",
      },
      {
        title: "Tín hiệu nổi bật",
        value: String(watchlistCount),
        subtitle: `Các tín hiệu vượt ngưỡng quan tâm ${settings.confidenceThreshold}/100 của AI`,
      },
      {
        title: "Giọng điệu phân tích",
        value: toneLabels[settings.recommendationTone],
        subtitle: "Mức độ quyết liệt của các khuyến nghị AI",
      },
    ];
  },

  async createGeneratedInsight(
    items: AIInsightHistoryItem[],
    fromDate: string,
    toDate: string,
    focus: AIInsightFocusFilter,
    settings: AIInsightSettings,
    generatedAt: string,
  ): Promise<AIInsightHistoryItem> {
    try {
      return await apiClient
        .request<AIInsightHistoryItem>(`${AI_INSIGHTS_API_PATH}/generate`, {
          method: "POST",
          includeJsonContentType: true,
          defaultErrorMessage: "Không thể tạo bản phân tích AI.",
          body: JSON.stringify({
            fromDate,
            toDate,
            focus: getFocusLabel(focus),
            tone: settings.recommendationTone,
            confidenceThreshold: settings.confidenceThreshold,
            reviewMode: settings.reviewMode,
            autoDailySummary: settings.autoDailySummary,
            anomalyAlerts: settings.anomalyAlerts,
            operatorDigest: settings.operatorDigest,
            generatedAt,
          }),
        })
        .then((item) =>
          applyToneToHistoryItem(
            normalizeHistoryItem(item),
            settings.recommendationTone,
          ),
        );
    } catch (error) {
      if (!shouldUseLocalFallback(error)) {
        throw error;
      }

      return buildLocalGeneratedInsight(
        items,
        fromDate,
        toDate,
        focus,
        settings,
      );
    }
  },
};
