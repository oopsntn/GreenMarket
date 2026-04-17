import { ApiError, apiClient } from "../lib/apiClient";
import type { AIInsightFocus, AIInsightFocusFilter, AIInsightHistoryItem, AIInsightOverview, AIInsightSettings, AIInsightSummaryCard, AIInsightTone, AITrendScoreRow } from "../types/aiInsight";

const AI_INSIGHTS_API_PATH = "/api/admin/ai-insights";

const TEXT_REPLACEMENTS: Array<[string, string]> = [
  ["System Administrator", "Quản trị viên hệ thống"],
  ["Home Top", "Vị trí 1 trang chủ"],
  ["Category Top", "Vị trí 2 trang chủ"],
  ["Search Boost", "Vị trí 3 trang chủ"],
  ["Placement Performance summary", "Tóm tắt hiệu quả vị trí hiển thị"],
  ["Promotion Watchlist summary", "Tóm tắt quảng bá cần theo dõi"],
  ["Revenue Signals summary", "Tóm tắt tín hiệu doanh thu"],
  ["Operator Load summary", "Tóm tắt khối lượng vận hành"],
  ["Homepage traffic stayed stable while Category Top outperformed revenue expectations in the final week of March. Keep Category Top inventory available because it is converting best among active slots.", "Lưu lượng trang chủ giữ ở mức ổn định, trong khi vị trí 2 trang chủ vượt kỳ vọng doanh thu ở tuần cuối tháng 3. Nên tiếp tục duy trì vị trí 2 vì đây là slot chuyển đổi tốt trong các slot đang hoạt động."],
  ["Search Boost campaigns that expired on 2026-03-26 still show demand signals. Review whether any eligible cases should be reopened after payment confirmation.", "Các chiến dịch vị trí 3 trang chủ hết hạn vào ngày 2026-03-26 vẫn cho thấy tín hiệu nhu cầu. Cần rà soát xem trường hợp nào đủ điều kiện để mở lại sau khi xác nhận thanh toán."],
  ["March revenue was concentrated in Homepage and Category Top packages. Search Boost volume increased late in the month but paid contribution is still smaller than premium placements.", "Doanh thu tháng 3 tập trung chủ yếu ở các gói vị trí 1 và vị trí 2 trang chủ. Gói vị trí 3 tăng về số lượng ở cuối tháng nhưng đóng góp doanh thu vẫn thấp hơn các vị trí cao cấp."],
  ["Ops Team B handled the largest number of category campaigns. The current load remains acceptable, but new escalations should be balanced toward Team A for the next cycle.", "Nhóm vận hành B đang xử lý nhiều chiến dịch vị trí 2 nhất. Khối lượng hiện tại vẫn trong ngưỡng chấp nhận, nhưng các ca leo thang mới nên được phân bổ thêm cho Nhóm vận hành A ở chu kỳ tiếp theo."],
  ["Early March homepage impressions were healthy but softened before premium 30-day inventory was activated. Review creative freshness for homepage premium buyers.", "Lượt hiển thị trang chủ đầu tháng 3 ở mức tốt nhưng giảm dần trước khi gói cao cấp 30 ngày được kích hoạt. Cần rà soát lại độ mới của nội dung quảng bá dành cho khách mua vị trí trang chủ."],
  ["Average order value is currently supported by premium homepage packages, while smaller search packages are driving order count. Keep both tiers visible in pricing analysis.", "Giá trị đơn hàng trung bình hiện được giữ bởi các gói vị trí 1 trang chủ, trong khi các gói vị trí 3 đang kéo số lượng đơn. Nên tiếp tục theo dõi đồng thời cả hai tầng gói trong phân tích giá."],
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
});

const normalizeTrendRow = (item: AITrendScoreRow): AITrendScoreRow => ({
  ...item,
  entity: translateText(item.entity),
  scoreNote: translateText(item.scoreNote),
  momentumNote: translateText(item.momentumNote),
  recommendation: translateText(item.recommendation),
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

const getFocusTitleVi = (focus: AIInsightFocus) => {
  if (focus === "Executive Summary") return "Tổng quan điều hành";
  if (focus === "Placement Performance") return "Hiệu quả vị trí hiển thị";
  if (focus === "Promotion Watchlist") return "Quảng bá cần theo dõi";
  if (focus === "Revenue Signals") return "Tín hiệu doanh thu";
  if (focus === "Customer Spending") return "Chi tiêu khách hàng";
  return "Khối lượng vận hành";
};

const buildLocalInsightDetail = (
  focus: AIInsightFocus,
  overview: AIInsightOverview,
  trendRows: AITrendScoreRow[],
  summary: string,
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
    ...executiveItems.map((item) => `- ${item}`),
    "CHỈ SỐ CHÍNH:",
    ...metricItems.map((item) => `- ${item}`),
    "RỦI RO CẦN LƯU Ý:",
    ...(trendHighlights.length > 0
      ? trendHighlights.map((item) => `- ${item}`)
      : ["- Chưa có tín hiệu rủi ro nổi bật trong kỳ dữ liệu đang chọn."]),
    "HÀNH ĐỘNG ĐỀ XUẤT:",
    ...recommendationItems.map((item) => `- ${item}`),
    "DỮ LIỆU DÙNG ĐỂ KẾT LUẬN:",
    ...metricItems.slice(0, 2).map((item) => `- ${item}`),
  ].join("\n");
};

const buildLocalGeneratedInsight = async (
  items: AIInsightHistoryItem[],
  fromDate: string,
  toDate: string,
  focus: AIInsightFocusFilter,
  settings: AIInsightSettings,
): Promise<AIInsightHistoryItem> => {
  const resolvedFocus = getFocusLabel(focus);
  const [overview, trendRows] = await Promise.all([
    aiInsightService.getOverview(fromDate, toDate, focus),
    aiInsightService.getTrendRows(fromDate, toDate),
  ]);

  const summary =
    overview.executiveSummary[0] || getFallbackSummaryByFocus(resolvedFocus);
  const detail = buildLocalInsightDetail(
    resolvedFocus,
    overview,
    trendRows,
    summary,
  );
  const nextId =
    items.length > 0 ? Math.max(...items.map((item) => item.id)) + 1 : 1;

  return normalizeHistoryItem({
    id: nextId,
    title: `Tóm tắt ${getFocusTitleVi(resolvedFocus)}`,
    focus: resolvedFocus,
    summary,
    detail,
    generatedBy: "Bộ phân tích nội bộ",
    generatedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
    status: settings.reviewMode === "Required" ? "Needs Review" : "Generated",
  });
};

const shouldUseLocalFallback = (error: unknown) => {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  return (
    message.includes("gemini") ||
    message.includes("fetch failed") ||
    message.includes("timed out") ||
    message.includes("gemini_api_key") ||
    (error instanceof ApiError && error.status >= 500)
  );
};

export const aiInsightService = {
  getSettings(): Promise<AIInsightSettings> {
    return apiClient.request<AIInsightSettings>(
      `${AI_INSIGHTS_API_PATH}/settings`,
      { defaultErrorMessage: "Không thể tải cấu hình AI Insights." },
    );
  },

  updateSettings(settings: AIInsightSettings): Promise<AIInsightSettings> {
    return apiClient.request<AIInsightSettings>(
      `${AI_INSIGHTS_API_PATH}/settings`,
      {
        method: "PUT",
        includeJsonContentType: true,
        defaultErrorMessage: "Không thể lưu cấu hình AI Insights.",
        body: JSON.stringify(settings),
      },
    );
  },

  getTrendRows(fromDate?: string, toDate?: string): Promise<AITrendScoreRow[]> {
    const params = new URLSearchParams();
    if (fromDate) params.set("fromDate", fromDate);
    if (toDate) params.set("toDate", toDate);
    const query = params.toString();

    return apiClient
      .request<AITrendScoreRow[]>(
        `${AI_INSIGHTS_API_PATH}/trends${query ? `?${query}` : ""}`,
        {
          defaultErrorMessage:
            "Không thể tải dữ liệu chấm điểm xu hướng AI.",
        },
      )
      .then((items) => items.map(normalizeTrendRow));
  },

  getOverview(
    fromDate?: string,
    toDate?: string,
    focus?: AIInsightFocusFilter,
  ): Promise<AIInsightOverview> {
    const params = new URLSearchParams();
    if (fromDate) params.set("fromDate", fromDate);
    if (toDate) params.set("toDate", toDate);
    if (focus && focus !== "All Focus Areas") {
      params.set("focus", getFocusLabel(focus));
    }
    const query = params.toString();

    return apiClient
      .request<AIInsightOverview>(
        `${AI_INSIGHTS_API_PATH}/overview${query ? `?${query}` : ""}`,
        { defaultErrorMessage: "Không thể tải báo cáo nhận định AI." },
      )
      .then(normalizeOverview);
  },

  getHistory(): Promise<AIInsightHistoryItem[]> {
    return apiClient
      .request<AIInsightHistoryItem[]>(`${AI_INSIGHTS_API_PATH}/history`, {
        defaultErrorMessage: "Không thể tải lịch sử AI Insights.",
      })
      .then((items) => items.map(normalizeHistoryItem));
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
        title: "Cần admin xem lại",
        value: String(reviewCount),
        subtitle: "Các bản AI đang ở trạng thái cần kiểm tra",
      },
      {
        title: "Tín hiệu nổi bật",
        value: String(watchlistCount),
        subtitle: `Các dòng xu hướng có điểm từ ${settings.confidenceThreshold} trở lên`,
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
        .then(normalizeHistoryItem);
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
