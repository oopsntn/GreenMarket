import { useCallback, useEffect, useMemo, useState } from "react";
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

  const loadInsightData = useCallback(async (showLoader = false) => {
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
  }, [focusFilter, fromDate, toDate]);

  useEffect(() => {
    void loadInsightData(true);
  }, [loadInsightData]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    void loadInsightData(false);
  }, [focusFilter, fromDate, isLoading, loadInsightData, toDate]);

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
        `Đã tạo bản phân tích ${getFocusLabelVi(newInsight.focus)} cho giai đoạn ${dateRangeLabel}.`,
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
        title="Phân Tích Kinh Doanh Bằng AI"
        description="AI tổng hợp số liệu từ các màn doanh thu, gói quảng bá, xu hướng tiêu dùng và vận hành để đưa ra nhận định ngắn gọn, dễ đọc cho admin."
        actionLabel="Tải lại dữ liệu"
        onActionClick={() => void loadInsightData(true)}
      />

      {pageError ? (
        <EmptyState
          title="Không thể tải màn đánh giá AI"
          description={pageError}
        />
      ) : null}

      <SectionCard
        title="Tạo Nhận Định AI"
        description="Chọn kỳ dữ liệu và trọng tâm cần xem. AI sẽ dựa trên các số liệu hiện có của hệ thống để tạo một bản nhận định kinh doanh ngắn gọn."
        actions={
          <div className="ai-insights-analysis__actions">
            <button
              type="button"
              className="ai-insights-button ai-insights-button--primary"
              onClick={() => void handleGenerateInsight()}
            >
              Tạo Phân Tích AI
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
                Mốc bắt đầu để AI gom số liệu và đánh giá xu hướng.
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
                Mốc kết thúc của kỳ phân tích nên thống nhất với các màn báo cáo khác.
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
                Có thể xem toàn cảnh hoặc chỉ tập trung vào một nhóm chỉ số cụ thể.
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
                Điều chỉnh mức độ thận trọng của phần nhận định và đề xuất.
              </small>
            </label>
          </div>

          {isDateRangeInvalid ? (
            <p className="ai-insights-analysis__warning">
              Khoảng thời gian đang không hợp lệ. Hãy đặt Từ ngày nhỏ hơn hoặc bằng Đến ngày trước khi tạo phân tích.
            </p>
          ) : null}

          <div className="ai-insights-analysis__meta">
            <div className="ai-insights-analysis__meta-card">
              <strong>Kỳ dữ liệu</strong>
              <span>{dateRangeLabel}</span>
            </div>
            <div className="ai-insights-analysis__meta-card">
              <strong>Trọng tâm đang chọn</strong>
              <span>{getFocusLabelVi(focusFilter)}</span>
            </div>
            <div className="ai-insights-analysis__meta-card">
              <strong>Giọng điệu nhận định</strong>
              <span>{getToneLabelVi(settings.recommendationTone)}</span>
            </div>
            <div className="ai-insights-analysis__meta-card">
              <strong>Dữ liệu nền</strong>
              <span>
                {trendRows.length} tín hiệu xu hướng và {historyItems.length} bản phân tích đang có sẵn cho admin đối chiếu.
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
          title="Điểm Đáng Chú Ý"
          description="Các tín hiệu kinh doanh nổi bật mà admin nên đọc trước trong kỳ dữ liệu đang chọn."
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
          title="Đề Xuất Cho Admin"
          description="Các hướng xử lý hoặc ưu tiên phát triển được AI đề xuất từ số liệu hiện có."
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
        title="Bản Phân Tích AI Mới Nhất"
        description="Đây là bản nhận định mới nhất để admin xem nhanh trước khi xuống phần lịch sử."
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
        title="Số Liệu Nền Cho AI"
        description="Bảng này giúp đối chiếu nhanh các số liệu chính đứng sau kết luận của AI."
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

      <SearchToolbar
        placeholder="Tìm theo thực thể, khuyến nghị, nội dung phân tích hoặc người tạo"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
        filterSummaryItems={[
          getFocusLabelVi(focusFilter),
          getStatusLabelVi(statusFilter),
        ]}
      />

      <SectionCard
        title="Bảng Tín Hiệu Xu Hướng"
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
        title="Lịch Sử Phân Tích AI"
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
