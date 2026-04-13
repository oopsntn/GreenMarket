import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/EmptyState";
import FilterBar from "../components/FilterBar";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import { dashboardService } from "../services/dashboardService";
import {
  DEFAULT_REPORT_FROM_DATE,
  DEFAULT_REPORT_TO_DATE,
  formatDateRangeLabel,
} from "../utils/dateRange";
import "./DashboardPage.css";

const ALL_METRICS_LABEL = "Tất cả chỉ số";

function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(
    dashboardService.getEmptyOverview(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [fromDate, setFromDate] = useState(DEFAULT_REPORT_FROM_DATE);
  const [toDate, setToDate] = useState(DEFAULT_REPORT_TO_DATE);
  const [overviewScope, setOverviewScope] = useState(ALL_METRICS_LABEL);
  const dateRangeLabel = formatDateRangeLabel(fromDate, toDate);
  const statCards = dashboardData.statCards;
  const summary = dashboardData.summary;

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        setPageError("");
        const nextOverview = await dashboardService.getOverview(fromDate, toDate);
        setDashboardData(nextOverview);
      } catch (error) {
        setPageError(
          error instanceof Error
            ? error.message
            : "Không thể tải dữ liệu tổng quan.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadDashboard();
  }, [fromDate, toDate]);

  const filteredCards = useMemo(() => {
    if (overviewScope === ALL_METRICS_LABEL) return statCards;

    const normalizedCards = statCards.map((card, index) => ({
      ...card,
      _index: index,
      _title: card.title.toLowerCase(),
    }));

    const scopeRules: Record<string, (title: string) => boolean> = {
      "Người dùng & cửa hàng": (title) =>
        title.includes("user") ||
        title.includes("shop") ||
        title.includes("seller"),
      "Bài đăng & kiểm duyệt": (title) =>
        title.includes("post") ||
        title.includes("report") ||
        title.includes("moderat") ||
        title.includes("review"),
      "Tổng quan kinh doanh": (title) =>
        title.includes("revenue") ||
        title.includes("promotion") ||
        title.includes("order") ||
        title.includes("spending") ||
        title.includes("sale"),
    };

    const matched = normalizedCards.filter((card) =>
      scopeRules[overviewScope]?.(card._title),
    );

    if (matched.length > 0) {
      return matched.map(({ _index, _title, ...card }) => card);
    }

    if (overviewScope === "Người dùng & cửa hàng") {
      return statCards.slice(0, 2);
    }

    if (overviewScope === "Bài đăng & kiểm duyệt") {
      return statCards.slice(1, 3);
    }

    return statCards.slice(-2);
  }, [overviewScope, statCards]);

  const scopeSummaryText =
    overviewScope === ALL_METRICS_LABEL
      ? "Đang hiển thị toàn bộ nhóm chỉ số của hệ thống quản trị."
      : `Đang hiển thị các thẻ KPI thuộc nhóm ${overviewScope.toLowerCase()}.`;

  return (
    <div className="dashboard-page">
      <PageHeader
        title="Tổng quan hệ thống"
        description="Theo dõi nhanh các chỉ số trọng yếu của GreenMarket."
      />

      <SectionCard
        title="Bộ lọc tổng quan"
        description="Điều chỉnh khoảng thời gian báo cáo và phạm vi theo dõi."
      >
        <FilterBar
          fields={[
            {
              id: "dashboard-from-date",
              label: "Từ ngày",
              type: "date",
              value: fromDate,
              onChange: setFromDate,
            },
            {
              id: "dashboard-to-date",
              label: "Đến ngày",
              type: "date",
              value: toDate,
              onChange: setToDate,
            },
            {
              id: "dashboard-overview-scope",
              label: "Phạm vi tổng quan",
              type: "select",
              value: overviewScope,
              onChange: setOverviewScope,
              options: [
                ALL_METRICS_LABEL,
                "Người dùng & cửa hàng",
                "Bài đăng & kiểm duyệt",
                "Tổng quan kinh doanh",
              ],
            },
          ]}
        />
      </SectionCard>

      <SectionCard
        title="Ngữ cảnh tổng quan"
        description={`${dateRangeLabel} • ${overviewScope}`}
      >
        <div className="dashboard-context">
          <p>{scopeSummaryText}</p>
        </div>
      </SectionCard>

      {isLoading ? (
        <SectionCard title="Chỉ số tổng quan">
          <EmptyState
            title="Đang tải dữ liệu tổng quan"
            description="Đang lấy các chỉ số dashboard từ API quản trị."
          />
        </SectionCard>
      ) : pageError ? (
        <SectionCard title="Chỉ số tổng quan">
          <EmptyState
            title="Không thể tải dashboard"
            description={pageError}
          />
        </SectionCard>
      ) : (
        <div className="dashboard-cards">
          {filteredCards.map((card) => (
            <SectionCard key={card.title}>
              <StatCard
                title={card.title}
                value={card.value}
                subtitle={`${dateRangeLabel} • ${overviewScope}`}
              />
            </SectionCard>
          ))}
        </div>
      )}

      <SectionCard title={summary.title}>
        <div className="dashboard-panel">
          <p>{summary.description}</p>
        </div>
      </SectionCard>
    </div>
  );
}

export default DashboardPage;
