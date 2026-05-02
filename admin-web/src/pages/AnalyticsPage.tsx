import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/EmptyState";
import { useRef } from "react";
import FilterBar from "../components/FilterBar";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { analyticsService } from "../services/analyticsService";
import {
  coerceDateRange,
  DEFAULT_REPORT_FROM_DATE,
  DEFAULT_REPORT_TO_DATE,
  formatDateRangeLabel,
  getTodayDateValue,
} from "../utils/dateRange";
import "./AnalyticsPage.css";

const PAGE_SIZE = 4;

const chartPalette = ["#216e2a", "#d48b15", "#207298", "#b54676", "#79c768"];
const ALL_PLACEMENTS_LABEL = "Tất cả vị trí";

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
    : date.toLocaleDateString("vi-VN", {
      day: "2-digit",
    });
};

const formatChartMonthLabel = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("vi-VN", {
        month: "short",
      });
};

const formatChartTooltipDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
};

const getMonthToken = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : `${date.getFullYear()}-${date.getMonth() + 1}`;
};

function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState(
    analyticsService.getEmptyAnalytics(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [fromDate, setFromDate] = useState(DEFAULT_REPORT_FROM_DATE);
  const [toDate, setToDate] = useState(DEFAULT_REPORT_TO_DATE);
  const [metricScope, setMetricScope] = useState(ALL_PLACEMENTS_LABEL);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [activeTrafficBar, setActiveTrafficBar] = useState<{
    x: number;
    y: number;
    slot: string;
    date: string;
    impressions: number;
    color: string;
  } | null>(null);
  const chartWrapperRef = useRef<HTMLDivElement | null>(null);
  const today = getTodayDateValue();
  const dateRangeLabel = formatDateRangeLabel(fromDate, toDate);
  const kpiCards = analyticsData.kpiCards;
  const placementRows = analyticsData.topPlacements;
  const dailyTraffic = analyticsData.dailyTraffic;
  const slotCatalog = analyticsData.slotCatalog;

  const handleFromDateChange = (value: string) => {
    const { nextValue, counterpartValue } = coerceDateRange(value, toDate, "from", today);
    setFromDate(nextValue);
    setToDate(counterpartValue);
  };

  const handleToDateChange = (value: string) => {
    const { nextValue, counterpartValue } = coerceDateRange(value, fromDate, "to", today);
    setToDate(nextValue);
    setFromDate(counterpartValue);
  };

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
            : "Không thể tải dữ liệu phân tích.",
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

    return [ALL_PLACEMENTS_LABEL, ...new Set(slotLabels)];
  }, [placementRows, slotCatalog]);

  useEffect(() => {
    if (!slotFilterOptions.includes(metricScope)) {
      setMetricScope(ALL_PLACEMENTS_LABEL);
    }
  }, [metricScope, slotFilterOptions]);

  const filteredRows = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return placementRows.filter((item) => {
      const matchesScope =
        metricScope === ALL_PLACEMENTS_LABEL || item.slot === metricScope;
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
    if (metricScope !== ALL_PLACEMENTS_LABEL) {
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
      return Array.from(new Set(catalogOrderedSlots));
    }

    return Array.from(new Set(placementChartRows.map((item) => item.slot)));
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
    return dailyTraffic.map((point) => {
      const filteredSlots =
        metricScope === ALL_PLACEMENTS_LABEL
          ? point.slots.filter((slot) => chartSlots.includes(slot.slot))
          : point.slots.filter((slot) => slot.slot === metricScope);

      const mergedSlots = filteredSlots.reduce<
        Record<string, AnalyticsDailyTrafficPoint["slots"][number]>
      >((accumulator, slot) => {
        const existing = accumulator[slot.slot] ?? {
          slot: slot.slot,
          impressions: 0,
        };

        existing.impressions += slot.impressions;
        accumulator[slot.slot] = existing;
        return accumulator;
      }, {});

      return {
        ...point,
        slots: Object.values(mergedSlots),
      };
    });
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

  const chartGridLines = [1, 0.75, 0.5, 0.25, 0];
  const chartHeight = 360;
  const chartMargin = {
    top: 40,
    right: 18,
    bottom: 46,
    left: 58,
  };
  const maxBarsPerPoint = Math.max(
    ...chartTrafficPoints.map((point) => point.slots.length),
    1,
  );
  const chartWidth = Math.max(
    1040,
    chartMargin.left +
      chartMargin.right +
      chartTrafficPoints.length *
        Math.max(58, maxBarsPerPoint * 24 + Math.max(0, maxBarsPerPoint - 1) * 8),
  );
  const chartPlotWidth = chartWidth - chartMargin.left - chartMargin.right;
  const chartPlotHeight = chartHeight - chartMargin.top - chartMargin.bottom;
  const maxDailyTraffic = Math.max(
    ...chartTrafficPoints.flatMap((point) =>
      point.slots.map((slot) => slot.impressions),
    ),
    1,
  );
  const chartScaleMax = Math.max(Math.ceil(maxDailyTraffic * 1.08), maxDailyTraffic);

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
      `Đã bắt đầu xuất báo cáo phân tích cho ${dateRangeLabel} • ${metricScope}.`,
    );
  };

  const updateTrafficBarTooltip = (
    clientX: number,
    clientY: number,
    slot: string,
    date: string,
    impressions: number,
    color: string,
  ) => {
    const wrapper = chartWrapperRef.current;
    if (!wrapper) {
      return;
    }

    const bounds = wrapper.getBoundingClientRect();
    setActiveTrafficBar({
      x: clientX - bounds.left + wrapper.scrollLeft,
      y: clientY - bounds.top + wrapper.scrollTop,
      slot,
      date,
      impressions,
      color,
    });
  };

  const trafficOverviewTitle =
    metricScope === ALL_PLACEMENTS_LABEL
      ? "Tổng quan lưu lượng"
      : `Lưu lượng của ${metricScope}`;

  return (
    <div className="analytics-page">
      <PageHeader
        title="Bảng phân tích"
        description="Theo dõi hiệu quả vị trí hiển thị, mức độ tương tác và xu hướng doanh thu."
        actionLabel="Xuất báo cáo"
        onActionClick={handleExportReport}
      />

      <SectionCard
        title="Bộ lọc phân tích"
        description="Điều chỉnh khoảng thời gian báo cáo và phạm vi phân tích."
      >
        <FilterBar
          fields={[
          {
            id: "analytics-from-date",
            label: "Từ ngày",
            type: "date",
            value: fromDate,
            max: toDate || today,
            onChange: handleFromDateChange,
          },
          {
            id: "analytics-to-date",
            label: "Đến ngày",
            type: "date",
            value: toDate,
            min: fromDate || undefined,
            max: today,
            onChange: handleToDateChange,
          },
            {
              id: "analytics-metric-scope",
              label: "Phạm vi vị trí",
              type: "select",
              value: metricScope,
              onChange: setMetricScope,
              options: slotFilterOptions,
            },
          ]}
        />
      </SectionCard>

      <SearchToolbar
        placeholder="Tìm theo vị trí hiển thị hoặc mã dòng"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
        filterSummary={`Phạm vi hiện tại: ${metricScope} • ${dateRangeLabel} • ${slotCatalog.length} vị trí đã cấu hình`}
      />

      {isLoading ? (
        <SectionCard title="Chỉ số phân tích">
          <EmptyState
            title="Đang tải dữ liệu phân tích"
            description="Đang lấy các chỉ số phân tích từ API admin."
          />
        </SectionCard>
      ) : pageError ? (
        <SectionCard title="Chỉ số phân tích">
          <EmptyState
            title="Không thể tải dữ liệu phân tích"
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
                  Lượt hiển thị
                </span>
                <span className="analytics-chart-caption__text">
                  So sánh số lượt hiển thị theo ngày giữa các vị trí hiển thị trong khoảng thời gian đã chọn.
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
                Chỉ những vị trí có phát sinh dữ liệu trong khoảng thời gian đã chọn mới được đưa vào biểu đồ này.
                Màn Vị trí hiển thị vẫn có thể chứa thêm các vị trí đã cấu hình nhưng chưa phát sinh traffic.
              </p>

              <div
                ref={chartWrapperRef}
                className="analytics-daily-chart-wrapper"
                onMouseLeave={() => setActiveTrafficBar(null)}
              >
                {chartTrafficPoints.length === 0 ? (
                  <EmptyState
                    title="Không có lưu lượng theo ngày"
                    description="Không có vị trí hiển thị nào phát sinh lượt hiển thị trong giai đoạn này."
                  />
                ) : (
                  <>
                    <svg
                      className="analytics-daily-chart"
                      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                      width={chartWidth}
                      height={chartHeight}
                      role="img"
                      aria-label="Biểu đồ lượt hiển thị theo ngày và theo vị trí"
                    >
                      {chartGridLines.map((line) => {
                        const y =
                          chartMargin.top + chartPlotHeight * (1 - line);
                        return (
                          <g key={line}>
                            <line
                              className="analytics-daily-chart__grid-line"
                              x1={chartMargin.left}
                              x2={chartWidth - chartMargin.right}
                              y1={y}
                              y2={y}
                            />
                            <text
                              className="analytics-daily-chart__axis-label"
                              x={chartMargin.left - 12}
                              y={y + 4}
                              textAnchor="end"
                            >
                              {formatCompactMetric(chartScaleMax * line)}
                            </text>
                          </g>
                        );
                      })}

                      <line
                        className="analytics-daily-chart__axis"
                        x1={chartMargin.left}
                        x2={chartMargin.left}
                        y1={chartMargin.top}
                        y2={chartMargin.top + chartPlotHeight}
                      />
                      <line
                        className="analytics-daily-chart__axis"
                        x1={chartMargin.left}
                        x2={chartWidth - chartMargin.right}
                        y1={chartMargin.top + chartPlotHeight}
                        y2={chartMargin.top + chartPlotHeight}
                      />

                      {chartTrafficPoints.map((point, pointIndex) => {
                        const groupWidth =
                          chartPlotWidth / chartTrafficPoints.length;
                        const groupStart =
                          chartMargin.left + pointIndex * groupWidth;
                        const groupCenter = groupStart + groupWidth / 2;
                        const barGap = point.slots.length > 1 ? 6 : 0;
                        const barWidth = Math.min(
                          30,
                          Math.max(
                            12,
                            (groupWidth - 10 - barGap * (point.slots.length - 1)) /
                              point.slots.length,
                          ),
                        );
                        const barGroupWidth =
                          point.slots.length * barWidth +
                          (point.slots.length - 1) * barGap;
                        const firstBarX = groupCenter - barGroupWidth / 2;
                        const previousPoint = chartTrafficPoints[pointIndex - 1];
                        const showMonthLabel =
                          pointIndex === 0 ||
                          getMonthToken(previousPoint?.date ?? "") !==
                            getMonthToken(point.date);

                        return (
                          <g key={point.date}>
                            {point.slots.map((slot, slotIndex) => {
                              const barHeight = Math.max(
                                3,
                                (slot.impressions / chartScaleMax) *
                                  chartPlotHeight,
                              );
                              const x =
                                firstBarX + slotIndex * (barWidth + barGap);
                              const y =
                                chartMargin.top +
                                chartPlotHeight -
                                barHeight;
                              const slotColor = chartSlotColorMap[slot.slot];

                              return (
                                <g key={`${point.date}-${slot.slot}`}>
                                  <rect
                                    className="analytics-daily-chart__bar"
                                    x={x}
                                    y={y}
                                    width={barWidth}
                                    height={barHeight}
                                    rx="6"
                                    fill={slotColor}
                                    onPointerEnter={(event) =>
                                      updateTrafficBarTooltip(
                                        event.clientX,
                                        event.clientY,
                                        slot.slot,
                                        point.date,
                                        slot.impressions,
                                        slotColor,
                                      )
                                    }
                                    onPointerMove={(event) =>
                                      updateTrafficBarTooltip(
                                        event.clientX,
                                        event.clientY,
                                        slot.slot,
                                        point.date,
                                        slot.impressions,
                                        slotColor,
                                      )
                                    }
                                    onPointerLeave={() => setActiveTrafficBar(null)}
                                    onClick={(event) =>
                                      updateTrafficBarTooltip(
                                        event.clientX,
                                        event.clientY,
                                        slot.slot,
                                        point.date,
                                        slot.impressions,
                                        slotColor,
                                      )
                                    }
                                  >
                                    <title>
                                      {`${slot.slot}: ${slot.impressions.toLocaleString("vi-VN")} lượt hiển thị ngày ${point.date}`}
                                    </title>
                                  </rect>
                                </g>
                              );
                            })}
                            <text
                              className="analytics-daily-chart__date"
                              x={groupCenter}
                              y={chartMargin.top + chartPlotHeight + 24}
                              textAnchor="middle"
                            >
                              {formatChartDateLabel(point.date)}
                            </text>
                            {showMonthLabel ? (
                              <text
                                className="analytics-daily-chart__month"
                                x={groupCenter}
                                y={chartMargin.top + chartPlotHeight + 40}
                                textAnchor="middle"
                              >
                                {formatChartMonthLabel(point.date)}
                              </text>
                            ) : null}
                          </g>
                        );
                      })}
                    </svg>
                    {activeTrafficBar ? (
                      <div
                        className="analytics-daily-chart-tooltip"
                        style={{
                          left: activeTrafficBar.x,
                          top: Math.max(18, activeTrafficBar.y - 16),
                        }}
                      >
                        <span
                          className="analytics-daily-chart-tooltip__dot"
                          style={{ backgroundColor: activeTrafficBar.color }}
                        />
                        <div className="analytics-daily-chart-tooltip__content">
                          <strong>{activeTrafficBar.slot}</strong>
                          <span>{formatChartTooltipDate(activeTrafficBar.date)}</span>
                          <span>
                            {activeTrafficBar.impressions.toLocaleString("vi-VN")} lượt hiển thị
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Cơ cấu vị trí"
          description={`${dateRangeLabel} • Tỷ trọng doanh thu theo vị trí`}
        >
          <div className="analytics-panel__body">
            <div className="analytics-donut-placeholder">
              <div className="analytics-pie-summary">
                <strong>{formatCompactMetric(totalRevenue)}</strong>
                <span>Tổng doanh thu trong giai đoạn đã chọn</span>
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
        title="Hiệu suất vị trí nổi bật"
        description={`${dateRangeLabel} • ${metricScope}`}
      >
        {isLoading ? (
          <EmptyState
            title="Đang tải bảng phân tích"
            description="Đang lấy các dòng dữ liệu hiệu suất vị trí."
          />
        ) : pageError ? (
          <EmptyState title="Không thể tải bảng phân tích" description={pageError} />
        ) : filteredRows.length === 0 ? (
          <EmptyState
            title="Không có dữ liệu phân tích"
            description="Không có vị trí nào khớp với bộ lọc hiện tại."
          />
        ) : (
          <div className="analytics-table-section">
            <div className="analytics-table-wrapper">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Vị trí hiển thị</th>
                    <th>Lượt hiển thị</th>
                    <th>Lượt nhấp</th>
                    <th>CTR</th>
                    <th>Doanh thu</th>
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
                Trang {page} / {totalPages}
              </span>

              <div className="analytics-pagination__actions">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                >
                  Trước
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={page === totalPages}
                >
                  Sau
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

