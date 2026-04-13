import { Response } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../../config/db.ts";
import { AuthRequest } from "../../dtos/auth.ts";
import {
  aiInsights,
  placementSlots,
  trendScores,
  users,
} from "../../models/schema/index.ts";
import { adminConfigStoreService } from "../../services/adminConfigStore.service.ts";
import { adminReportingService } from "../../services/adminReporting.service.ts";
import { adminPromotionService } from "../../services/adminPromotion.service.ts";
import { geminiAIService } from "../../services/geminiAI.service.ts";

const AI_INSIGHT_SETTINGS_KEY = "admin_ai_insight_settings";

type AIInsightFocus =
  | "Executive Summary"
  | "Placement Performance"
  | "Promotion Watchlist"
  | "Revenue Signals"
  | "Customer Spending"
  | "Operator Load";

type AIInsightSettings = {
  autoDailySummary: boolean;
  anomalyAlerts: boolean;
  operatorDigest: boolean;
  recommendationTone: "Conservative" | "Balanced" | "Aggressive";
  confidenceThreshold: number;
  promptVersion: string;
  reviewMode: "Required" | "Optional";
};

type InsightMeta = {
  title?: string;
  focus?: AIInsightFocus;
  status?: "Generated" | "Needs Review" | "Archived";
  generatedBy?: string;
  model?: string;
};

type AIInsightOverviewCard = {
  title: string;
  value: string;
  subtitle: string;
};

type AIInsightOverviewBullet = {
  title: string;
  body: string;
  tone: "neutral" | "positive" | "warning";
};

type AIInsightOverviewRow = {
  label: string;
  value: string;
  detail: string;
};

const defaultSettings: AIInsightSettings = {
  autoDailySummary: true,
  anomalyAlerts: true,
  operatorDigest: false,
  recommendationTone: "Balanced",
  confidenceThreshold: 78,
  promptVersion: "gm-admin-v1.4",
  reviewMode: "Required",
};

const isRecommendationTone = (
  value: string,
): value is AIInsightSettings["recommendationTone"] =>
  ["Conservative", "Balanced", "Aggressive"].includes(value);

const isReviewMode = (
  value: string,
): value is AIInsightSettings["reviewMode"] =>
  ["Required", "Optional"].includes(value);

const normalizeSettings = (
  payload: Partial<AIInsightSettings>,
): AIInsightSettings => ({
  autoDailySummary:
    typeof payload.autoDailySummary === "boolean"
      ? payload.autoDailySummary
      : defaultSettings.autoDailySummary,
  anomalyAlerts:
    typeof payload.anomalyAlerts === "boolean"
      ? payload.anomalyAlerts
      : defaultSettings.anomalyAlerts,
  operatorDigest:
    typeof payload.operatorDigest === "boolean"
      ? payload.operatorDigest
      : defaultSettings.operatorDigest,
  recommendationTone:
    typeof payload.recommendationTone === "string" &&
    isRecommendationTone(payload.recommendationTone)
      ? payload.recommendationTone
      : defaultSettings.recommendationTone,
  confidenceThreshold: clampThreshold(
    parseNumber(payload.confidenceThreshold ?? defaultSettings.confidenceThreshold),
  ),
  promptVersion:
    typeof payload.promptVersion === "string" &&
    payload.promptVersion.trim().length > 0
      ? payload.promptVersion.trim().slice(0, 60)
      : defaultSettings.promptVersion,
  reviewMode:
    typeof payload.reviewMode === "string" && isReviewMode(payload.reviewMode)
      ? payload.reviewMode
      : defaultSettings.reviewMode,
});

const formatDateTime = (value: Date | string | null | undefined) => {
  if (!value) return "Chưa có dữ liệu";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có dữ liệu";

  return `${date.toISOString().slice(0, 10)} ${String(date.getHours()).padStart(
    2,
    "0",
  )}:${String(date.getMinutes()).padStart(2, "0")}`;
};

const parseNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const resolveMomentum = (score: number) => {
  if (score >= 85) return "Up";
  if (score >= 65) return "Stable";
  return "Down";
};

const getGeneratedBy = (req: AuthRequest) =>
  req.user?.email || req.user?.mobile || "Quản trị hệ thống";

const clampThreshold = (value: number) =>
  Math.min(100, Math.max(1, Math.round(value)));

const formatCurrency = (value: number) => `${value.toLocaleString("vi-VN")} VND`;

const getFocusLabelVi = (focus: AIInsightFocus) => {
  switch (focus) {
    case "Executive Summary":
      return "Tổng quan điều hành";
    case "Placement Performance":
      return "Hiệu quả vị trí hiển thị";
    case "Promotion Watchlist":
      return "Danh sách khuyến mãi cần theo dõi";
    case "Revenue Signals":
      return "Tín hiệu doanh thu";
    case "Customer Spending":
      return "Chi tiêu khách hàng";
    case "Operator Load":
      return "Khối lượng vận hành";
    default:
      return focus;
  }
};

const getStatusLabelVi = (status: InsightMeta["status"] | undefined) => {
  switch (status) {
    case "Generated":
      return "Đã tạo";
    case "Needs Review":
      return "Cần duyệt";
    case "Archived":
      return "Lưu trữ";
    default:
      return "Đã tạo";
  }
};

const buildInsightOverview = async (
  fromDate?: string,
  toDate?: string,
  focus: AIInsightFocus = "Executive Summary",
) => {
  const [dashboard, analytics, revenue, customerSpending, boostedPosts] =
    await Promise.all([
      adminReportingService.getDashboardOverview(fromDate, toDate),
      adminReportingService.getAnalyticsSummary(fromDate, toDate),
      adminReportingService.getRevenueSummary(fromDate, toDate),
      adminReportingService.getCustomerSpendingSummary(fromDate, toDate),
      adminPromotionService.getBoostedPosts(),
    ]);

  const topPlacement = analytics.topPlacements[0];
  const topRevenuePackage = revenue.rows[0];
  const topCustomer = customerSpending.rows[0];
  const riskyCampaign = boostedPosts.find(
    (item) =>
      item.deliveryHealth === "At Risk" || item.reviewStatus === "Escalated",
  );
  const pendingCampaigns = boostedPosts.filter(
    (item) => item.status === "Scheduled" || item.reviewStatus === "Needs Update",
  ).length;

  const summaryCards: AIInsightOverviewCard[] = [
    {
      title: "Doanh thu kinh doanh",
      value: revenue.summaryCards[0]?.value ?? "0 VND",
      subtitle:
        revenue.summaryCards[0]?.note ?? "Không có đơn thanh toán thành công trong kỳ",
    },
    {
      title: "Đơn hàng hoàn tất",
      value: revenue.summaryCards[1]?.value ?? "0",
      subtitle:
        revenue.summaryCards[1]?.note ??
        "Không có gói khuyến mãi thanh toán thành công trong kỳ",
    },
    {
      title: "CTR lưu lượng",
      value: analytics.kpiCards[1]?.value ?? "0.0%",
      subtitle:
        analytics.kpiCards[1]?.change ??
        "Không có lưu lượng boosted đáng kể trong kỳ",
    },
    {
      title: "Khách chi tiêu cao nhất",
      value: customerSpending.summaryCards[3]?.value ?? "0 VND",
      subtitle:
        customerSpending.summaryCards[3]?.note ??
        "Không có khách phát sinh chi tiêu thành công trong kỳ đã chọn",
    },
  ];

  const highlightCards: AIInsightOverviewBullet[] = [
    {
      title: "Tín hiệu chính",
      body: topPlacement
        ? `${topPlacement.slot} đang dẫn đầu với ${topPlacement.impressions} lượt hiển thị, ${topPlacement.ctr} CTR và ${topPlacement.revenue} doanh thu trong giai đoạn đã chọn.`
        : "Chưa có placement slot nào tạo ra hiệu quả đo lường rõ rệt trong giai đoạn này.",
      tone: topPlacement ? "positive" : "neutral",
    },
    {
      title: "Rủi ro cần theo dõi",
      body: riskyCampaign
        ? `${riskyCampaign.campaignCode} đang bị gắn cờ ${riskyCampaign.deliveryHealth} với trạng thái duyệt ${riskyCampaign.reviewStatus}. Cần kiểm tra chất lượng phân phối, độ phù hợp của slot và việc theo dõi của đội vận hành trước khi hiệu quả tiếp tục giảm.`
        : "Hiện chưa có boosted campaign nào bị đánh dấu rủi ro hoặc cần escalated.",
      tone: riskyCampaign ? "warning" : "neutral",
    },
    {
      title: "Cơ hội tăng trưởng",
      body: topRevenuePackage
        ? `${topRevenuePackage.packageName} trên slot ${topRevenuePackage.slot} hiện là gói tạo doanh thu tốt nhất. Nên dùng gói này làm mốc tham chiếu cho giá bán và chiến lược upsell ở chu kỳ tiếp theo.`
        : "Chưa có dữ liệu thanh toán đủ để đánh giá hiệu quả kiếm tiền của các gói. Cần hoàn tất thêm các luồng mua gói để mở phân tích doanh thu.",
      tone: topRevenuePackage ? "positive" : "neutral",
    },
  ];

  const recommendations: AIInsightOverviewBullet[] = [
    {
      title: "Hành động ngay",
      body:
        focus === "Promotion Watchlist"
          ? `Hãy rà soát ${pendingCampaigns} promotion đang chờ lịch hoặc cần follow-up để xác định rõ việc chậm khởi chạy đến từ khâu chuẩn bị phân phối, chất lượng nội dung hay xử lý của đội vận hành.`
          : topPlacement
            ? `Tiếp tục giữ ngân sách và ưu tiên vận hành cho ${topPlacement.slot}, đồng thời chọn thêm một slot hiệu quả thấp hơn để thử cải thiện ở vòng tiếp theo.`
            : "Cần ổn định dữ liệu lõi trước để AI có thể so sánh hiệu quả placement một cách đáng tin cậy.",
      tone: "warning",
    },
    {
      title: "Thử nghiệm tiếp theo",
      body: topRevenuePackage
        ? `Nên tạo một thử nghiệm gói mới xoay quanh slot ${topRevenuePackage.slot}, dùng mức giá hiệu quả nhất của ${topRevenuePackage.packageName} làm mốc khởi đầu.`
        : "Cần có ít nhất một giao dịch gói thành công trong kỳ để AI có thể benchmark và đề xuất giá bán hợp lý.",
      tone: "positive",
    },
    {
      title: "Góc nhìn điều hành",
      body: topCustomer
        ? `${topCustomer.customerName} hiện là khách có mức chi tiêu cao nhất. Cần theo dõi xem doanh thu có đang phụ thuộc quá nhiều vào một nhóm nhỏ khách hàng hay không.`
        : "Hiện chưa thể đánh giá mức độ tập trung chi tiêu của khách hàng vì chưa có đủ giao dịch thành công trong kỳ.",
      tone: "neutral",
    },
  ];

  const topRows: AIInsightOverviewRow[] = [
    {
      label: "Placement slot nổi bật",
      value: topPlacement?.slot ?? "Không có dữ liệu",
      detail: topPlacement
        ? `${topPlacement.impressions} lượt hiển thị / ${topPlacement.ctr} CTR`
        : "Không có lưu lượng được ghi nhận trong kỳ",
    },
    {
      label: "Gói doanh thu cao nhất",
      value: topRevenuePackage?.packageName ?? "Không có dữ liệu",
      detail: topRevenuePackage
        ? `${topRevenuePackage.revenue} / ${topRevenuePackage.orders} đơn`
        : "Không có gói nào phát sinh thanh toán trong kỳ",
    },
    {
      label: "Khách hàng nổi bật",
      value: topCustomer?.customerName ?? "Không có dữ liệu",
      detail: topCustomer
        ? `${topCustomer.totalSpent} / ${topCustomer.totalOrders} đơn`
        : "Không có bản ghi chi tiêu khách hàng trong kỳ",
    },
    {
      label: "Báo cáo chờ xử lý",
      value:
        dashboard.statCards.find((card) => card.title === "Pending Reports")
          ?.value ?? "0",
      detail: dashboard.summary.description,
    },
  ];

  return {
    summaryCards,
    highlightCards,
    recommendations,
    topRows,
    availableFocuses: [
      "Executive Summary",
      "Placement Performance",
      "Promotion Watchlist",
      "Revenue Signals",
      "Customer Spending",
      "Operator Load",
    ] as AIInsightFocus[],
  };
};

const getFallbackRequestedBy = async () => {
  const [user] = await db
    .select({ userId: users.userId })
    .from(users)
    .orderBy(users.userId)
    .limit(1);

  return user?.userId ?? null;
};

const buildAdminInsightPrompt = async ({
  fromDate,
  toDate,
  focus,
  tone,
  confidenceThreshold,
  reviewMode,
  autoDailySummary,
  anomalyAlerts,
  operatorDigest,
  generatedAt,
}: {
  fromDate?: string;
  toDate?: string;
  focus: AIInsightFocus;
  tone: string;
  confidenceThreshold: number;
  reviewMode: string;
  autoDailySummary: boolean;
  anomalyAlerts: boolean;
  operatorDigest: boolean;
  generatedAt: string;
}) => {
  const [analytics, revenue, customerSpending, boostedPosts] =
    await Promise.all([
      adminReportingService.getAnalyticsSummary(fromDate, toDate),
      adminReportingService.getRevenueSummary(fromDate, toDate),
      adminReportingService.getCustomerSpendingSummary(fromDate, toDate),
      adminPromotionService.getBoostedPosts(),
    ]);

  const compactContext = {
    requestedFocus: focus,
    requestedTone: tone,
    confidenceThreshold,
    reviewMode,
    autoDailySummary,
    anomalyAlerts,
    operatorDigest,
    selectedWindow: generatedAt,
    analytics: {
      kpis: analytics.kpiCards,
      topPlacements: analytics.topPlacements.slice(0, 5),
      activeTrafficDays: analytics.dailyTraffic
        .filter((item) => item.slots.some((slot) => slot.impressions > 0))
        .slice(-10),
    },
    revenue: {
      summaryCards: revenue.summaryCards,
      topPackages: revenue.rows.slice(0, 5),
    },
    customerSpending: {
      summaryCards: customerSpending.summaryCards,
      topCustomers: customerSpending.rows.slice(0, 5),
    },
    boostedCampaigns: boostedPosts.slice(0, 8).map((item) => ({
      code: item.campaignCode,
      post: item.postTitle,
      owner: item.ownerName,
      slot: item.slot,
      delivery: item.status,
      deliveryHealth: item.deliveryHealth,
      review: item.reviewStatus,
      ctr:
        item.impressions > 0
          ? `${((item.clicks / item.impressions) * 100).toFixed(2)}%`
          : "0.00%",
      quotaUsed: item.usedQuota,
      quotaLimit: item.totalQuota,
      startDate: item.startDate,
      endDate: item.endDate,
    })),
  };

  return [
    "Bạn là trợ lý chiến lược dành cho admin GreenMarket.",
    "Chỉ được sử dụng dữ liệu có trong JSON context. Không được tự bịa thêm số liệu hay nhận định không có căn cứ.",
    "Viết cho admin đang cần một bản đánh giá kinh doanh ngắn gọn nhưng thực dụng cho GreenMarket.",
    "Nội dung phải dễ quét, có tính vận hành và ưu tiên dùng đúng số liệu trong context.",
    "Trả về plain text với 5 phần ngắn:",
    "1. Tóm tắt điều hành",
    "2. Tín hiệu doanh số và doanh thu",
    "3. Rủi ro và điểm bất thường",
    "4. Hành động tăng trưởng được đề xuất",
    "5. Dữ liệu chính đã sử dụng",
    `Giọng điệu: ${tone}.`,
    `Trọng tâm: ${getFocusLabelVi(focus)}.`,
    `Khoảng thời gian đã chọn: ${generatedAt}.`,
    `Ngưỡng tin cậy: ${confidenceThreshold}/100. Chỉ đánh dấu là tín hiệu mạnh khi dữ liệu hỗ trợ thực sự vượt ngưỡng này.`,
    `Chế độ duyệt: ${reviewMode}.`,
    `Tự động tạo tóm tắt hằng ngày: ${autoDailySummary}.`,
    `Cảnh báo bất thường: ${anomalyAlerts}.`,
    `Tóm tắt cho vận hành: ${operatorDigest}.`,
    "JSON context:",
    JSON.stringify(compactContext, null, 2),
  ].join("\n");
};

export const getAIInsightOverview = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { fromDate, toDate, focus = "Executive Summary" } = req.query as {
      fromDate?: string;
      toDate?: string;
      focus?: AIInsightFocus;
    };

    const overview = await buildInsightOverview(fromDate, toDate, focus);
    res.json(overview);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Không thể tải tổng quan AI.",
    });
  }
};

export const getAIInsightSettings = async (
  _req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const settings = await adminConfigStoreService.getJson<AIInsightSettings>(
      AI_INSIGHT_SETTINGS_KEY,
      defaultSettings,
    );

    res.json(normalizeSettings(settings));
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Không thể tải cấu hình AI Insights.",
    });
  }
};

export const updateAIInsightSettings = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const settings = normalizeSettings(req.body as Partial<AIInsightSettings>);
    const savedSettings = await adminConfigStoreService.setJson(
      AI_INSIGHT_SETTINGS_KEY,
      settings,
      req.user?.id,
    );

    res.json(savedSettings);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Không thể lưu cấu hình AI Insights.",
    });
  }
};

export const getAITrendRows = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { fromDate, toDate } = req.query as {
      fromDate?: string;
      toDate?: string;
    };

    const storedScores = await db
      .select({
        id: trendScores.trendScoreId,
        score: trendScores.trendScoreScore,
        updatedAt: trendScores.trendScoreCreatedAt,
        slotTitle: placementSlots.placementSlotTitle,
        slotCode: placementSlots.placementSlotCode,
      })
      .from(trendScores)
      .leftJoin(
        placementSlots,
        eq(trendScores.trendScoreSlotId, placementSlots.placementSlotId),
      )
      .orderBy(desc(trendScores.trendScoreCreatedAt));

    if (storedScores.length > 0) {
      res.json(
        storedScores.map((item) => {
          const score = Math.round(parseNumber(item.score));

          return {
            id: item.id,
            focus: "Placement Performance",
            entity: item.slotTitle || item.slotCode || "Placement Slot",
            score,
            momentum: resolveMomentum(score),
            recommendation:
              score >= 85
                ? "Tiếp tục giữ placement này ở vị trí ưu tiên trong cơ cấu khuyến mãi."
                : "Cần rà lại hiệu quả phân phối và đóng góp doanh thu trước khi mở rộng thêm.",
            owner: "Dịch vụ Analytics",
            updatedAt: formatDateTime(item.updatedAt),
          };
        }),
      );
      return;
    }

    const analytics = await adminReportingService.getAnalyticsSummary(
      fromDate,
      toDate,
    );
    const revenue = await adminReportingService.getRevenueSummary(
      fromDate,
      toDate,
    );
    const revenueRows = new Map(
      revenue.rows.map((row) => [row.slot, row.revenue]),
    );

    res.json(
      analytics.topPlacements.map((item, index) => {
        const ctr = parseNumber(item.ctr.replace("%", ""));
        const score = Math.min(99, Math.max(50, Math.round(65 + ctr * 6)));

        return {
          id: index + 1,
          focus: index % 2 === 0 ? "Placement Performance" : "Revenue Signals",
          entity: item.slot,
          score,
          momentum: resolveMomentum(score),
          recommendation: revenueRows.has(item.slot)
            ? "Tiếp tục theo dõi hiệu quả trả phí và giữ capacity phù hợp với nhu cầu."
            : "Slot này có lưu lượng nhưng chưa tạo doanh thu trả phí trong giai đoạn đã chọn.",
          owner: "API báo cáo admin",
          updatedAt: toDate || new Date().toISOString().slice(0, 10),
        };
      }),
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Không thể tạo dữ liệu điểm xu hướng AI.",
    });
  }
};

export const getAIInsightHistory = async (
  _req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const rows = await db
      .select()
      .from(aiInsights)
      .orderBy(desc(aiInsights.aiInsightCreatedAt));

    res.json(
      rows.map((row) => {
        const meta = row.aiInsightInputSnapshot as InsightMeta | null;
        const focus =
          meta?.focus ||
          (row.aiInsightScope as AIInsightFocus) ||
          "Placement Performance";

        return {
          id: row.aiInsightId,
          title: meta?.title || `Tóm tắt ${getFocusLabelVi(focus)}`,
          focus,
          summary: row.aiInsightOutputText || "Không có nội dung tóm tắt được tạo.",
          generatedBy: meta?.generatedBy || row.aiInsightProvider || "Hệ thống",
          generatedAt: formatDateTime(row.aiInsightCreatedAt),
          status: meta?.status || "Generated",
        };
      }),
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Không thể tải lịch sử AI Insights.",
    });
  }
};

export const generateAIInsight = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const {
      fromDate,
      toDate,
      confidenceThreshold = 78,
      reviewMode = "Required",
      autoDailySummary = true,
      anomalyAlerts = true,
      operatorDigest = false,
      focus = "Placement Performance",
      tone = "Balanced",
      generatedAt = new Date().toISOString().slice(0, 10),
    } = req.body as {
      fromDate?: string;
      toDate?: string;
      confidenceThreshold?: number;
      reviewMode?: AIInsightSettings["reviewMode"];
      autoDailySummary?: boolean;
      anomalyAlerts?: boolean;
      operatorDigest?: boolean;
      focus?: AIInsightFocus;
      tone?: string;
      generatedAt?: string;
    };
    const requestedBy = await getFallbackRequestedBy();

    if (!requestedBy) {
      res.status(400).json({ error: "Cần có ít nhất một người dùng để lưu insight." });
      return;
    }

    const prompt = await buildAdminInsightPrompt({
      fromDate,
      toDate,
      focus,
      tone,
      confidenceThreshold: clampThreshold(confidenceThreshold),
      reviewMode,
      autoDailySummary,
      anomalyAlerts,
      operatorDigest,
      generatedAt,
    });
    const generated = await geminiAIService.generateAdminInsight(prompt);

    const [createdInsight] = await db
      .insert(aiInsights)
      .values({
        aiInsightRequestedBy: requestedBy,
        aiInsightScope: focus,
        aiInsightInputSnapshot: {
          title: `Tóm tắt ${getFocusLabelVi(focus)}`,
          focus,
          status: "Needs Review",
          generatedBy: getGeneratedBy(req),
          generatedAt,
          fromDate,
          toDate,
          confidenceThreshold: clampThreshold(confidenceThreshold),
          reviewMode,
          autoDailySummary,
          anomalyAlerts,
          operatorDigest,
          model: generated.model,
        },
        aiInsightOutputText: generated.text,
        aiInsightProvider: `Gemini ${generated.model}`,
        aiInsightCreatedAt: new Date(),
      })
      .returning();

    res.status(201).json({
      id: createdInsight.aiInsightId,
      title: `Tóm tắt ${getFocusLabelVi(focus)}`,
      focus,
      summary: createdInsight.aiInsightOutputText || generated.text,
      generatedBy: `Gemini ${generated.model}`,
      generatedAt: formatDateTime(createdInsight.aiInsightCreatedAt),
      status: "Needs Review",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Không thể tạo bản phân tích AI.",
    });
  }
};
