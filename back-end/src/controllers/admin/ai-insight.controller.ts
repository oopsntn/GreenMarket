import { desc } from "drizzle-orm";
import { Response } from "express";
import { db } from "../../config/db.ts";
import { AuthRequest } from "../../dtos/auth.ts";
import { aiInsights, users } from "../../models/schema/index.ts";
import { adminConfigStoreService } from "../../services/adminConfigStore.service.ts";
import { adminPromotionService } from "../../services/adminPromotion.service.ts";
import { adminReportingService } from "../../services/adminReporting.service.ts";
import { geminiAIService } from "../../services/geminiAI.service.ts";

const AI_INSIGHT_SETTINGS_KEY = "admin_ai_insight_settings";

type AIInsightFocus =
  | "Executive Summary"
  | "Placement Performance"
  | "Promotion Watchlist"
  | "Revenue Signals"
  | "Customer Spending"
  | "Operator Load";
type AIInsightHistoryStatus = "Generated" | "Needs Review" | "Archived";
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
  summary?: string;
  focus?: AIInsightFocus;
  status?: AIInsightHistoryStatus;
  generatedBy?: string;
  model?: string;
  generatedAt?: string;
  fromDate?: string;
  toDate?: string;
  confidenceThreshold?: number;
  reviewMode?: AIInsightSettings["reviewMode"];
  autoDailySummary?: boolean;
  anomalyAlerts?: boolean;
  operatorDigest?: boolean;
};
type AIInsightOverviewCard = { title: string; value: string; subtitle: string };
type AIInsightOverviewBullet = {
  title: string;
  body: string;
  tone: "neutral" | "positive" | "warning";
};
type AIInsightOverviewRow = { label: string; value: string; detail: string };
type AITrendScoreRow = {
  id: number;
  focus: AIInsightFocus;
  entity: string;
  score: number;
  scoreNote: string;
  momentum: "Up" | "Stable" | "Down";
  momentumNote: string;
  recommendation: string;
  updatedAt: string;
};
type AIInsightHistoryItem = {
  id: number;
  title: string;
  focus: AIInsightFocus;
  summary: string;
  detail: string;
  generatedBy: string;
  generatedAt: string;
  status: AIInsightHistoryStatus;
};
type AIInsightOverview = {
  summaryCards: AIInsightOverviewCard[];
  executiveSummary: string[];
  highlightCards: AIInsightOverviewBullet[];
  recommendations: AIInsightOverviewBullet[];
  topRows: AIInsightOverviewRow[];
  availableFocuses: AIInsightFocus[];
};

const defaultSettings: AIInsightSettings = {
  autoDailySummary: true,
  anomalyAlerts: true,
  operatorDigest: false,
  recommendationTone: "Balanced",
  confidenceThreshold: 78,
  promptVersion: "gm-admin-v2.0",
  reviewMode: "Required",
};

const availableFocuses: AIInsightFocus[] = [
  "Executive Summary",
  "Placement Performance",
  "Promotion Watchlist",
  "Revenue Signals",
  "Customer Spending",
  "Operator Load",
];

const parseNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const parsePercentValue = (value: string | null | undefined) =>
  parseNumber((value ?? "").replace("%", "").replace(",", "."));
const parseCurrencyValue = (value: string | null | undefined) =>
  parseNumber((value ?? "").replace(/[^\d.-]/g, ""));
const clampThreshold = (value: number) => Math.min(100, Math.max(1, Math.round(value)));
const clampScore = (value: number) => Math.min(99, Math.max(1, Math.round(value)));
const average = (values: number[]) =>
  values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
const resolveMomentumByDelta = (delta: number): "Up" | "Stable" | "Down" =>
  delta >= 0.08 ? "Up" : delta <= -0.08 ? "Down" : "Stable";
const formatDateTime = (value: Date | string | null | undefined) => {
  if (!value) return "Chưa có dữ liệu";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có dữ liệu";
  return `${date.toISOString().slice(0, 10)} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};
const getGeneratedBy = (req: AuthRequest) =>
  req.user?.name || req.user?.email || req.user?.mobile || "Hệ thống Admin";
const isRecommendationTone = (
  value: string,
): value is AIInsightSettings["recommendationTone"] =>
  ["Conservative", "Balanced", "Aggressive"].includes(value);
const isReviewMode = (
  value: string,
): value is AIInsightSettings["reviewMode"] =>
  ["Required", "Optional"].includes(value);
const normalizeSettings = (payload: Partial<AIInsightSettings>): AIInsightSettings => ({
  autoDailySummary: typeof payload.autoDailySummary === "boolean" ? payload.autoDailySummary : defaultSettings.autoDailySummary,
  anomalyAlerts: typeof payload.anomalyAlerts === "boolean" ? payload.anomalyAlerts : defaultSettings.anomalyAlerts,
  operatorDigest: typeof payload.operatorDigest === "boolean" ? payload.operatorDigest : defaultSettings.operatorDigest,
  recommendationTone: typeof payload.recommendationTone === "string" && isRecommendationTone(payload.recommendationTone) ? payload.recommendationTone : defaultSettings.recommendationTone,
  confidenceThreshold: clampThreshold(parseNumber(payload.confidenceThreshold ?? defaultSettings.confidenceThreshold)),
  promptVersion: typeof payload.promptVersion === "string" && payload.promptVersion.trim().length > 0 ? payload.promptVersion.trim().slice(0, 60) : defaultSettings.promptVersion,
  reviewMode: typeof payload.reviewMode === "string" && isReviewMode(payload.reviewMode) ? payload.reviewMode : defaultSettings.reviewMode,
});
const getFocusLabelVi = (focus: AIInsightFocus) => ({
  "Executive Summary": "Tổng quan điều hành",
  "Placement Performance": "Hiệu quả vị trí hiển thị",
  "Promotion Watchlist": "Quảng bá cần theo dõi",
  "Revenue Signals": "Tín hiệu doanh thu",
  "Customer Spending": "Chi tiêu khách hàng",
  "Operator Load": "Khối lượng vận hành",
}[focus]);
const getHistoryTitle = (focus: AIInsightFocus) => `Tóm tắt ${getFocusLabelVi(focus)}`;
const createInsightSummary = (text: string) => {
  const line = text
    .split("\n")
    .map((item) => item.trim())
    .find((item) => item.length > 0 && !item.endsWith(":") && !item.toLowerCase().startsWith("chào"));
  if (!line) return "Chưa có tóm tắt ngắn cho bản phân tích này.";
  return line.length > 180 ? `${line.slice(0, 177)}...` : line;
};
const getFallbackRequestedBy = async () => {
  const [user] = await db.select({ userId: users.userId }).from(users).orderBy(users.userId).limit(1);
  return user?.userId ?? null;
};

const buildInsightOverview = async (
  fromDate?: string,
  toDate?: string,
  focus: AIInsightFocus = "Executive Summary",
): Promise<AIInsightOverview> => {
  const [dashboard, analytics, revenue, customerSpending, boostedPosts] = await Promise.all([
    adminReportingService.getDashboardOverview(fromDate, toDate),
    adminReportingService.getAnalyticsSummary(fromDate, toDate),
    adminReportingService.getRevenueSummaryWithHostCosts(fromDate, toDate),
    adminReportingService.getCustomerSpendingSummary(fromDate, toDate),
    adminPromotionService.getBoostedPosts(),
  ]);

  const topPlacement = analytics.topPlacements[0];
  const secondPlacement = analytics.topPlacements[1];
  const topRevenuePackage = revenue.rows[0];
  const topCustomer = customerSpending.rows[0];
  const riskyCampaigns = boostedPosts.filter((item) => item.deliveryHealth === "At Risk" || item.reviewStatus === "Escalated");
  const watchCampaigns = boostedPosts.filter((item) => item.deliveryHealth === "Watch" || item.status === "Paused");
  const pendingReports = dashboard.statCards[2]?.value ?? "0";
  const totalRevenue = parseCurrencyValue(revenue.summaryCards[0]?.value);
  const successfulOrders = parseNumber(revenue.summaryCards[1]?.value);
  const averageCtr = analytics.kpiCards[1]?.value ?? "0.0%";
  const topCustomerSpent = parseCurrencyValue(topCustomer?.totalSpent);
  const customerConcentration = totalRevenue > 0 ? Math.round((topCustomerSpent / totalRevenue) * 100) : 0;

  return {
    summaryCards: [
      {
        title: "Doanh thu kinh doanh",
        value: revenue.summaryCards[0]?.value ?? "0 VND",
        subtitle: successfulOrders > 0 ? `${successfulOrders} đơn thanh toán thành công trong kỳ dữ liệu` : "Chưa ghi nhận đơn thanh toán thành công trong kỳ dữ liệu",
      },
      {
        title: "Đơn hàng hoàn tất",
        value: String(successfulOrders),
        subtitle: successfulOrders > 0 ? "Số đơn đã thanh toán thành công và được tính vào doanh thu" : "Chưa có đơn hoàn tất để AI đối chiếu",
      },
      {
        title: "CTR lưu lượng",
        value: averageCtr,
        subtitle: "Tỷ lệ nhấp trung bình của toàn bộ lượt quảng bá có phát sinh hiển thị",
      },
      {
        title: "Khách chi tiêu cao nhất",
        value: topCustomer?.totalSpent ?? "0 VND",
        subtitle: topCustomer ? `${topCustomer.customerName} / ${topCustomer.totalOrders} đơn trong kỳ` : "Chưa có khách phát sinh chi tiêu thành công trong kỳ",
      },
    ],
    executiveSummary: [
      successfulOrders > 0 || totalRevenue > 0
        ? `Trong kỳ ${fromDate ?? "đang chọn"} đến ${toDate ?? "hiện tại"}, GreenMarket ghi nhận ${revenue.summaryCards[0]?.value ?? "0 VND"} doanh thu từ ${successfulOrders} đơn thanh toán thành công. CTR quảng bá trung bình đạt ${averageCtr}.`
        : `Trong kỳ ${fromDate ?? "đang chọn"} đến ${toDate ?? "hiện tại"}, hệ thống chưa có đủ giao dịch thành công để rút ra kết luận doanh thu đáng tin cậy. Ưu tiên hiện tại là ổn định dữ liệu thanh toán và đo lường quảng bá.`,
      topPlacement
        ? `Vị trí nổi bật nhất hiện là ${topPlacement.slot} với ${topPlacement.impressions} lượt hiển thị và ${topPlacement.ctr} CTR. Đây đang là slot có độ phủ và tương tác tốt nhất trong giai đoạn đã chọn.`
        : "Chưa có vị trí hiển thị nào tạo đủ dữ liệu để xác định slot dẫn đầu. Cần thêm lượt phân phối thực tế để AI đưa ra khuyến nghị đáng tin cậy.",
      riskyCampaigns.length > 0
        ? `Hiện có ${riskyCampaigns.length} lượt quảng bá đang ở mức rủi ro và ${watchCampaigns.length} lượt cần theo dõi thêm. Ngoài ra còn ${pendingReports} báo cáo chờ xử lý, nên ưu tiên xử lý các ca có ảnh hưởng trực tiếp tới hiển thị và doanh thu.`
        : `Hiện chưa có lượt quảng bá nào bị gắn cờ rủi ro cao. Tuy vậy vẫn có ${watchCampaigns.length} lượt cần theo dõi và ${pendingReports} báo cáo chờ xử lý để tránh phát sinh gián đoạn ở chu kỳ tiếp theo.`,
      topCustomer
        ? `Khách chi tiêu cao nhất đang là ${topCustomer.customerName} với ${topCustomer.totalSpent}. Tỷ trọng đóng góp của khách này vào doanh thu toàn kỳ khoảng ${customerConcentration}%, là một chỉ dấu để theo dõi mức độ tập trung doanh thu.`
        : "Chưa xác định được khách hàng nổi bật vì dữ liệu chi tiêu trong kỳ còn mỏng. AI chưa thể đánh giá độ lệch giữa nhóm khách hàng lớn và nhóm khách hàng mới.",
      focus === "Executive Summary"
        ? "Ưu tiên điều hành: giữ ổn định slot đang tạo doanh thu tốt nhất, kiểm tra ngay các lượt quảng bá có rủi ro, đồng thời theo dõi xem doanh thu có đang phụ thuộc quá nhiều vào một nhóm nhỏ gói bán hoặc khách hàng hay không."
        : `Trọng tâm đang chọn là ${getFocusLabelVi(focus)}. Các kết luận và đề xuất bên dưới đã được ưu tiên theo đúng trọng tâm này để admin có thể hành động ngay.`,
    ],
    highlightCards: [
      {
        title: "Điểm mạnh đang thấy rõ",
        body: topPlacement ? `${topPlacement.slot} đang dẫn đầu cả về độ phủ và khả năng tạo doanh thu. Nếu cần giữ một điểm neo để tối ưu ngân sách quảng bá, đây là slot nên được ưu tiên theo dõi đầu tiên.` : "Kỳ dữ liệu hiện chưa đủ dày để xác định điểm mạnh nổi bật giữa các vị trí hiển thị.",
        tone: topPlacement ? "positive" : "neutral",
      },
      {
        title: "Vấn đề cần xử lý trước",
        body: riskyCampaigns[0] ? `${riskyCampaigns[0].campaignCode} đang là lượt quảng bá cần xem đầu tiên vì trạng thái chạy là ${riskyCampaigns[0].status} và mức đánh giá là ${riskyCampaigns[0].deliveryHealth}. Nếu không xử lý sớm, hiệu quả phân phối có thể tiếp tục giảm hoặc làm sai lệch số liệu phân tích.` : "Chưa có lượt quảng bá nào ở mức rủi ro cao. Admin có thể chuyển trọng tâm sang tối ưu doanh thu và mở rộng thử nghiệm.",
        tone: riskyCampaigns[0] ? "warning" : "neutral",
      },
      {
        title: "Cơ hội tăng trưởng",
        body: topRevenuePackage ? `${topRevenuePackage.packageName} đang là gói mang lại doanh thu cao nhất. Đây là ứng viên tốt để dùng làm mốc tham chiếu cho giá bán, thông điệp upsell hoặc gói thử nghiệm ở chu kỳ tiếp theo.` : "Chưa có đủ giao dịch để xác định gói dẫn đầu doanh thu. Cần thêm dữ liệu mua gói trước khi mở rộng chiến lược giá.",
        tone: topRevenuePackage ? "positive" : "neutral",
      },
    ],
    recommendations: [
      {
        title: "Hành động ngay",
        body: riskyCampaigns.length > 0 ? `Tạm ưu tiên rà ${Math.min(3, riskyCampaigns.length)} lượt quảng bá rủi ro cao nhất, đối chiếu lại trạng thái chạy, trạng thái duyệt và chất lượng vị trí hiển thị trước khi tiếp tục chi thêm ngân sách.` : "Tập trung giữ ổn định slot đang tạo doanh thu tốt nhất và quan sát sát các lượt quảng bá đang ở mức theo dõi để ngăn chúng chuyển thành rủi ro.",
        tone: "warning",
      },
      {
        title: "Bài toán cần thử nghiệm",
        body: secondPlacement ? `Nên chạy thử một cấu hình bám theo ${secondPlacement.slot} để kiểm tra xem slot đứng thứ hai có thể tăng thêm doanh thu mà không làm loãng hiệu suất của slot dẫn đầu hay không.` : "Nên tạo thêm một thử nghiệm nhỏ giữa hai vị trí hiển thị khác nhau để có dữ liệu so sánh rõ hơn cho vòng phân tích sau.",
        tone: "positive",
      },
      {
        title: "Góc nhìn quản trị",
        body: customerConcentration >= 40 ? "Doanh thu hiện có dấu hiệu tập trung vào một nhóm khách hàng nhỏ. Admin nên theo dõi thêm nhóm khách mới và nhóm chi tiêu trung bình để tránh phụ thuộc quá mức vào khách mua lớn." : "Cơ cấu doanh thu hiện chưa cho thấy dấu hiệu tập trung quá mạnh vào một khách hàng duy nhất. Đây là nền tốt để mở rộng thử nghiệm mà không tạo rủi ro phụ thuộc.",
        tone: "neutral",
      },
    ],
    topRows: [
      {
        label: "Vị trí hiển thị nổi bật",
        value: topPlacement?.slot ?? "Chưa có dữ liệu",
        detail: topPlacement ? `${topPlacement.impressions} lượt hiển thị • ${topPlacement.ctr} CTR` : "Chưa đủ dữ liệu để chọn vị trí dẫn đầu",
      },
      {
        label: "Gói tạo doanh thu tốt nhất",
        value: topRevenuePackage?.packageName ?? "Chưa có dữ liệu",
        detail: topRevenuePackage ? `${topRevenuePackage.revenue} • ${topRevenuePackage.orders} đơn • ${topRevenuePackage.slot}` : "Chưa ghi nhận gói nào tạo doanh thu trong kỳ",
      },
      {
        label: "Khách hàng nổi bật",
        value: topCustomer?.customerName ?? "Chưa có dữ liệu",
        detail: topCustomer ? `${topCustomer.totalSpent} • ${topCustomer.totalOrders} đơn` : "Chưa có dữ liệu chi tiêu để so sánh",
      },
      {
        label: "Báo cáo chờ xử lý",
        value: pendingReports,
        detail: watchCampaigns.length > 0 ? `${watchCampaigns.length} lượt quảng bá cần theo dõi thêm trong cùng kỳ` : "Không có thêm cảnh báo vận hành nổi bật trong cùng kỳ",
      },
    ],
    availableFocuses,
  };
};

const buildTrendRows = async (
  fromDate?: string,
  toDate?: string,
): Promise<AITrendScoreRow[]> => {
  const [analytics, revenue, customerSpending, boostedPosts] = await Promise.all([
    adminReportingService.getAnalyticsSummary(fromDate, toDate),
    adminReportingService.getRevenueSummaryWithHostCosts(fromDate, toDate),
    adminReportingService.getCustomerSpendingSummary(fromDate, toDate),
    adminPromotionService.getBoostedPosts(),
  ]);

  let nextId = 1;
  const totalPlacementRevenue = analytics.topPlacements.reduce((sum, item) => sum + parseCurrencyValue(item.revenue), 0);
  const totalPlacementImpressions = analytics.topPlacements.reduce((sum, item) => sum + parseNumber(item.impressions), 0);
  const averagePlacementCtr = average(analytics.topPlacements.map((item) => parsePercentValue(item.ctr)));

  const placementRows: AITrendScoreRow[] = analytics.topPlacements.slice(0, 3).map((item) => {
    const ctr = parsePercentValue(item.ctr);
    const slotRevenue = parseCurrencyValue(item.revenue);
    const impressionShare = totalPlacementImpressions > 0 ? parseNumber(item.impressions) / totalPlacementImpressions : 0;
    const revenueShare = totalPlacementRevenue > 0 ? slotRevenue / totalPlacementRevenue : 0;
    const ctrIndex = averagePlacementCtr > 0 ? ctr / averagePlacementCtr : 1;
    const score = clampScore(impressionShare * 35 * 100 + revenueShare * 35 * 100 + Math.min(1.25, ctrIndex) * 24 + 6);
    const momentum = resolveMomentumByDelta(averagePlacementCtr > 0 ? (ctr - averagePlacementCtr) / averagePlacementCtr : 0);

    return {
      id: nextId++,
      focus: "Placement Performance",
      entity: item.slot,
      score,
      scoreNote: `${item.impressions} lượt hiển thị • ${item.ctr} CTR • ${item.revenue}`,
      momentum,
      momentumNote: momentum === "Up"
        ? "CTR và đóng góp doanh thu đang cao hơn mức trung bình các slot"
        : momentum === "Down"
          ? "CTR đang thấp hơn mặt bằng chung của nhóm vị trí"
          : "Hiệu suất đang bám sát mức trung bình của các vị trí hiện có",
      recommendation: score >= 80
        ? "Giữ slot này trong nhóm ưu tiên theo dõi và dùng làm mốc so sánh cho các slot còn lại."
        : score >= 65
          ? "Tiếp tục theo dõi thêm một chu kỳ dữ liệu trước khi tăng thêm ngân sách hoặc mở rộng capacity."
          : "Rà lại khả năng tạo nhấp, sức hút nội dung và mức đóng góp doanh thu trước khi tiếp tục mở rộng.",
      updatedAt: toDate || new Date().toISOString().slice(0, 10),
    };
  });

  const totalRevenue = revenue.rows.reduce((sum, row) => sum + parseCurrencyValue(row.revenue), 0);
  const totalRevenueOrders = revenue.rows.reduce((sum, row) => sum + parseNumber(row.orders), 0);
  const averagePackageRevenue = average(revenue.rows.map((row) => parseCurrencyValue(row.revenue)));

  const revenueRows: AITrendScoreRow[] = revenue.rows.slice(0, 3).map((row) => {
    const revenueValue = parseCurrencyValue(row.revenue);
    const revenueShare = totalRevenue > 0 ? revenueValue / totalRevenue : 0;
    const orderShare = totalRevenueOrders > 0 ? parseNumber(row.orders) / totalRevenueOrders : 0;
    const score = clampScore(revenueShare * 70 * 100 + orderShare * 20 * 100 + 10);
    const momentum = resolveMomentumByDelta(averagePackageRevenue > 0 ? (revenueValue - averagePackageRevenue) / averagePackageRevenue : 0);

    return {
      id: nextId++,
      focus: "Revenue Signals",
      entity: row.packageName,
      score,
      scoreNote: `${row.revenue} • ${row.orders} đơn • ${row.slot}`,
      momentum,
      momentumNote: momentum === "Up"
        ? "Doanh thu của gói này đang cao hơn mức trung bình các gói khác"
        : momentum === "Down"
          ? "Doanh thu của gói này đang thấp hơn mặt bằng chung"
          : "Doanh thu đang ở gần mức trung bình của nhóm gói hiện có",
      recommendation: score >= 80
        ? "Có thể dùng gói này làm điểm tham chiếu cho giá bán và thông điệp upsell."
        : score >= 65
          ? "Theo dõi thêm tỷ lệ mua và số đơn trước khi coi đây là gói trụ cột."
          : "Cần xem lại vị trí hiển thị, mức giá và cách mô tả quyền lợi của gói.",
      updatedAt: toDate || new Date().toISOString().slice(0, 10),
    };
  });

  const totalCustomerSpent = customerSpending.rows.reduce((sum, row) => sum + parseCurrencyValue(row.totalSpent), 0);
  const totalCustomerOrders = customerSpending.rows.reduce((sum, row) => sum + parseNumber(row.totalOrders), 0);
  const averageCustomerSpent = average(customerSpending.rows.map((row) => parseCurrencyValue(row.totalSpent)));

  const customerRows: AITrendScoreRow[] = customerSpending.rows.slice(0, 2).map((row) => {
    const spentValue = parseCurrencyValue(row.totalSpent);
    const spentShare = totalCustomerSpent > 0 ? spentValue / totalCustomerSpent : 0;
    const orderShare = totalCustomerOrders > 0 ? parseNumber(row.totalOrders) / totalCustomerOrders : 0;
    const score = clampScore(spentShare * 70 * 100 + orderShare * 20 * 100 + 10);
    const momentum = resolveMomentumByDelta(averageCustomerSpent > 0 ? (spentValue - averageCustomerSpent) / averageCustomerSpent : 0);

    return {
      id: nextId++,
      focus: "Customer Spending",
      entity: row.customerName,
      score,
      scoreNote: `${row.totalSpent} • ${row.totalOrders} đơn`,
      momentum,
      momentumNote: momentum === "Up"
        ? "Mức chi tiêu đang cao hơn phần lớn khách hàng còn lại"
        : momentum === "Down"
          ? "Mức chi tiêu đang thấp hơn mặt bằng nhóm khách có phát sinh đơn"
          : "Mức chi tiêu đang ở gần mức trung bình của nhóm khách hàng hiện có",
      recommendation: score >= 80
        ? "Đây là nhóm khách nên được theo dõi để xây chiến lược giữ chân và upsell."
        : score >= 65
          ? "Có thể khai thác thêm bằng ưu đãi nhẹ hoặc gói phù hợp hơn."
          : "Chưa đủ tín hiệu để coi đây là nhóm khách nổi bật trong kỳ.",
      updatedAt: toDate || new Date().toISOString().slice(0, 10),
    };
  });

  const watchlistRows: AITrendScoreRow[] = boostedPosts.slice(0, 3).map((item) => {
    const ctrValue = item.impressions > 0 ? (item.clicks / item.impressions) * 100 : 0;
    const healthBase = item.deliveryHealth === "Healthy" ? 85 : item.deliveryHealth === "Watch" ? 65 : 42;
    const reviewPenalty = item.reviewStatus === "Escalated" ? 18 : item.reviewStatus === "Needs Update" ? 8 : 0;
    const statusPenalty = item.status === "Closed" ? 18 : item.status === "Paused" ? 10 : item.status === "Expired" ? 6 : 0;
    const score = clampScore(healthBase - reviewPenalty - statusPenalty + ctrValue * 2);
    const momentum = item.deliveryHealth === "At Risk" ? "Down" : item.deliveryHealth === "Watch" ? "Stable" : "Up";

    return {
      id: nextId++,
      focus: "Promotion Watchlist",
      entity: item.campaignCode,
      score,
      scoreNote: `${ctrValue.toFixed(2)}% CTR • ${item.usedQuota}/${item.totalQuota} quota • ${item.status}`,
      momentum,
      momentumNote: momentum === "Up"
        ? "Đang chạy ổn và chưa phát sinh cờ rủi ro mới"
        : momentum === "Down"
          ? "Đang có rủi ro vận hành hoặc trạng thái duyệt cần xử lý"
          : "Cần theo dõi thêm trước khi kết luận là ổn định hay giảm",
      recommendation: item.deliveryHealth === "At Risk" || item.reviewStatus === "Escalated"
        ? "Ưu tiên kiểm tra ngay trạng thái duyệt, vị trí hiển thị và khả năng tiếp tục phân phối."
        : item.deliveryHealth === "Watch"
          ? "Theo dõi thêm một chu kỳ dữ liệu ngắn trước khi tăng ngân sách hoặc thay đổi vị trí."
          : "Có thể tiếp tục vận hành bình thường và dùng làm mốc so sánh cho các ca khác.",
      updatedAt: item.lastOptimizedAt,
    };
  });

  return [...placementRows, ...revenueRows, ...customerRows, ...watchlistRows];
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
  const [overview, trendRows] = await Promise.all([
    buildInsightOverview(fromDate, toDate, focus),
    buildTrendRows(fromDate, toDate),
  ]);

  const toneLead =
    tone === "Conservative"
      ? "Ưu tiên giữ an toàn vận hành, rà soát rủi ro trước khi mở rộng thay đổi."
      : tone === "Aggressive"
        ? "Ưu tiên tăng trưởng, đẩy nhanh các cơ hội đang có tín hiệu tốt."
        : "Cân bằng giữa tăng trưởng và kiểm soát rủi ro, ưu tiên các bước có thể triển khai ngay.";

  const toneAction =
    tone === "Conservative"
      ? "Giữ thay đổi ở quy mô nhỏ và xác minh thêm trước khi tăng ngân sách hoặc mở rộng vận hành."
      : tone === "Aggressive"
        ? "Có thể tăng nhịp thử nghiệm ở các nhóm đang cho tín hiệu tốt để chốt cơ hội sớm."
        : "Triển khai theo từng bước, vừa quan sát dữ liệu vừa điều chỉnh để tránh lệch vận hành.";

  return [
    "Bạn là trợ lý chiến lược cho admin GreenMarket.",
    "Viết hoàn toàn bằng tiếng Việt, giọng chuyên nghiệp, ngắn gọn, dễ quét.",
    "Chỉ được dùng dữ liệu trong JSON context. Không tự bịa thêm số liệu hay nguyên nhân.",
    "Trả về plain text theo đúng cấu trúc sau:",
    "TÓM TẮT ĐIỀU HÀNH:",
    "- 2 đến 3 ý ngắn, nêu kết luận quan trọng nhất cho admin.",
    "CHỈ SỐ CHÍNH:",
    "- 3 ý, mỗi ý phải có số liệu cụ thể.",
    "RỦI RO CẦN LƯU Ý:",
    "- 2 ý, ưu tiên các ca có thể ảnh hưởng vận hành hoặc doanh thu.",
    "HÀNH ĐỘNG ĐỀ XUẤT:",
    "- 3 ý, rõ việc nên làm ngay, việc nên thử nghiệm và việc cần theo dõi thêm.",
    "DỮ LIỆU DÙNG ĐỂ KẾT LUẬN:",
    "- 3 ý ngắn, liệt kê nguồn số liệu chính đã dựa vào.",
    `Giọng điệu: ${tone}.`,
    `Trọng tâm: ${getFocusLabelVi(focus)}.`,
    `Ngưỡng tin cậy: ${confidenceThreshold}/100.`,
    `Chế độ duyệt: ${reviewMode}.`,
    `Tóm tắt hằng ngày: ${autoDailySummary}.`,
    `Cảnh báo bất thường: ${anomalyAlerts}.`,
    `Tóm tắt cho vận hành: ${operatorDigest}.`,
    "JSON context:",
    JSON.stringify(
      {
        selectedWindow: generatedAt,
        focus,
        overview,
        trendRows: trendRows.slice(0, 8),
      },
      null,
      2,
    ),
  ].join("\n");
};

const buildFallbackInsightDetail = async ({
  fromDate,
  toDate,
  focus,
  tone,
  confidenceThreshold,
}: {
  fromDate?: string;
  toDate?: string;
  focus: AIInsightFocus;
  tone: AIInsightSettings["recommendationTone"];
  confidenceThreshold: number;
}) => {
  const [overview, trendRows] = await Promise.all([
    buildInsightOverview(fromDate, toDate, focus),
    buildTrendRows(fromDate, toDate),
  ]);

  const relevantTrendRows = trendRows.filter(
    (item) => focus === "Executive Summary" || item.focus === focus,
  );
  const riskRows = relevantTrendRows.filter(
    (item) => item.score < confidenceThreshold || item.momentum === "Down",
  );
  const watchRows = relevantTrendRows.filter(
    (item) => item.momentum === "Stable",
  );

  const toneLead =
    tone === "Conservative"
      ? "Ưu tiên giữ an toàn vận hành, rà soát rủi ro trước khi mở rộng thay đổi."
      : tone === "Aggressive"
        ? "Ưu tiên tăng trưởng, đẩy nhanh các cơ hội đang có tín hiệu tốt."
        : "Cân bằng giữa tăng trưởng và kiểm soát rủi ro, ưu tiên các bước có thể triển khai ngay.";

  const toneAction =
    tone === "Conservative"
      ? "Giữ thay đổi ở quy mô nhỏ và xác minh thêm trước khi tăng ngân sách hoặc mở rộng vận hành."
      : tone === "Aggressive"
        ? "Có thể tăng nhịp thử nghiệm ở các nhóm đang cho tín hiệu tốt để chốt cơ hội sớm."
        : "Triển khai theo từng bước, vừa quan sát dữ liệu vừa điều chỉnh để tránh lệch vận hành.";

  const executiveItems = overview.executiveSummary.slice(0, 3);
  const topMetricItems = overview.topRows
    .slice(0, 3)
    .map((item) => `${item.label}: ${item.value}. ${item.detail}`);
  const recommendationItems = overview.recommendations
    .slice(0, 3)
    .map((item) => `${item.title}: ${item.body}`);
  const evidenceItems = [
    ...overview.topRows.slice(0, 2).map((item) => `${item.label}: ${item.detail}`),
    ...relevantTrendRows.slice(0, 2).map((item) => `${item.entity}: ${item.scoreNote}`),
  ].slice(0, 3);

  const riskItems =
    riskRows.length > 0
      ? riskRows.slice(0, 2).map((item) => `${item.entity}: ${item.momentumNote}. ${item.recommendation}`)
      : watchRows.length > 0
        ? watchRows.slice(0, 2).map((item) => `${item.entity}: ${item.momentumNote}. ${item.recommendation}`)
        : [
            "Chưa thấy tín hiệu rủi ro lớn trong kỳ dữ liệu đã chọn. Admin nên tiếp tục theo dõi các chỉ số đang ở mức trung bình để tránh giảm hiệu suất ở chu kỳ sau.",
          ];

  const safeExecutiveItems =
    executiveItems.length > 0
      ? executiveItems
      : [
          `Trong kỳ ${fromDate ?? "đang chọn"} đến ${toDate ?? "hiện tại"}, hệ thống chưa đủ dữ liệu để tạo kết luận AI sâu. Bản fallback đang tổng hợp trực tiếp từ số liệu nền hiện có.`,
        ];

  const safeMetricItems =
    topMetricItems.length > 0
      ? topMetricItems
      : ["Chưa có đủ chỉ số nổi bật để liệt kê ở kỳ dữ liệu này."];

  const safeRecommendationItems =
    recommendationItems.length > 0
      ? recommendationItems
      : ["Tiếp tục theo dõi thêm một chu kỳ dữ liệu trước khi đưa ra thay đổi lớn trong vận hành hoặc ngân sách."];

  const safeEvidenceItems =
    evidenceItems.length > 0
      ? evidenceItems
      : ["Dữ liệu nền hiện tại còn mỏng, cần thêm lượt hiển thị, giao dịch hoặc chiến dịch để tăng độ tin cậy."];

  return [
    "TÓM TẮT ĐIỀU HÀNH:",
    `- ${toneLead}`,
    ...safeExecutiveItems.map((item) => `- ${item}`),
    "CHỈ SỐ CHÍNH:",
    ...safeMetricItems.map((item) => `- ${item}`),
    "RỦI RO CẦN LƯU Ý:",
    ...riskItems.map((item) => `- ${item}`),
    "HÀNH ĐỘNG ĐỀ XUẤT:",
    `- ${toneAction}`,
    ...safeRecommendationItems.map((item) => `- ${item}`),
    "DỮ LIỆU DÙNG ĐỂ KẾT LUẬN:",
    ...safeEvidenceItems.map((item) => `- ${item}`),
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
    res.json(await buildInsightOverview(fromDate, toDate, focus));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Không thể tải tổng quan AI." });
  }
};

export const getAIInsightSettings = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const settings = await adminConfigStoreService.getJson<AIInsightSettings>(AI_INSIGHT_SETTINGS_KEY, defaultSettings);
    res.json(normalizeSettings(settings));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Không thể tải cấu hình AI Insights." });
  }
};

export const updateAIInsightSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const settings = normalizeSettings(req.body as Partial<AIInsightSettings>);
    const savedSettings = await adminConfigStoreService.setJson(AI_INSIGHT_SETTINGS_KEY, settings, req.user?.id);
    res.json(savedSettings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Không thể lưu cấu hình AI Insights." });
  }
};

export const getAITrendRows = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fromDate, toDate } = req.query as { fromDate?: string; toDate?: string };
    res.json(await buildTrendRows(fromDate, toDate));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Không thể tạo dữ liệu tín hiệu xu hướng AI." });
  }
};

export const getAIInsightHistory = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rows = await db.select().from(aiInsights).orderBy(desc(aiInsights.aiInsightCreatedAt));
    const history: AIInsightHistoryItem[] = rows.map((row) => {
      const meta = (row.aiInsightInputSnapshot as InsightMeta | null) ?? null;
      const focus = meta?.focus || (row.aiInsightScope as AIInsightFocus) || "Executive Summary";
      const detail = row.aiInsightOutputText?.trim() || "Không có nội dung chi tiết cho bản phân tích này.";
      return {
        id: row.aiInsightId,
        title: meta?.title || getHistoryTitle(focus),
        focus,
        summary: meta?.summary?.trim() || createInsightSummary(detail),
        detail,
        generatedBy: meta?.generatedBy || row.aiInsightProvider || "Hệ thống Admin",
        generatedAt: formatDateTime(row.aiInsightCreatedAt),
        status: meta?.status || "Generated",
      };
    });
    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Không thể tải lịch sử AI Insights." });
  }
};

export const generateAIInsight = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      fromDate,
      toDate,
      confidenceThreshold = 78,
      reviewMode = "Required",
      autoDailySummary = true,
      anomalyAlerts = true,
      operatorDigest = false,
      focus = "Executive Summary",
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

    const normalizedThreshold = clampThreshold(confidenceThreshold);
    const prompt = await buildAdminInsightPrompt({
      fromDate,
      toDate,
      focus,
      tone,
      confidenceThreshold: normalizedThreshold,
      reviewMode,
      autoDailySummary,
      anomalyAlerts,
      operatorDigest,
      generatedAt,
    });
    let generated: { text: string; model: string };
    let providerLabel = "Gemini";

    try {
      generated = await geminiAIService.generateAdminInsight(prompt);
    } catch (error) {
      console.warn(
        "[AI Insights] Gemini unavailable, using fallback generator:",
        error instanceof Error ? error.message : error,
      );
      generated = {
        text: await buildFallbackInsightDetail({
          fromDate,
          toDate,
          focus,
          tone: isRecommendationTone(tone) ? tone : defaultSettings.recommendationTone,
          confidenceThreshold: normalizedThreshold,
        }),
        model: "fallback-local-v1",
      };
      providerLabel = "GreenMarket Fallback";
    }
    const status: AIInsightHistoryStatus = reviewMode === "Required" ? "Needs Review" : "Generated";
    const detail = generated.text?.trim() || "Không có nội dung chi tiết do AI sinh ra.";
    const summary = createInsightSummary(detail);

    const [createdInsight] = await db
      .insert(aiInsights)
      .values({
        aiInsightRequestedBy: requestedBy,
        aiInsightScope: focus,
        aiInsightInputSnapshot: {
          title: getHistoryTitle(focus),
          summary,
          focus,
          status,
          generatedBy: getGeneratedBy(req),
          generatedAt,
          fromDate,
          toDate,
          confidenceThreshold: normalizedThreshold,
          reviewMode,
          autoDailySummary,
          anomalyAlerts,
          operatorDigest,
          model: generated.model,
        } satisfies InsightMeta,
        aiInsightOutputText: detail,
        aiInsightProvider: `${providerLabel} ${generated.model}`,
        aiInsightCreatedAt: new Date(),
      })
      .returning();

    res.status(201).json({
      id: createdInsight.aiInsightId,
      title: getHistoryTitle(focus),
      focus,
      summary,
      detail,
      generatedBy: `${providerLabel} ${generated.model}`,
      generatedAt: formatDateTime(createdInsight.aiInsightCreatedAt),
      status,
    } satisfies AIInsightHistoryItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Không thể tạo bản phân tích AI." });
  }
};
