import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/EmptyState";
import FilterBar from "../components/FilterBar";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { analyticsService } from "../services/analyticsService";
import {
  DEFAULT_REPORT_FROM_DATE,
  DEFAULT_REPORT_TO_DATE,
  formatDateRangeLabel,
} from "../utils/dateRange";
import "./AnalyticsPage.css";

const PAGE_SIZE = 4;

const chartPalette = ["#216e2a", "#d48b15", "#207298", "#b54676", "#79c768"];

const parseMetricNumber = (value: string) => {
  const normalized = value.replace(/[^0-9.]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCompactMetric = (value: number) => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }

  return value.toFixed(0);
};

const formatChartDateLabel = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-GB", {
      day: "2-digit",
    });
};

function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState(
    analyticsService.getEmptyAnalytics(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [fromDate, setFromDate] = useState(DEFAULT_REPORT_FROM_DATE);
  const [toDate, setToDate] = useState(DEFAULT_REPORT_TO_DATE);
  const [metricScope, setMetricScope] = useState("All Placements");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const dateRangeLabel = formatDateRangeLabel(fromDate, toDate);
  const kpiCards = analyticsData.kpiCards;
  const placementRows = analyticsData.topPlacements;
  const dailyTraffic = analyticsData.dailyTraffic;
  const slotCatalog = analyticsData.slotCatalog;

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setIsLoading(true);
        setPageError("");
        const nextAnalytics = await analyticsService.getAnalyticsSummary(
          fromDate,
          toDate,
        );
        setAnalyticsData(nextAnalytics);
      } catch (error) {
        setPageError(
          error instanceof Error
            ? error.message
            : "Failed to load analytics summary.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadAnalytics();
  }, [fromDate, toDate]);

  const slotFilterOptions = useMemo(() => {
    const slotLabels = [
      ...slotCatalog.map((item) => item.label),
      ...placementRows.map((item) => item.slot),
    ];

    return ["All Placements", ...new Set(slotLabels)];
  }, [placementRows, slotCatalog]);

  useEffect(() => {
    if (!slotFilterOptions.includes(metricScope)) {
      setMetricScope("All Placements");
    }
  }, [metricScope, slotFilterOptions]);

  const filteredRows = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return placementRows.filter((item) => {
      const matchesScope =
        metricScope === "All Placements" || item.slot === metricScope;
      const matchesKeyword =
        !keyword ||
        item.slot.toLowerCase().includes(keyword) ||
        String(item.id).includes(keyword);

      return matchesScope && matchesKeyword;
    });
  }, [metricScope, placementRows, searchKeyword]);

  const placementChartRows = useMemo(() => {
    const grouped = placementRows.reduce<
      Record<
        string,
        {
          slot: string;
          impressions: number;
          clicks: number;
          revenue: number;
        }
      >
    >((accumulator, item) => {
      const existing = accumulator[item.slot] ?? {
        slot: item.slot,
        impressions: 0,
        clicks: 0,
        revenue: 0,
      };

      existing.impressions += parseMetricNumber(item.impressions);
      existing.clicks += parseMetricNumber(item.clicks);
      existing.revenue += parseMetricNumber(item.revenue);

      accumulator[item.slot] = existing;
      return accumulator;
    }, {});

    return Object.values(grouped).sort((left, right) => right.impressions - left.impressions);
  }, [placementRows]);

  const chartSlots = useMemo(() => {
    if (metricScope !== "All Placements") {
      return [metricScope];
    }

    const activeSlots = new Set<string>();

    dailyTraffic.forEach((point) => {
      point.slots.forEach((slot) => {
        activeSlots.add(slot.slot);
      });
    });

    const catalogOrderedSlots = slotCatalog
      .map((item) => item.label)
      .filter((slot) => activeSlots.has(slot));

    if (catalogOrderedSlots.length > 0) {
      return catalogOrderedSlots;
    }

    return placementChartRows.map((item) => item.slot);
  }, [dailyTraffic, metricScope, placementChartRows, slotCatalog]);

  const chartSlotColorMap = useMemo(
    () =>
      chartSlots.reduce<Record<string, string>>((accumulator, slot, index) => {
        accumulator[slot] = chartPalette[index % chartPalette.length];
        return accumulator;
      }, {}),
    [chartSlots],
  );

  const dailyTrafficPoints = useMemo(() => {
    return dailyTraffic.map((point) => ({
      ...point,
      slots:
        metricScope === "All Placements"
          ? point.slots.filter((slot) => chartSlots.includes(slot.slot))
          : point.slots.filter((slot) => slot.slot === metricScope),
    }));
  }, [chartSlots, dailyTraffic, metricScope]);

  const visibleDailyTrafficPoints = useMemo(() => {
    const nonZeroPoints = dailyTrafficPoints.filter((point) =>
      point.slots.some((slot) => slot.impressions > 0),
    );

    return nonZeroPoints.length > 0 ? nonZeroPoints : dailyTrafficPoints;
  }, [dailyTrafficPoints]);

  const chartTrafficPoints = useMemo(
    () =>
      visibleDailyTrafficPoints
        .map((point) => ({
          ...point,
          slots: point.slots
            .filter((slot) => slot.impressions > 0)
            .sort(
              (left, right) =>
                chartSlots.indexOf(left.slot) - chartSlots.indexOf(right.slot),
            ),
        }))
        .filter((point) => point.slots.length > 0),
    [chartSlots, visibleDailyTrafficPoints],
  );

  const maxDailyTraffic = Math.max(
    ...chartTrafficPoints.flatMap((point) =>
      point.slots.map((slot) => slot.impressions),
    ),
    1,
  );
  const maxBarsPerDay = Math.max(
    ...chartTrafficPoints.map((point) => point.slots.length),
    1,
  );
  const chartDayMinWidth = maxBarsPerDay > 1 ? 72 : 46;
  const chartMinWidth = chartTrafficPoints.length * chartDayMinWidth + 48;

  const totalRevenue = placementChartRows.reduce(
    (total, item) => total + item.revenue,
    0,
  );

  const donutSegments = placementChartRows.map((item, index) => ({
    ...item,
    color: chartPalette[index % chartPalette.length],
    share: totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0,
  }));

  const donutBackground =
    donutSegments.length === 0
      ? "#dbe8db"
      : `conic-gradient(${donutSegments
          .reduce<string[]>((segments, segment, index) => {
            const previousAngle = donutSegments
              .slice(0, index)
              .reduce((sum, current) => sum + current.share, 0);
            const nextAngle = previousAngle + segment.share;
            segments.push(
              `${segment.color} ${(previousAngle * 3.6).toFixed(1)}deg ${(nextAngle * 3.6).toFixed(1)}deg`,
            );
            return segments;
          }, [])
          .join(", ")})`;

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

  const paginatedRows = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredRows.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredRows, page]);

  useEffect(() => {
    setPage(1);
  }, [metricScope, fromDate, searchKeyword, toDate]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

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

  const handleExportReport = () => {
    showToast(
      `Analytics report export started for ${dateRangeLabel} • ${metricScope}.`,
    );
  };

  const trafficOverviewTitle =
    metricScope === "All Placements"
      ? "Traffic Overview"
      : `${metricScope} Traffic Overview`;

  return (
    <div className="analytics-page">
      <PageHeader
        title="Analytics Dashboard"
        description="Monitor placement performance, engagement, and revenue trends."
        actionLabel="Export Report"
        onActionClick={handleExportReport}
      />

      <SectionCard
        title="Analytics Filters"
        description="Adjust the reporting period and analytics scope."
      >
        <FilterBar
          fields={[
            {
              id: "analytics-from-date",
              label: "From Date",
              type: "date",
              value: fromDate,
              onChange: setFromDate,
            },
            {
              id: "analytics-to-date",
              label: "To Date",
              type: "date",
              value: toDate,
              onChange: setToDate,
            },
            {
              id: "analytics-metric-scope",
              label: "Placement Scope",
              type: "select",
              value: metricScope,
              onChange: setMetricScope,
              options: slotFilterOptions,
            },
          ]}
        />
      </SectionCard>

      <SearchToolbar
        placeholder="Search by placement slot or row ID"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
        filterSummary={`Current scope: ${metricScope} • ${dateRangeLabel} • ${slotCatalog.length} configured slot(s)`}
      />

      {isLoading ? (
        <SectionCard title="Analytics KPIs">
          <EmptyState
            title="Loading analytics"
            description="Fetching analytics metrics from the admin API."
          />
        </SectionCard>
      ) : pageError ? (
        <SectionCard title="Analytics KPIs">
          <EmptyState
            title="Unable to load analytics"
            description={pageError}
          />
        </SectionCard>
      ) : (
        <div className="analytics-kpis">
          {kpiCards.map((card) => (
            <SectionCard key={card.title}>
              <StatCard
                title={card.title}
                value={card.value}
                subtitle={`${card.change} • ${dateRangeLabel}`}
              />
            </SectionCard>
          ))}
        </div>
      )}

      <div className="analytics-chart-grid">
        <SectionCard
          title={trafficOverviewTitle}
          description={`${dateRangeLabel} • ${metricScope}`}
        >
          <div className="analytics-panel__body">
            <div className="analytics-chart-placeholder analytics-chart-placeholder--bar">
              <div className="analytics-chart-caption">
                <span className="analytics-chart-caption__badge">
                  Impressions
                </span>
                <span className="analytics-chart-caption__text">
                  Compare daily impression volume across placement slots in the selected period.
                </span>
              </div>

              <div className="analytics-daily-legend">
                {chartSlots.map((slot) => (
                  <div key={slot} className="analytics-daily-legend__item">
                    <span
                      className="analytics-daily-legend__dot"
                      style={{ backgroundColor: chartSlotColorMap[slot] }}
                    />
                    <span>{slot}</span>
                  </div>
                ))}
              </div>

              <p className="analytics-daily-note">
                Only slots with recorded traffic in the selected date range are plotted here. The Placement Slots
                screen can still contain additional configured slots that have no traffic yet.
              </p>

              <div className="analytics-daily-chart-wrapper">
                <div
                  className="analytics-daily-chart"
                  style={{ minWidth: `${chartMinWidth}px` }}
                >
                  <div className="analytics-daily-chart__scale">
                    <span>{formatCompactMetric(maxDailyTraffic)}</span>
                    <span>{formatCompactMetric(maxDailyTraffic / 2)}</span>
                    <span>0</span>
                  </div>

                  <div className="analytics-daily-chart__canvas">
                    <div className="analytics-daily-chart__grid">
                      {[0, 1, 2, 3].map((index) => (
                        <span
                          key={index}
                          className="analytics-daily-chart__grid-line"
                        />
                      ))}
                    </div>

                    <div
                      className="analytics-daily-chart__groups"
                      style={{
                        gridTemplateColumns: `repeat(${Math.max(chartTrafficPoints.length, 1)}, minmax(${chartDayMinWidth}px, 1fr))`,
                      }}
                    >
                      {chartTrafficPoints.map((point) => (
                        <div
                          key={point.date}
                          className="analytics-daily-chart__group"
                        >
                          {(() => {
                            const maxImpressionInGroup = Math.max(
                              ...point.slots.map((slot) => slot.impressions),
                              0,
                            );
                            const maxImpressionIndex = point.slots.findIndex(
                              (slot) => slot.impressions === maxImpressionInGroup,
                            );
                            const barGroupWidth =
                              point.slots.length === 1 ? "28px" : "58px";

                            return (
                          <div
                            className="analytics-daily-chart__bars"
                            style={{ width: barGroupWidth }}
                          >
                            {point.slots.map((slot, slotIndex) => {
                              const barHeight = Math.max(
                                28,
                                (slot.impressions / maxDailyTraffic) * 100,
                              );
                              const showBarValue =
                                slotIndex === maxImpressionIndex;

                              return (
                                <div
                                  key={`${point.date}-${slot.slot}`}
                                  className="analytics-daily-chart__bar-column"
                                >
                                  {showBarValue ? (
                                    <span className="analytics-daily-chart__value">
                                      {formatCompactMetric(slot.impressions)}
                                    </span>
                                  ) : (
                                    <span className="analytics-daily-chart__value analytics-daily-chart__value--spacer" />
                                  )}
                                  <div
                                    className="analytics-daily-chart__bar"
                                    style={{
                                      height: `${barHeight}%`,
                                      backgroundColor:
                                        chartSlotColorMap[slot.slot],
                                    }}
                                    title={`${slot.slot}: ${slot.impressions.toLocaleString("en-US")} impressions on ${point.date}`}
                                  />
                                </div>
                              );
                            })}
                          </div>
                            );
                          })()}

                          <span className="analytics-daily-chart__date">
                            {formatChartDateLabel(point.date)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Placement Mix"
          description={`${dateRangeLabel} • Revenue share by placement`}
        >
          <div className="analytics-panel__body">
            <div className="analytics-donut-placeholder">
              <div className="analytics-pie-summary">
                <strong>{formatCompactMetric(totalRevenue)}</strong>
                <span>Total revenue in the selected period</span>
              </div>

              <div
                className="analytics-donut"
                style={{ background: donutBackground }}
              />
              <ul className="analytics-legend">
                {donutSegments.map((segment) => (
                  <li key={segment.slot}>
                    <span
                      className="dot"
                      style={{ backgroundColor: segment.color }}
                    />
                    <div className="analytics-legend__content">
                      <strong>{segment.slot}</strong>
                      <span>
                        {segment.share.toFixed(1)}% • {formatCompactMetric(segment.revenue)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Top Placement Performance"
        description={`${dateRangeLabel} • ${metricScope}`}
      >
        {isLoading ? (
          <EmptyState
            title="Loading analytics data"
            description="Fetching placement performance rows."
          />
        ) : pageError ? (
          <EmptyState title="Unable to load analytics data" description={pageError} />
        ) : filteredRows.length === 0 ? (
          <EmptyState
            title="No analytics data found"
            description="No placement performance matches the current filter settings."
          />
        ) : (
          <div className="analytics-table-section">
            <div className="analytics-table-wrapper">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Placement Slot</th>
                    <th>Impressions</th>
                    <th>Clicks</th>
                    <th>CTR</th>
                    <th>Revenue</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedRows.map((item) => (
                    <tr key={item.id}>
                      <td>#{item.id}</td>
                      <td>{item.slot}</td>
                      <td>{item.impressions}</td>
                      <td>{item.clicks}</td>
                      <td>{item.ctr}</td>
                      <td>{item.revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="analytics-pagination">
              <span className="analytics-pagination__info">
                Page {page} of {totalPages}
              </span>

              <div className="analytics-pagination__actions">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default AnalyticsPage;
