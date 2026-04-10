import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { aiInsightService } from "../services/aiInsightService";
import type {
  AIInsightFocus,
  AIInsightFocusFilter,
  AIInsightHistoryItem,
  AIInsightHistoryStatusFilter,
  AIInsightOverview,
  AIInsightOverviewTone,
  AIInsightSettings,
  AITrendScoreRow,
} from "../types/aiInsight";
import {
  DEFAULT_REPORT_FROM_DATE,
  DEFAULT_REPORT_TO_DATE,
  formatDateRangeLabel,
} from "../utils/dateRange";
import "./AIInsightsPage.css";

const TREND_PAGE_SIZE = 5;
const HISTORY_PAGE_SIZE = 5;

const defaultFocusOptions: AIInsightFocus[] = [
  "Executive Summary",
  "Placement Performance",
  "Promotion Watchlist",
  "Revenue Signals",
  "Customer Spending",
  "Operator Load",
];

const statusFilterOptions: AIInsightHistoryStatusFilter[] = [
  "All Statuses",
  "Generated",
  "Needs Review",
  "Archived",
];

const initialSettings: AIInsightSettings = {
  autoDailySummary: true,
  anomalyAlerts: true,
  operatorDigest: false,
  recommendationTone: "Balanced",
  confidenceThreshold: 78,
  promptVersion: "gm-admin-v1.4",
  reviewMode: "Required",
};

const initialOverview: AIInsightOverview = {
  summaryCards: [],
  highlightCards: [],
  recommendations: [],
  topRows: [],
  availableFocuses: defaultFocusOptions,
};

const focusLabelMap: Record<AIInsightFocusFilter, string> = {
  "All Focus Areas": "Tất cả trọng tâm",
  "Executive Summary": "Tổng quan điều hành",
  "Placement Performance": "Hiệu quả vị trí hiển thị",
  "Promotion Watchlist": "Danh sách khuyến mãi cần theo dõi",
  "Revenue Signals": "Tín hiệu doanh thu",
  "Customer Spending": "Chi tiêu khách hàng",
  "Operator Load": "Khối lượng vận hành",
};

const statusLabelMap: Record<AIInsightHistoryStatusFilter, string> = {
  "All Statuses": "Tất cả trạng thái",
  Generated: "Đã tạo",
  "Needs Review": "Cần duyệt",
  Archived: "Lưu trữ",
};

const toneLabelMap: Record<AIInsightSettings["recommendationTone"], string> = {
  Conservative: "Thận trọng",
  Balanced: "Cân bằng",
  Aggressive: "Tăng trưởng mạnh",
};

const reviewModeLabelMap: Record<AIInsightSettings["reviewMode"], string> = {
  Required: "Bắt buộc duyệt",
  Optional: "Duyệt tùy chọn",
};

const momentumLabelMap: Record<AITrendScoreRow["momentum"], string> = {
  Up: "Tăng",
  Stable: "Ổn định",
  Down: "Giảm",
};

const getMomentumVariant = (momentum: AITrendScoreRow["momentum"]) => {
  if (momentum === "Up") return "positive";
  if (momentum === "Stable") return "processing";
  return "negative";
};

const getHistoryStatusVariant = (status: AIInsightHistoryItem["status"]) => {
  if (status === "Generated") return "success";
  if (status === "Needs Review") return "pending";
  return "disabled";
};

const getInsightToneClass = (tone: AIInsightOverviewTone) => {
  if (tone === "positive") return "ai-insights-bullet-card--positive";
  if (tone === "warning") return "ai-insights-bullet-card--warning";
  return "ai-insights-bullet-card--neutral";
};

const getFocusLabelVi = (focus: AIInsightFocusFilter) => focusLabelMap[focus];
const getStatusLabelVi = (status: AIInsightHistoryStatusFilter) =>
  statusLabelMap[status];
const getToneLabelVi = (tone: AIInsightSettings["recommendationTone"]) =>
  toneLabelMap[tone];
const getReviewModeLabelVi = (mode: AIInsightSettings["reviewMode"]) =>
  reviewModeLabelMap[mode];
const getMomentumLabelVi = (momentum: AITrendScoreRow["momentum"]) =>
  momentumLabelMap[momentum];

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
  const [focusFilter, setFocusFilter] =
    useState<AIInsightFocusFilter>("All Focus Areas");
  const [statusFilter, setStatusFilter] =
    useState<AIInsightHistoryStatusFilter>("All Statuses");
  const [trendPage, setTrendPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dateRangeLabel = formatDateRangeLabel(fromDate, toDate);
  const focusOptions = overview.availableFocuses.length
    ? overview.availableFocuses
    : defaultFocusOptions;
  const focusSelectOptions: AIInsightFocusFilter[] = [
    "All Focus Areas",
    ...focusOptions,
  ];
  const isDateRangeInvalid =
    Boolean(fromDate) && Boolean(toDate) && fromDate > toDate;

  const showToast = (message: string, tone: ToastItem["tone"] = "success") => {
    const toastId = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id: toastId, message, tone }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
    }, 3200);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const loadInsightData = async (showLoader = false) => {
    try {
      if (showLoader) {
        setIsLoading(true);
      }

      setPageError("");
      const [settingsData, overviewData, trendData, historyData] =
        await Promise.all([
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
      setPageError(
        error instanceof Error
          ? error.message
          : "Không thể tải dữ liệu AI Insights.",
      );
    } finally {
      if (showLoader) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadInsightData(true);
  }, []);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    void loadInsightData(false);
  }, [fromDate, toDate, focusFilter]);

  const filteredTrendRows = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return trendRows.filter((item) => {
      const matchesFocus =
        focusFilter === "All Focus Areas" || item.focus === focusFilter;
      const matchesKeyword =
        !keyword ||
        item.entity.toLowerCase().includes(keyword) ||
        item.recommendation.toLowerCase().includes(keyword) ||
        item.owner.toLowerCase().includes(keyword);

      return matchesFocus && matchesKeyword;
    });
  }, [focusFilter, searchKeyword, trendRows]);

  const filteredHistory = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return historyItems.filter((item) => {
      const matchesFocus =
        focusFilter === "All Focus Areas" || item.focus === focusFilter;
      const matchesStatus =
        statusFilter === "All Statuses" || item.status === statusFilter;
      const matchesKeyword =
        !keyword ||
        item.title.toLowerCase().includes(keyword) ||
        item.summary.toLowerCase().includes(keyword) ||
        item.generatedBy.toLowerCase().includes(keyword);

      return matchesFocus && matchesStatus && matchesKeyword;
    });
  }, [focusFilter, historyItems, searchKeyword, statusFilter]);

  const trendTotalPages = Math.max(
    1,
    Math.ceil(filteredTrendRows.length / TREND_PAGE_SIZE),
  );
  const historyTotalPages = Math.max(
    1,
    Math.ceil(filteredHistory.length / HISTORY_PAGE_SIZE),
  );

  const paginatedTrendRows = useMemo(() => {
    const startIndex = (trendPage - 1) * TREND_PAGE_SIZE;
    return filteredTrendRows.slice(startIndex, startIndex + TREND_PAGE_SIZE);
  }, [filteredTrendRows, trendPage]);

  const paginatedHistory = useMemo(() => {
    const startIndex = (historyPage - 1) * HISTORY_PAGE_SIZE;
    return filteredHistory.slice(startIndex, startIndex + HISTORY_PAGE_SIZE);
  }, [filteredHistory, historyPage]);

  useEffect(() => {
    setTrendPage(1);
    setHistoryPage(1);
  }, [fromDate, toDate, focusFilter, statusFilter, searchKeyword]);

  useEffect(() => {
    if (trendPage > trendTotalPages) {
      setTrendPage(trendTotalPages);
    }
  }, [trendPage, trendTotalPages]);

  useEffect(() => {
    if (historyPage > historyTotalPages) {
      setHistoryPage(historyTotalPages);
    }
  }, [historyPage, historyTotalPages]);

  const summaryCards = aiInsightService.getSummaryCards(
    settings,
    trendRows,
    historyItems,
  );
  const latestInsightPreview = historyItems[0] ?? null;

  const handleSettingChange = (
    field: keyof AIInsightSettings,
    value: string | number | boolean,
  ) => {
    const nextValue =
      field === "confidenceThreshold"
        ? Math.min(
            100,
            Math.max(1, Number(value) || initialSettings.confidenceThreshold),
          )
        : value;

    setSettings((prev) => ({
      ...prev,
      [field]: nextValue,
    }));
  };

  const handleSaveSettings = async () => {
    if (isDateRangeInvalid) {
      showToast("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.", "error");
      return;
    }

    try {
      const nextSettings = await aiInsightService.updateSettings(settings);
      setSettings(nextSettings);
      showToast(
        `Đã lưu cấu hình AI. Ngưỡng tin cậy hiện tại là ${nextSettings.confidenceThreshold}.`,
      );
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Không thể lưu cấu hình gợi ý AI.",
        "error",
      );
    }
  };

  const handleGenerateInsight = async () => {
    if (isDateRangeInvalid) {
      showToast("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.", "error");
      return;
    }

    const generatedAt = `${fromDate} đến ${toDate}`;

    try {
      const newInsight = await aiInsightService.createGeneratedInsight(
        historyItems,
        fromDate,
        toDate,
        focusFilter,
        settings,
        generatedAt,
      );

      setHistoryItems((prev) => [newInsight, ...prev]);
      setHistoryPage(1);
      showToast(
        `Đã tạo bản tóm tắt ${getFocusLabelVi(newInsight.focus)} cho giai đoạn ${dateRangeLabel}.`,
        "info",
      );
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Không thể tạo bản phân tích AI.",
        "error",
      );
    }
  };

  return (
    <div className="ai-insights-page">
      <PageHeader
        title="Đánh Giá Kinh Doanh Bằng AI"
        description="Phân tích GreenMarket theo khoảng thời gian, tổng hợp chỉ số quan trọng, rút ra nhận định và đề xuất hướng tăng trưởng."
        actionLabel="Tải lại phân tích"
        onActionClick={() => void loadInsightData(true)}
      />

      {pageError ? (
        <EmptyState
          title="Không thể tải màn đánh giá AI"
          description={pageError}
        />
      ) : null}

      <SectionCard
        title="Khu Vực Phân Tích"
        description="Chọn khoảng thời gian và trọng tâm phân tích trước. Sau đó xem tín hiệu kinh doanh bên dưới hoặc tạo bản tổng hợp AI mới."
        actions={
          <div className="ai-insights-analysis__actions">
            <button
              type="button"
              className="ai-insights-button ai-insights-button--secondary"
              onClick={() => void handleGenerateInsight()}
            >
              Tạo Bản Tổng Hợp AI
            </button>
            <button
              type="button"
              className="ai-insights-button ai-insights-button--primary"
              onClick={() => void handleSaveSettings()}
            >
              Lưu Cấu Hình AI
            </button>
          </div>
        }
      >
        <div className="ai-insights-analysis">
          <div className="ai-insights-analysis__grid">
            <label className="ai-insights-analysis__field">
              <span>Từ ngày</span>
              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
              />
              <small>
                Mốc bắt đầu để AI gom dữ liệu, phân tích xu hướng và đưa ra gợi ý.
              </small>
            </label>

            <label className="ai-insights-analysis__field">
              <span>Đến ngày</span>
              <input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
              />
              <small>
                Mốc kết thúc của kỳ phân tích. Nên giữ đồng nhất với Analytics và Revenue khi đối chiếu dữ liệu.
              </small>
            </label>

            <label className="ai-insights-analysis__field">
              <span>Trọng tâm phân tích</span>
              <select
                value={focusFilter}
                onChange={(event) =>
                  setFocusFilter(event.target.value as AIInsightFocusFilter)
                }
              >
                {focusSelectOptions.map((option) => (
                  <option key={option} value={option}>
                    {getFocusLabelVi(option)}
                  </option>
                ))}
              </select>
              <small>
                Chọn Tất cả trọng tâm để có báo cáo tổng thể GreenMarket, hoặc thu hẹp vào một mảng nghiệp vụ cụ thể.
              </small>
            </label>

            <label className="ai-insights-analysis__field">
              <span>Giọng điệu khuyến nghị</span>
              <select
                value={settings.recommendationTone}
                onChange={(event) =>
                  handleSettingChange("recommendationTone", event.target.value)
                }
              >
                <option value="Conservative">{getToneLabelVi("Conservative")}</option>
                <option value="Balanced">{getToneLabelVi("Balanced")}</option>
                <option value="Aggressive">{getToneLabelVi("Aggressive")}</option>
              </select>
              <small>
                Điều chỉnh mức độ thận trọng hay quyết liệt của các đề xuất tăng trưởng.
              </small>
            </label>
          </div>

          {isDateRangeInvalid ? (
            <p className="ai-insights-analysis__warning">
              Khoảng thời gian đang không hợp lệ. Hãy đặt Từ ngày nhỏ hơn hoặc bằng Đến ngày trước khi lưu hoặc tạo báo cáo.
            </p>
          ) : null}

          <div className="ai-insights-analysis__meta">
            <div className="ai-insights-analysis__meta-card">
              <strong>Khoảng phân tích</strong>
              <span>{dateRangeLabel}</span>
            </div>
            <div className="ai-insights-analysis__meta-card">
              <strong>Ngưỡng cảnh báo</strong>
              <span>{settings.confidenceThreshold}/100 ngưỡng tin cậy</span>
            </div>
            <div className="ai-insights-analysis__meta-card">
              <strong>Chế độ duyệt</strong>
              <span>{getReviewModeLabelVi(settings.reviewMode)} trước khi áp dụng</span>
            </div>
            <div className="ai-insights-analysis__meta-card">
              <strong>Cách dùng màn này</strong>
              <span>
                Chọn khoảng thời gian, xem các tín hiệu kinh doanh bên dưới, rồi tạo một bản đánh giá AI ngắn gọn cho giai đoạn đó.
              </span>
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="ai-insights-summary-grid">
        {(overview.summaryCards.length
          ? overview.summaryCards
          : summaryCards
        ).map((card) => (
          <SectionCard key={card.title}>
            <StatCard
              title={card.title}
              value={card.value}
              subtitle={card.subtitle}
            />
          </SectionCard>
        ))}
      </div>

      <div className="ai-insights-business-grid">
        <SectionCard
          title="Điểm Quan Trọng Trong Giai Đoạn Này"
          description="Màn AI ưu tiên hiển thị tín hiệu kinh doanh trực tiếp, thay vì chỉ có phần cấu hình."
        >
          <div className="ai-insights-bullet-grid">
            {overview.highlightCards.length === 0 ? (
              <EmptyState
                title="Chưa có tín hiệu kinh doanh"
                description="Khoảng thời gian được chọn chưa có đủ dữ liệu để tạo điểm nhấn phân tích."
              />
            ) : (
              overview.highlightCards.map((item) => (
                <article
                  key={item.title}
                  className={`ai-insights-bullet-card ${getInsightToneClass(
                    item.tone,
                  )}`}
                >
                  <h4>{item.title}</h4>
                  <p>{item.body}</p>
                </article>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Hành Động Tăng Trưởng Được Đề Xuất"
          description="Đây là các bước hành động được AI đề xuất dựa trên dữ liệu GreenMarket trong giai đoạn hiện tại."
        >
          <div className="ai-insights-bullet-grid">
            {overview.recommendations.length === 0 ? (
              <EmptyState
                title="Chưa có khuyến nghị"
                description="Hãy tạo thêm dữ liệu hoặc phân tích ở giai đoạn đã chọn để AI đề xuất hành động cụ thể."
              />
            ) : (
              overview.recommendations.map((item) => (
                <article
                  key={item.title}
                  className={`ai-insights-bullet-card ${getInsightToneClass(
                    item.tone,
                  )}`}
                >
                  <h4>{item.title}</h4>
                  <p>{item.body}</p>
                </article>
              ))
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Bản Tóm Tắt AI Mới Nhất"
        description="Đây là bản đánh giá kinh doanh AI mới nhất cho khoảng thời gian đang chọn. Nên đọc phần này trước khi xem toàn bộ lịch sử."
      >
        {latestInsightPreview ? (
          <div className="ai-insights-latest">
            <div className="ai-insights-latest__header">
              <div>
                <h3>{latestInsightPreview.title}</h3>
                <p>
                  {latestInsightPreview.generatedAt} /{" "}
                  {latestInsightPreview.generatedBy}
                </p>
              </div>
              <div className="ai-insights-latest__badges">
                <StatusBadge label={getFocusLabelVi(latestInsightPreview.focus)} variant="type" />
                <StatusBadge
                  label={getStatusLabelVi(latestInsightPreview.status)}
                  variant={getHistoryStatusVariant(latestInsightPreview.status)}
                />
              </div>
            </div>

            <div className="ai-insights-latest__body">
              {latestInsightPreview.summary
                .split("\n")
                .filter((line) => line.trim().length > 0)
                .map((line, index) => (
                  <p key={`${latestInsightPreview.id}-${index}`}>{line}</p>
                ))}
            </div>
          </div>
        ) : (
          <EmptyState
            title="Chưa có bản tóm tắt nào"
            description="Hãy tạo bản tổng hợp AI để sinh ra một bản đánh giá kinh doanh GreenMarket theo mốc thời gian."
          />
        )}
      </SectionCard>

      <SectionCard
        title="Ảnh Chụp Nhanh Tình Hình Kinh Doanh"
        description="Dùng bảng này để kiểm tra nhanh các thực thể và số liệu đứng sau kết luận của AI."
      >
        {overview.topRows.length === 0 ? (
          <EmptyState
            title="Chưa có dữ liệu ảnh chụp nhanh"
            description="Khoảng thời gian đang chọn chưa có đủ dữ liệu liên kết để tạo ảnh chụp kinh doanh."
          />
        ) : (
          <div className="ai-insights-overview-list">
            {overview.topRows.map((item) => (
              <article key={item.label} className="ai-insights-overview-list__item">
                <span className="ai-insights-overview-list__label">
                  {item.label}
                </span>
                <strong className="ai-insights-overview-list__value">
                  {item.value}
                </strong>
                <small className="ai-insights-overview-list__detail">
                  {item.detail}
                </small>
              </article>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Cấu Hình Gợi Ý AI"
        description="Các tùy chọn này ảnh hưởng đến cách AI trình bày nội dung phân tích và đề xuất."
      >
        <div className="ai-insights-settings">
          <div className="ai-insights-settings__toggles">
            <label className="ai-insights-settings__toggle">
              <div>
                <strong>Tóm tắt tự động hằng ngày</strong>
                <span>Tự động tạo bản tóm tắt cho admin mỗi sáng.</span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoDailySummary}
                onChange={(event) =>
                  handleSettingChange("autoDailySummary", event.target.checked)
                }
              />
            </label>

            <label className="ai-insights-settings__toggle">
              <div>
                <strong>Cảnh báo bất thường</strong>
                <span>Cảnh báo khi có dấu hiệu bất thường về khuyến mãi hoặc doanh thu.</span>
              </div>
              <input
                type="checkbox"
                checked={settings.anomalyAlerts}
                onChange={(event) =>
                  handleSettingChange("anomalyAlerts", event.target.checked)
                }
              />
            </label>

            <label className="ai-insights-settings__toggle">
              <div>
                <strong>Tóm tắt cho vận hành</strong>
                <span>Đưa ghi chú khối lượng vận hành vào bản tổng hợp được tạo.</span>
              </div>
              <input
                type="checkbox"
                checked={settings.operatorDigest}
                onChange={(event) =>
                  handleSettingChange("operatorDigest", event.target.checked)
                }
              />
            </label>
          </div>

          <div className="ai-insights-settings__grid">
            <div className="ai-insights-settings__field">
              <label htmlFor="ai-review-mode">Chế độ duyệt</label>
              <select
                id="ai-review-mode"
                value={settings.reviewMode}
                onChange={(event) =>
                  handleSettingChange("reviewMode", event.target.value)
                }
              >
                <option value="Required">{getReviewModeLabelVi("Required")}</option>
                <option value="Optional">{getReviewModeLabelVi("Optional")}</option>
              </select>
              <small>
                Chọn xem mọi bản tổng hợp AI có cần admin duyệt trước khi xem là kết luận chính thức hay không.
              </small>
            </div>

            <div className="ai-insights-settings__field">
              <label htmlFor="ai-confidence-threshold">Ngưỡng tin cậy</label>
              <input
                id="ai-confidence-threshold"
                type="number"
                min={1}
                max={100}
                value={settings.confidenceThreshold}
                onChange={(event) =>
                  handleSettingChange(
                    "confidenceThreshold",
                    Number(event.target.value),
                  )
                }
              />
              <small>
                Giá trị hợp lệ từ 1 đến 100. Số càng cao thì AI càng thận trọng khi kết luận đó là tín hiệu mạnh.
              </small>
            </div>

            <div className="ai-insights-settings__field">
              <label htmlFor="ai-prompt-version">Phiên bản prompt</label>
              <input
                id="ai-prompt-version"
                type="text"
                value={settings.promptVersion}
                onChange={(event) =>
                  handleSettingChange("promptVersion", event.target.value)
                }
              />
              <small>
                Dùng để đánh dấu phiên bản chiến lược prompt khi bạn muốn so sánh các cách đánh giá AI theo thời gian.
              </small>
            </div>
          </div>
        </div>
      </SectionCard>

      <SearchToolbar
        placeholder="Tìm theo thực thể, khuyến nghị, nội dung tóm tắt hoặc người tạo"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
        filterSummaryItems={[
          getFocusLabelVi(focusFilter),
          getStatusLabelVi(statusFilter),
        ]}
      />

      <SectionCard
        title="Báo Cáo Chấm Điểm Xu Hướng"
        description={`${dateRangeLabel} / ${getFocusLabelVi(focusFilter)}`}
      >
        {isLoading ? (
          <EmptyState
            title="Đang tải điểm xu hướng"
            description="Đang lấy danh sách chấm điểm xu hướng từ API admin."
          />
        ) : filteredTrendRows.length === 0 ? (
          <EmptyState
            title="Không có điểm xu hướng phù hợp"
            description="Không có dòng chấm điểm xu hướng nào khớp với bộ lọc hiện tại."
          />
        ) : (
          <>
            <div className="ai-insights-table-wrapper">
              <table className="ai-insights-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Trọng tâm</th>
                    <th>Thực thể</th>
                    <th>Điểm</th>
                    <th>Xu hướng</th>
                    <th>Khuyến nghị</th>
                    <th>Người phụ trách</th>
                    <th>Cập nhật</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedTrendRows.map((item) => (
                    <tr key={item.id}>
                      <td>#{item.id}</td>
                      <td>
                        <StatusBadge label={getFocusLabelVi(item.focus)} variant="type" />
                      </td>
                      <td>{item.entity}</td>
                      <td>{item.score}</td>
                      <td>
                        <StatusBadge
                          label={getMomentumLabelVi(item.momentum)}
                          variant={getMomentumVariant(item.momentum)}
                        />
                      </td>
                      <td>{item.recommendation}</td>
                      <td>{item.owner}</td>
                      <td>{item.updatedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ai-insights-pagination">
              <span className="ai-insights-pagination__info">
                Trang {trendPage} / {trendTotalPages}
              </span>

              <div className="ai-insights-pagination__actions">
                <button
                  type="button"
                  onClick={() => setTrendPage((prev) => Math.max(1, prev - 1))}
                  disabled={trendPage === 1}
                >
                  Trước
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setTrendPage((prev) => Math.min(trendTotalPages, prev + 1))
                  }
                  disabled={trendPage === trendTotalPages}
                >
                  Sau
                </button>
              </div>
            </div>
          </>
        )}
      </SectionCard>

      <SectionCard
        title="Lịch Sử Insight Gần Đây"
        description={`${dateRangeLabel} / ${getStatusLabelVi(statusFilter)}`}
        actions={
          <select
            className="ai-insights-history-filter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as AIInsightHistoryStatusFilter)
            }
          >
            {statusFilterOptions.map((option) => (
              <option key={option} value={option}>
                {getStatusLabelVi(option)}
              </option>
            ))}
          </select>
        }
      >
        {isLoading ? (
          <EmptyState
            title="Đang tải lịch sử insight"
            description="Đang lấy lịch sử insight đã tạo từ API admin."
          />
        ) : filteredHistory.length === 0 ? (
          <EmptyState
            title="Chưa có lịch sử insight"
            description="Các bản tổng hợp AI đã tạo sẽ xuất hiện ở đây."
          />
        ) : (
          <>
            <div className="ai-insights-table-wrapper">
              <table className="ai-insights-table ai-insights-table--history">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tiêu đề</th>
                    <th>Trọng tâm</th>
                    <th>Tóm tắt</th>
                    <th>Được tạo bởi</th>
                    <th>Trạng thái</th>
                    <th>Thời gian</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedHistory.map((item) => (
                    <tr key={item.id}>
                      <td>#{item.id}</td>
                      <td>{item.title}</td>
                      <td>
                        <StatusBadge label={getFocusLabelVi(item.focus)} variant="type" />
                      </td>
                      <td>{item.summary}</td>
                      <td>{item.generatedBy}</td>
                      <td>
                        <StatusBadge
                          label={getStatusLabelVi(item.status)}
                          variant={getHistoryStatusVariant(item.status)}
                        />
                      </td>
                      <td>{item.generatedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ai-insights-pagination">
              <span className="ai-insights-pagination__info">
                Trang {historyPage} / {historyTotalPages}
              </span>

              <div className="ai-insights-pagination__actions">
                <button
                  type="button"
                  onClick={() =>
                    setHistoryPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={historyPage === 1}
                >
                  Trước
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setHistoryPage((prev) =>
                      Math.min(historyTotalPages, prev + 1),
                    )
                  }
                  disabled={historyPage === historyTotalPages}
                >
                  Sau
                </button>
              </div>
            </div>
          </>
        )}
      </SectionCard>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default AIInsightsPage;
