import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/EmptyState";
import FilterBar from "../components/FilterBar";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { aiInsightService } from "../services/aiInsightService";
import type {
  AIInsightFocusFilter,
  AIInsightHistoryItem,
  AIInsightHistoryStatusFilter,
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

const focusFilterOptions: AIInsightFocusFilter[] = [
  "All Focus Areas",
  "Placement Performance",
  "Promotion Watchlist",
  "Revenue Signals",
  "Operator Load",
];

const statusFilterOptions: AIInsightHistoryStatusFilter[] = [
  "All Statuses",
  "Generated",
  "Needs Review",
  "Archived",
];

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

function AIInsightsPage() {
  const [settings, setSettings] = useState<AIInsightSettings>(
    aiInsightService.getSettings(),
  );
  const [trendRows] = useState(aiInsightService.getTrendRows());
  const [historyItems, setHistoryItems] = useState(aiInsightService.getHistory());
  const [fromDate, setFromDate] = useState(DEFAULT_REPORT_FROM_DATE);
  const [toDate, setToDate] = useState(DEFAULT_REPORT_TO_DATE);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [focusFilter, setFocusFilter] =
    useState<AIInsightFocusFilter>("All Focus Areas");
  const [statusFilter, setStatusFilter] =
    useState<AIInsightHistoryStatusFilter>("All Statuses");
  const [trendPage, setTrendPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dateRangeLabel = formatDateRangeLabel(fromDate, toDate);

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

  const showToast = (message: string, tone: ToastItem["tone"] = "success") => {
    const toastId = Date.now() + Math.random();

    setToasts((prev) => [...prev, { id: toastId, message, tone }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
    }, 2600);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const handleSettingChange = (
    field: keyof AIInsightSettings,
    value: string | number | boolean,
  ) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveSettings = () => {
    const nextSettings = aiInsightService.updateSettings(settings);
    setSettings(nextSettings);
    showToast(
      `AI recommendation settings saved for ${settings.promptVersion}.`,
    );
  };

  const handleGenerateInsight = () => {
    const generatedAt = `${fromDate} to ${toDate}`;
    const newInsight = aiInsightService.createGeneratedInsight(
      historyItems,
      focusFilter,
      settings.recommendationTone,
      generatedAt,
    );

    setHistoryItems((prev) => [newInsight, ...prev]);
    setHistoryPage(1);
    showToast(
      `Generated ${newInsight.focus.toLowerCase()} summary for ${dateRangeLabel}.`,
      "info",
    );
  };

  return (
    <div className="ai-insights-page">
      <PageHeader
        title="AI Insights & Recommendation Settings"
        description="Manage AI recommendation controls, review trend scoring, and track generated admin insight summaries."
        actionLabel="Save AI Settings"
        onActionClick={handleSaveSettings}
      />

      <div className="ai-insights-summary-grid">
        {summaryCards.map((card) => (
          <SectionCard key={card.title}>
            <StatCard
              title={card.title}
              value={card.value}
              subtitle={card.subtitle}
            />
          </SectionCard>
        ))}
      </div>

      <SectionCard
        title="AI Recommendation Controls"
        description="Adjust how admin-side insight summaries are generated and reviewed."
      >
        <div className="ai-insights-settings">
          <div className="ai-insights-settings__toggles">
            <label className="ai-insights-settings__toggle">
              <div>
                <strong>Auto Daily Summary</strong>
                <span>Generate the admin digest every morning.</span>
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
                <strong>Anomaly Alerts</strong>
                <span>Raise alerts on unusual promotion or revenue behavior.</span>
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
                <strong>Operator Digest</strong>
                <span>Include operational load notes in generated summaries.</span>
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
              <label htmlFor="ai-tone">Recommendation Tone</label>
              <select
                id="ai-tone"
                value={settings.recommendationTone}
                onChange={(event) =>
                  handleSettingChange("recommendationTone", event.target.value)
                }
              >
                <option>Conservative</option>
                <option>Balanced</option>
                <option>Aggressive</option>
              </select>
            </div>

            <div className="ai-insights-settings__field">
              <label htmlFor="ai-review-mode">Review Mode</label>
              <select
                id="ai-review-mode"
                value={settings.reviewMode}
                onChange={(event) =>
                  handleSettingChange("reviewMode", event.target.value)
                }
              >
                <option>Required</option>
                <option>Optional</option>
              </select>
            </div>

            <div className="ai-insights-settings__field">
              <label htmlFor="ai-confidence-threshold">
                Confidence Threshold
              </label>
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
            </div>

            <div className="ai-insights-settings__field">
              <label htmlFor="ai-prompt-version">Prompt Version</label>
              <input
                id="ai-prompt-version"
                type="text"
                value={settings.promptVersion}
                onChange={(event) =>
                  handleSettingChange("promptVersion", event.target.value)
                }
              />
            </div>
          </div>

          <div className="ai-insights-settings__actions">
            <button
              type="button"
              className="ai-insights-settings__secondary"
              onClick={handleGenerateInsight}
            >
              Generate Insight Summary
            </button>
            <button
              type="button"
              className="ai-insights-settings__primary"
              onClick={handleSaveSettings}
            >
              Save Controls
            </button>
          </div>
        </div>
      </SectionCard>

      <SearchToolbar
        placeholder="Search by entity, recommendation, summary, or owner"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
        onFilterClick={() => setShowFilters((prev) => !prev)}
        filterLabel="Filter insights"
        filterSummaryItems={[focusFilter, statusFilter]}
      />

      {showFilters ? (
        <SectionCard
          title="Insight Window Filters"
          description="Narrow the reporting window, focus area, and history status."
        >
          <FilterBar
            fields={[
              {
                id: "ai-from-date",
                label: "From Date",
                type: "date",
                value: fromDate,
                onChange: setFromDate,
              },
              {
                id: "ai-to-date",
                label: "To Date",
                type: "date",
                value: toDate,
                onChange: setToDate,
              },
              {
                id: "ai-focus-filter",
                label: "Focus Area",
                type: "select",
                value: focusFilter,
                onChange: (value) =>
                  setFocusFilter(value as AIInsightFocusFilter),
                options: focusFilterOptions,
              },
              {
                id: "ai-status-filter",
                label: "History Status",
                type: "select",
                value: statusFilter,
                onChange: (value) =>
                  setStatusFilter(value as AIInsightHistoryStatusFilter),
                options: statusFilterOptions,
              },
            ]}
          />
        </SectionCard>
      ) : null}

      <SectionCard
        title="Trend Scoring Report"
        description={`${dateRangeLabel} • ${focusFilter}`}
      >
        {filteredTrendRows.length === 0 ? (
          <EmptyState
            title="No trend scores found"
            description="No trend-scoring rows match the current insight filters."
          />
        ) : (
          <>
            <div className="ai-insights-table-wrapper">
              <table className="ai-insights-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Focus</th>
                    <th>Entity</th>
                    <th>Score</th>
                    <th>Momentum</th>
                    <th>Recommendation</th>
                    <th>Owner</th>
                    <th>Updated</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedTrendRows.map((item) => (
                    <tr key={item.id}>
                      <td>#{item.id}</td>
                      <td>
                        <StatusBadge label={item.focus} variant="type" />
                      </td>
                      <td>{item.entity}</td>
                      <td>{item.score}</td>
                      <td>
                        <StatusBadge
                          label={item.momentum}
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
                Page {trendPage} of {trendTotalPages}
              </span>

              <div className="ai-insights-pagination__actions">
                <button
                  type="button"
                  onClick={() => setTrendPage((prev) => Math.max(1, prev - 1))}
                  disabled={trendPage === 1}
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setTrendPage((prev) => Math.min(trendTotalPages, prev + 1))
                  }
                  disabled={trendPage === trendTotalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </SectionCard>

      <SectionCard
        title="Recent Insight History"
        description={`${dateRangeLabel} • ${statusFilter}`}
      >
        {filteredHistory.length === 0 ? (
          <EmptyState
            title="No insight history found"
            description="Generated insight summaries will appear here after they are created."
          />
        ) : (
          <>
            <div className="ai-insights-table-wrapper">
              <table className="ai-insights-table ai-insights-table--history">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Focus</th>
                    <th>Summary</th>
                    <th>Generated By</th>
                    <th>Status</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedHistory.map((item) => (
                    <tr key={item.id}>
                      <td>#{item.id}</td>
                      <td>{item.title}</td>
                      <td>
                        <StatusBadge label={item.focus} variant="type" />
                      </td>
                      <td>{item.summary}</td>
                      <td>{item.generatedBy}</td>
                      <td>
                        <StatusBadge
                          label={item.status}
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
                Page {historyPage} of {historyTotalPages}
              </span>

              <div className="ai-insights-pagination__actions">
                <button
                  type="button"
                  onClick={() =>
                    setHistoryPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={historyPage === 1}
                >
                  Previous
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
                  Next
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
