import { useCallback, useEffect, useMemo, useState } from "react";
import BaseModal from "../components/BaseModal";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { aiInsightService } from "../services/aiInsightService";
import type { AIInsightFocus, AIInsightFocusFilter, AIInsightHistoryItem, AIInsightOverview, AIInsightOverviewTone, AIInsightSettings, AITrendScoreRow } from "../types/aiInsight";
import { DEFAULT_REPORT_FROM_DATE, DEFAULT_REPORT_TO_DATE, formatDateRangeLabel } from "../utils/dateRange";
import "./AIInsightsPage.css";

const TREND_PAGE_SIZE = 5;
const HISTORY_PAGE_SIZE = 5;
const defaultFocusOptions: AIInsightFocus[] = ["Executive Summary", "Placement Performance", "Promotion Watchlist", "Revenue Signals", "Customer Spending", "Operator Load"];
const initialSettings: AIInsightSettings = { autoDailySummary: true, anomalyAlerts: true, operatorDigest: false, recommendationTone: "Balanced", confidenceThreshold: 78, promptVersion: "gm-admin-v1.4", reviewMode: "Required" };
const initialOverview: AIInsightOverview = { summaryCards: [], executiveSummary: [], highlightCards: [], recommendations: [], topRows: [], availableFocuses: defaultFocusOptions };
const toneLabelMap: Record<AIInsightSettings["recommendationTone"], string> = { Conservative: "Thận trọng", Balanced: "Cân bằng", Aggressive: "Quyết liệt" };
const momentumLabelMap: Record<AITrendScoreRow["momentum"], string> = { Up: "Tăng", Stable: "Ổn định", Down: "Giảm" };
const executiveSummaryLabels = ["Kết luận chính", "Điểm mạnh hiện tại", "Rủi ro cần chú ý", "Khách hàng và doanh thu", "Ưu tiên điều hành"];

type InsightSection = { title: string; items: string[] };
type InsightHighlight = { title: string; body: string; tone: AIInsightOverviewTone };

const getMomentumVariant = (momentum: AITrendScoreRow["momentum"]) => momentum === "Up" ? "positive" : momentum === "Stable" ? "processing" : "negative";
const getInsightToneClass = (tone: AIInsightOverviewTone) => tone === "positive" ? "ai-insights-bullet-card--positive" : tone === "warning" ? "ai-insights-bullet-card--warning" : "ai-insights-bullet-card--neutral";
const normalizeHeading = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/:$/, "").trim();

const getFocusLabelVi = (focus: AIInsightFocusFilter) => {
  if (focus === "All Focus Areas") return "Tất cả trọng tâm";
  if (focus === "Executive Summary") return "Tổng quan điều hành";
  if (focus === "Placement Performance") return "Hiệu quả vị trí hiển thị";
  if (focus === "Promotion Watchlist") return "Quảng bá cần theo dõi";
  if (focus === "Revenue Signals") return "Tín hiệu doanh thu";
  if (focus === "Customer Spending") return "Chi tiêu khách hàng";
  return "Khối lượng vận hành";
};

const parseInsightSections = (detail: string): InsightSection[] => {
  const headings: Record<string, string> = {
    "tom tat dieu hanh": "Tóm tắt điều hành",
    "chi so chinh": "Chỉ số chính",
    "rui ro can luu y": "Rủi ro cần lưu ý",
    "hanh dong de xuat": "Hành động đề xuất",
    "du lieu dung de ket luan": "Dữ liệu dùng để kết luận",
  };
  const sections: InsightSection[] = [];
  let current: InsightSection | null = null;

  detail.split("\n").map((line) => line.trim()).filter(Boolean).forEach((line) => {
    const matchedHeading = headings[normalizeHeading(line)];
    if (matchedHeading) {
      current = { title: matchedHeading, items: [] };
      sections.push(current);
      return;
    }
    const cleanedLine = line.replace(/^[-*•]\s*/, "").trim();
    if (!cleanedLine) return;
    if (!current) {
      current = { title: "Nội dung chính", items: [] };
      sections.push(current);
    }
    current.items.push(cleanedLine);
  });

  return sections.filter((section) => section.items.length > 0);
};

const hasUsefulSections = (sections: InsightSection[]) => sections.some((section) => section.items.some((item) => item.length >= 28 && !normalizeHeading(item).startsWith("duoi day la")));
const formatOverviewRow = (label: string, value: string, detail: string) => `${label}: ${value}. ${detail}`;

const buildOperationalHighlights = (overview: AIInsightOverview): InsightHighlight[] => {
  const cards: Array<InsightHighlight | null> = [];
  const [primaryRow, secondaryRow, tertiaryRow] = overview.topRows;
  const [firstRecommendation, secondRecommendation, thirdRecommendation] = overview.recommendations;

  if (primaryRow) {
    cards.push({
      title: "Điểm neo doanh thu",
      body: `${primaryRow.label} đang là chỉ số nổi bật nhất trong kỳ với ${primaryRow.value}. ${primaryRow.detail}`,
      tone: "positive",
    });
  }

  if (firstRecommendation) {
    cards.push({
      title: "Việc cần xử lý trước",
      body: `${firstRecommendation.title}: ${firstRecommendation.body}`,
      tone: firstRecommendation.tone === "positive" ? "neutral" : firstRecommendation.tone,
    });
  } else if (secondaryRow) {
    cards.push({
      title: "Việc cần soi kỹ",
      body: `${secondaryRow.label} là khu vực nên rà kỹ trong kỳ hiện tại. ${secondaryRow.detail}`,
      tone: "warning",
    });
  }

  if (secondRecommendation) {
    cards.push({
      title: "Cơ hội tăng trưởng",
      body: `${secondRecommendation.title}: ${secondRecommendation.body}`,
      tone: "neutral",
    });
  } else if (tertiaryRow) {
    cards.push({
      title: "Dữ liệu nên khai thác thêm",
      body: `${tertiaryRow.label} có thể dùng làm điểm thử nghiệm tiếp theo. ${tertiaryRow.detail}`,
      tone: "neutral",
    });
  }

  if (cards.length < 3 && thirdRecommendation) {
    cards.push({
      title: "Góc nhìn quản trị",
      body: `${thirdRecommendation.title}: ${thirdRecommendation.body}`,
      tone: thirdRecommendation.tone,
    });
  }

  return cards.filter((item): item is InsightHighlight => Boolean(item));
};

const buildFallbackSections = (focus: AIInsightFocus, overview: AIInsightOverview, summary: string): InsightSection[] => {
  const metricItems = overview.topRows.slice(0, 4).map((item) => formatOverviewRow(item.label, item.value, item.detail));
  const recommendationItems = overview.recommendations.slice(0, 3).map((item) => `${item.title}: ${item.body}`);
  const operationalHighlights = buildOperationalHighlights(overview).map((item) => `${item.title}: ${item.body}`);

  if (focus === "Executive Summary") {
    return [
      { title: "Kết luận chính", items: overview.executiveSummary[0] ? [overview.executiveSummary[0]] : [summary] },
      { title: "Điểm mạnh hiện tại", items: overview.executiveSummary[1] ? [overview.executiveSummary[1]] : metricItems.slice(0, 1) },
      { title: "Rủi ro cần chú ý", items: overview.executiveSummary[2] ? [overview.executiveSummary[2]] : operationalHighlights.slice(1, 2) },
      { title: "Khách hàng và doanh thu", items: overview.executiveSummary[3] ? [overview.executiveSummary[3]] : metricItems.slice(0, 2) },
      { title: "Ưu tiên điều hành", items: overview.executiveSummary[4] ? [overview.executiveSummary[4]] : recommendationItems.slice(0, 2) },
      { title: "Tín hiệu cần bám sát", items: operationalHighlights.slice(0, 3) },
      { title: "Số liệu nền để đối chiếu", items: metricItems.slice(0, 4) },
    ].filter((section) => section.items.length > 0);
  }

  return [
    { title: "Kết luận nhanh", items: [summary] },
    { title: "Tín hiệu nổi bật", items: operationalHighlights.slice(0, 3) },
    { title: "Số liệu nền", items: metricItems.slice(0, 3) },
    { title: "Hướng xử lý đề xuất", items: recommendationItems.slice(0, 3) },
  ].filter((section) => section.items.length > 0);
};

function AIInsightsPage() {
  const [settings, setSettings] = useState<AIInsightSettings>(initialSettings);
  const [overview, setOverview] = useState<AIInsightOverview>(initialOverview);
  const [trendRows, setTrendRows] = useState<AITrendScoreRow[]>([]);
  const [historyItems, setHistoryItems] = useState<AIInsightHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [fromDate, setFromDate] = useState(DEFAULT_REPORT_FROM_DATE);
  const [toDate, setToDate] = useState(DEFAULT_REPORT_TO_DATE);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [focusFilter, setFocusFilter] = useState<AIInsightFocusFilter>("All Focus Areas");
  const [trendPage, setTrendPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<AIInsightHistoryItem | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dateRangeLabel = formatDateRangeLabel(fromDate, toDate);
  const focusOptions = overview.availableFocuses.length ? overview.availableFocuses : defaultFocusOptions;
  const focusSelectOptions: AIInsightFocusFilter[] = ["All Focus Areas", ...focusOptions];
  const isDateRangeInvalid = Boolean(fromDate) && Boolean(toDate) && fromDate > toDate;

  const showToast = (message: string, tone: ToastItem["tone"] = "success") => {
    const toastId = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id: toastId, message, tone }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== toastId)), 3200);
  };
  const removeToast = (id: number) => setToasts((prev) => prev.filter((toast) => toast.id !== id));

  const loadInsightData = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setIsLoading(true);
      setPageError("");
      const [settingsData, overviewData, trendData, historyData] = await Promise.all([
        aiInsightService.getSettings(),
        aiInsightService.getOverview(fromDate, toDate, focusFilter),
        aiInsightService.getTrendRows(fromDate, toDate),
        aiInsightService.getHistory(),
      ]);
      setSettings(settingsData);
      setOverview(overviewData);
      setTrendRows(trendData);
      setHistoryItems(historyData);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Không thể tải dữ liệu nhận định AI.");
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, [focusFilter, fromDate, toDate]);

  useEffect(() => { void loadInsightData(true); }, [loadInsightData]);
  useEffect(() => { if (!isLoading) void loadInsightData(false); }, [focusFilter, fromDate, isLoading, loadInsightData, toDate]);

  const filteredTrendRows = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    return trendRows.filter((item) => (focusFilter === "All Focus Areas" || item.focus === focusFilter) && (!keyword || item.entity.toLowerCase().includes(keyword) || item.recommendation.toLowerCase().includes(keyword) || item.scoreNote.toLowerCase().includes(keyword) || item.momentumNote.toLowerCase().includes(keyword)));
  }, [focusFilter, searchKeyword, trendRows]);

  const filteredHistory = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    return historyItems.filter((item) => (focusFilter === "All Focus Areas" || item.focus === focusFilter) && (!keyword || item.title.toLowerCase().includes(keyword) || item.summary.toLowerCase().includes(keyword) || item.generatedBy.toLowerCase().includes(keyword)));
  }, [focusFilter, historyItems, searchKeyword]);

  const trendTotalPages = Math.max(1, Math.ceil(filteredTrendRows.length / TREND_PAGE_SIZE));
  const historyTotalPages = Math.max(1, Math.ceil(filteredHistory.length / HISTORY_PAGE_SIZE));
  const paginatedTrendRows = useMemo(() => filteredTrendRows.slice((trendPage - 1) * TREND_PAGE_SIZE, (trendPage - 1) * TREND_PAGE_SIZE + TREND_PAGE_SIZE), [filteredTrendRows, trendPage]);
  const paginatedHistory = useMemo(() => filteredHistory.slice((historyPage - 1) * HISTORY_PAGE_SIZE, (historyPage - 1) * HISTORY_PAGE_SIZE + HISTORY_PAGE_SIZE), [filteredHistory, historyPage]);

  useEffect(() => { setTrendPage(1); setHistoryPage(1); }, [fromDate, toDate, focusFilter, searchKeyword]);
  useEffect(() => { if (trendPage > trendTotalPages) setTrendPage(trendTotalPages); }, [trendPage, trendTotalPages]);
  useEffect(() => { if (historyPage > historyTotalPages) setHistoryPage(historyTotalPages); }, [historyPage, historyTotalPages]);

  const summaryCards = aiInsightService.getSummaryCards(settings, trendRows, historyItems);
  const operationalHighlights = useMemo(() => buildOperationalHighlights(overview), [overview]);

  const selectedHistoryParsedSections = selectedHistoryItem ? parseInsightSections(selectedHistoryItem.detail) : [];
  const selectedHistoryUsesFallback = selectedHistoryItem ? !hasUsefulSections(selectedHistoryParsedSections) : false;
  const selectedHistorySections = selectedHistoryItem ? (selectedHistoryItem.focus === "Executive Summary" || selectedHistoryUsesFallback ? buildFallbackSections(selectedHistoryItem.focus, overview, selectedHistoryItem.summary) : selectedHistoryParsedSections) : [];
  const handleSettingChange = (field: keyof AIInsightSettings, value: string | number | boolean) => {
    const nextValue = field === "confidenceThreshold" ? Math.min(100, Math.max(1, Number(value) || initialSettings.confidenceThreshold)) : value;
    setSettings((prev) => ({ ...prev, [field]: nextValue }));
  };

  const handleGenerateInsight = async () => {
    if (isDateRangeInvalid) {
      showToast("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.", "error");
      return;
    }
    try {
      const newInsight = await aiInsightService.createGeneratedInsight(historyItems, fromDate, toDate, focusFilter, settings, `${fromDate} đến ${toDate}`);
      setHistoryItems((prev) => [newInsight, ...prev]);
      setHistoryPage(1);
      showToast(`Đã tạo bản phân tích ${getFocusLabelVi(newInsight.focus)} cho giai đoạn ${dateRangeLabel}.`, "info");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không thể tạo bản phân tích AI.", "error");
    }
  };

  return (
    <div className="ai-insights-page">
      <PageHeader title="Phân Tích Kinh Doanh Bằng AI" description="AI tổng hợp số liệu từ các màn doanh thu, quảng bá, xu hướng tiêu dùng và vận hành để đưa ra nhận định ngắn gọn, dễ đọc cho admin." />
      {pageError ? <EmptyState title="Không thể tải màn nhận định AI" description={pageError} /> : null}

      <SectionCard title="Tạo Nhận Định AI" description="Chọn kỳ dữ liệu và trọng tâm cần xem. AI sẽ dựa trên các số liệu hiện có của hệ thống để tạo một bản nhận định kinh doanh ngắn gọn." actions={<div className="ai-insights-analysis__actions"><button type="button" className="ai-insights-button ai-insights-button--primary" onClick={() => void handleGenerateInsight()}>Tạo Phân Tích AI</button></div>}>
        <div className="ai-insights-analysis">
          <div className="ai-insights-analysis__grid">
            <label className="ai-insights-analysis__field"><span>Từ ngày</span><input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /><small>Mốc bắt đầu để AI gom số liệu và đánh giá xu hướng.</small></label>
            <label className="ai-insights-analysis__field"><span>Đến ngày</span><input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} /><small>Mốc kết thúc của kỳ phân tích nên thống nhất với các màn báo cáo khác.</small></label>
            <label className="ai-insights-analysis__field"><span>Trọng tâm phân tích</span><select value={focusFilter} onChange={(event) => setFocusFilter(event.target.value as AIInsightFocusFilter)}>{focusSelectOptions.map((option) => <option key={option} value={option}>{getFocusLabelVi(option)}</option>)}</select><small>Có thể xem toàn cảnh hoặc chỉ tập trung vào một nhóm chỉ số cụ thể.</small></label>
            <label className="ai-insights-analysis__field"><span>Giọng điệu khuyến nghị</span><select value={settings.recommendationTone} onChange={(event) => handleSettingChange("recommendationTone", event.target.value)}><option value="Conservative">{toneLabelMap.Conservative}</option><option value="Balanced">{toneLabelMap.Balanced}</option><option value="Aggressive">{toneLabelMap.Aggressive}</option></select><small>Điều chỉnh mức độ thận trọng của phần nhận định và đề xuất.</small></label>
          </div>
          {isDateRangeInvalid ? <p className="ai-insights-analysis__warning">Khoảng thời gian đang không hợp lệ. Hãy đặt Từ ngày nhỏ hơn hoặc bằng Đến ngày trước khi tạo phân tích.</p> : null}
          <div className="ai-insights-analysis__meta">
            <div className="ai-insights-analysis__meta-card"><strong>Kỳ dữ liệu</strong><span>{dateRangeLabel}</span></div>
            <div className="ai-insights-analysis__meta-card"><strong>Trọng tâm đang chọn</strong><span>{getFocusLabelVi(focusFilter)}</span></div>
            <div className="ai-insights-analysis__meta-card"><strong>Giọng điệu nhận định</strong><span>{toneLabelMap[settings.recommendationTone]}</span></div>
            <div className="ai-insights-analysis__meta-card"><strong>Dữ liệu nền</strong><span>{trendRows.length} tín hiệu xu hướng và {historyItems.length} bản phân tích đang có sẵn cho admin đối chiếu.</span></div>
          </div>
        </div>
      </SectionCard>

      <div className="ai-insights-summary-grid">{(overview.summaryCards.length ? overview.summaryCards : summaryCards).map((card) => <SectionCard key={card.title}><StatCard title={card.title} value={card.value} subtitle={card.subtitle} /></SectionCard>)}</div>

      <SectionCard title="Tóm tắt tổng quan điều hành" description="Phần này giải thích ngắn gọn bức tranh kinh doanh, rủi ro vận hành và ưu tiên xử lý trong kỳ dữ liệu đang chọn.">
        {overview.executiveSummary.length === 0 ? <EmptyState title="Chưa có tóm tắt điều hành" description="Khoảng thời gian đã chọn chưa có đủ dữ liệu để tạo phần tóm tắt điều hành rõ ràng." /> : <div className="ai-insights-executive-grid">{overview.executiveSummary.map((line, index) => <article key={`executive-summary-${index}`} className="ai-insights-executive-card"><span className="ai-insights-executive-card__index">{String(index + 1).padStart(2, "0")}</span><div className="ai-insights-executive-card__content"><strong>{executiveSummaryLabels[index] ?? "Ghi chú điều hành"}</strong><p>{line}</p></div></article>)}</div>}
      </SectionCard>

      <div className="ai-insights-business-grid">
        <SectionCard title="Điểm đáng chú ý" description="Các insight vận hành rút ra từ số liệu nền và khuyến nghị AI, giúp admin thấy rõ việc gì đáng theo dõi nhất trong kỳ này."><div className="ai-insights-bullet-grid">{operationalHighlights.length === 0 ? <EmptyState title="Chưa có insight vận hành" description="Khoảng thời gian được chọn chưa có đủ dữ liệu để rút ra các điểm đáng chú ý riêng cho admin." /> : operationalHighlights.map((item) => <article key={item.title} className={`ai-insights-bullet-card ${getInsightToneClass(item.tone)}`}><h4>{item.title}</h4><p>{item.body}</p></article>)}</div></SectionCard>
        <SectionCard title="Đề xuất cho admin" description="Các hướng xử lý hoặc ưu tiên phát triển được AI đề xuất từ số liệu hiện có."><div className="ai-insights-bullet-grid">{overview.recommendations.length === 0 ? <EmptyState title="Chưa có khuyến nghị" description="Hãy tạo thêm dữ liệu hoặc phân tích ở giai đoạn đã chọn để AI đề xuất hành động cụ thể." /> : overview.recommendations.map((item) => <article key={item.title} className={`ai-insights-bullet-card ${getInsightToneClass(item.tone)}`}><h4>{item.title}</h4><p>{item.body}</p></article>)}</div></SectionCard>
      </div>

      <SectionCard title="Số liệu nền cho AI" description="Bảng này giúp đối chiếu nhanh các số liệu chính đứng sau kết luận của AI.">{overview.topRows.length === 0 ? <EmptyState title="Chưa có dữ liệu ảnh chụp nhanh" description="Khoảng thời gian đang chọn chưa có đủ dữ liệu liên kết để tạo ảnh chụp kinh doanh." /> : <div className="ai-insights-overview-list">{overview.topRows.map((item) => <article key={item.label} className="ai-insights-overview-list__item"><span className="ai-insights-overview-list__label">{item.label}</span><strong className="ai-insights-overview-list__value">{item.value}</strong><small className="ai-insights-overview-list__detail">{item.detail}</small></article>)}</div>}</SectionCard>

      <SearchToolbar placeholder="Tìm theo thực thể, khuyến nghị, nội dung phân tích hoặc người tạo" searchValue={searchKeyword} onSearchChange={setSearchKeyword} filterSummaryItems={[getFocusLabelVi(focusFilter)]} />

      <SectionCard title="Bảng tín hiệu xu hướng" description={`${dateRangeLabel} / ${getFocusLabelVi(focusFilter)}. Điểm là mức đánh giá tổng hợp 0-100 theo từng trọng tâm; xu hướng phản ánh tín hiệu đang tốt hơn, đi ngang hay yếu hơn so với mặt bằng cùng nhóm.`}>
        {isLoading ? <EmptyState title="Đang tải điểm xu hướng" description="Đang lấy danh sách chấm điểm xu hướng từ API admin." /> : filteredTrendRows.length === 0 ? <EmptyState title="Không có điểm xu hướng phù hợp" description="Không có dòng chấm điểm xu hướng nào khớp với bộ lọc hiện tại." /> : <><div className="ai-insights-table-wrapper"><table className="ai-insights-table"><thead><tr><th>ID</th><th>Trọng tâm</th><th>Thực thể</th><th>Điểm</th><th>Xu hướng</th><th>Khuyến nghị</th><th>Cập nhật</th></tr></thead><tbody>{paginatedTrendRows.map((item) => <tr key={item.id}><td className="ai-insights-table__cell--compact">#{item.id}</td><td><StatusBadge label={getFocusLabelVi(item.focus)} variant="type" /></td><td>{item.entity}</td><td><div className="ai-insights-table__stack"><strong>{item.score}/100</strong><span>{item.scoreNote}</span></div></td><td><div className="ai-insights-table__stack"><StatusBadge label={momentumLabelMap[item.momentum]} variant={getMomentumVariant(item.momentum)} /><span>{item.momentumNote}</span></div></td><td>{item.recommendation}</td><td>{item.updatedAt}</td></tr>)}</tbody></table></div><div className="ai-insights-pagination"><span className="ai-insights-pagination__info">Trang {trendPage} / {trendTotalPages}</span><div className="ai-insights-pagination__actions"><button type="button" onClick={() => setTrendPage((prev) => Math.max(1, prev - 1))} disabled={trendPage === 1}>Trước</button><button type="button" onClick={() => setTrendPage((prev) => Math.min(trendTotalPages, prev + 1))} disabled={trendPage === trendTotalPages}>Sau</button></div></div></>}
      </SectionCard>

      <SectionCard title="Lịch sử phân tích AI" description={`${dateRangeLabel}. Các bản phân tích đã tạo được lưu tại đây để admin mở xem lại chi tiết khi cần.`}>
        {isLoading ? <EmptyState title="Đang tải lịch sử insight" description="Đang lấy lịch sử insight đã tạo từ API admin." /> : filteredHistory.length === 0 ? <EmptyState title="Chưa có lịch sử insight" description="Các bản tổng hợp AI đã tạo sẽ xuất hiện ở đây." /> : <><div className="ai-insights-table-wrapper"><table className="ai-insights-table ai-insights-table--history"><thead><tr><th>ID</th><th>Tiêu đề</th><th>Trọng tâm</th><th>Được tạo bởi</th><th>Thời gian</th><th>Chi tiết</th></tr></thead><tbody>{paginatedHistory.map((item) => <tr key={item.id}><td className="ai-insights-table__cell--compact">#{item.id}</td><td>{item.title}</td><td><StatusBadge label={getFocusLabelVi(item.focus)} variant="type" /></td><td>{item.generatedBy}</td><td>{item.generatedAt}</td><td className="ai-insights-table__cell--compact"><button type="button" className="ai-insights-button ai-insights-button--secondary ai-insights-button--inline" onClick={() => setSelectedHistoryItem(item)}>Chi tiết</button></td></tr>)}</tbody></table></div><div className="ai-insights-pagination"><span className="ai-insights-pagination__info">Trang {historyPage} / {historyTotalPages}</span><div className="ai-insights-pagination__actions"><button type="button" onClick={() => setHistoryPage((prev) => Math.max(1, prev - 1))} disabled={historyPage === 1}>Trước</button><button type="button" onClick={() => setHistoryPage((prev) => Math.min(historyTotalPages, prev + 1))} disabled={historyPage === historyTotalPages}>Sau</button></div></div></>}
      </SectionCard>

      <BaseModal isOpen={Boolean(selectedHistoryItem)} title={selectedHistoryItem?.title ?? "Chi tiết phân tích AI"} description={selectedHistoryItem ? getFocusLabelVi(selectedHistoryItem.focus) : "Chi tiết phân tích AI"} onClose={() => setSelectedHistoryItem(null)} maxWidth="980px">
        {selectedHistoryItem ? <div className="ai-insights-latest"><div className="ai-insights-latest__header"><div><h3>{selectedHistoryItem.title}</h3><p>{selectedHistoryItem.generatedAt} / {selectedHistoryItem.generatedBy}</p></div><div className="ai-insights-latest__badges"><StatusBadge label={getFocusLabelVi(selectedHistoryItem.focus)} variant="type" /></div></div><div className="ai-insights-detail-meta"><article className="ai-insights-detail-meta__item"><span>Kết luận nhanh</span><strong>{selectedHistoryItem.focus === "Executive Summary" ? (overview.executiveSummary[0] ?? selectedHistoryItem.summary) : selectedHistoryItem.summary}</strong></article><article className="ai-insights-detail-meta__item"><span>Khuyến nghị sử dụng</span><strong>{selectedHistoryUsesFallback ? "Bản lưu này đang được diễn giải lại từ số liệu overview hiện tại để admin đọc nhanh theo từng mục điều hành." : "Nội dung chi tiết bên dưới lấy trực tiếp từ bản phân tích đã lưu và được nhóm theo các mục dễ đọc hơn."}</strong></article></div><div className="ai-insights-detail-sections">{selectedHistorySections.map((section) => <article key={`${selectedHistoryItem.id}-${section.title}`} className="ai-insights-detail-section"><h4>{section.title}</h4><ul>{section.items.map((item, index) => <li key={`${section.title}-${index}`}>{item}</li>)}</ul></article>)}</div></div> : null}
      </BaseModal>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default AIInsightsPage;
