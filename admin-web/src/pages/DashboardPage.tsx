import { useEffect, useState } from "react";
import EmptyState from "../components/EmptyState";
import FilterBar from "../components/FilterBar";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import { categoryMappingService } from "../services/categoryMappingService";
import { categoryService } from "../services/categoryService";
import { dashboardService } from "../services/dashboardService";
import { postModerationService } from "../services/postModerationService";
import { promotionService } from "../services/promotionService";
import { reportModerationService } from "../services/reportModerationService";
import { shopApi } from "../services/shopApi";
import { userService } from "../services/userService";
import {
  coerceDateRange,
  DEFAULT_REPORT_FROM_DATE,
  DEFAULT_REPORT_TO_DATE,
  getTodayDateValue,
} from "../utils/dateRange";
import "./DashboardPage.css";

type DashboardMetric = {
  title: string;
  value: string;
  note: string;
};

type DashboardAlert = {
  id: string;
  level: "critical" | "warning" | "info";
  title: string;
  detail: string;
};

type DashboardViewState = {
  metrics: DashboardMetric[];
  alerts: DashboardAlert[];
};

const EMPTY_STATE: DashboardViewState = {
  metrics: [],
  alerts: [],
};

const parseDateLike = (value: string) => {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }

  const parsed = new Date(normalized.includes(" ") ? normalized.replace(" ", "T") : normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isDateWithinRange = (value: string, fromDate: string, toDate: string) => {
  const current = parseDateLike(value);
  const from = parseDateLike(fromDate);
  const to = parseDateLike(toDate);

  if (!current || !from || !to) {
    return false;
  }

  return current.getTime() >= from.getTime() && current.getTime() <= to.getTime();
};

const getDaysDiff = (target: Date, base: Date) =>
  Math.ceil((target.getTime() - base.getTime()) / (1000 * 60 * 60 * 24));

const isSevereReport = (value: string) => {
  const normalized = value.trim().toLowerCase();

  return [
    "nguy cơ lừa đảo",
    "nội dung bị cấm",
    "quảng bá quá mức",
    "lừa đảo",
    "vi phạm",
  ].some((keyword) => normalized.includes(keyword));
};

function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardViewState>(EMPTY_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [fromDate, setFromDate] = useState(DEFAULT_REPORT_FROM_DATE);
  const [toDate, setToDate] = useState(DEFAULT_REPORT_TO_DATE);
  const today = getTodayDateValue();

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
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        setPageError("");

        const [
          overview,
          users,
          shops,
          reports,
          posts,
          categories,
          mappings,
          promotions,
        ] = await Promise.all([
          dashboardService.getOverview(fromDate, toDate),
          userService.fetchUsers(),
          shopApi.getShops(),
          reportModerationService.fetchReports(),
          postModerationService.fetchPosts(),
          categoryService.getCategories(),
          categoryMappingService.getMappings({ page: 1, pageSize: 1000 }),
          promotionService.getPromotions(),
        ]);

        const now = new Date();
        const newUsers = users.filter((item) =>
          isDateWithinRange(item.joinedAt, fromDate, toDate),
        ).length;
        const pendingShops = shops.filter((item) => item.status === "Pending").length;
        const pendingReports = reports.filter((item) => item.status === "Pending");
        const revenueThisPeriod =
          overview.statCards.find((item) => item.title.toLowerCase().includes("doanh thu"))
            ?.value ?? "0 VND";
        const activePromotions = promotions.filter((item) => item.status === "Active");

        const pendingPostsTooLong = posts.filter((item) => {
          if (item.status !== "Pending") {
            return false;
          }

          const submittedAt = parseDateLike(item.submittedAt);
          return submittedAt ? getDaysDiff(now, submittedAt) >= 3 : false;
        });

        const severePendingReports = pendingReports.filter(
          (item) =>
            isSevereReport(item.reasonCode) || isSevereReport(item.reason),
        );

        const paymentIssuePromotions = promotions.filter(
          (item) =>
            item.paymentStatus !== "Paid" &&
            (item.status === "Active" ||
              item.status === "Scheduled" ||
              item.status === "Paused"),
        );

        const activeCategoryIds = new Set(
          categories
            .filter((item) => item.status === "Active")
            .map((item) => item.id),
        );
        const mappedCategoryIds = new Set(
          mappings.data
            .filter((item) => item.status === "Active")
            .map((item) => item.categoryId),
        );
        const categoriesWithoutMappings = Array.from(activeCategoryIds).filter(
          (categoryId) => !mappedCategoryIds.has(categoryId),
        );

        const expiringPromotions = activePromotions
          .map((item) => {
            const endAt = parseDateLike(item.endDate);
            if (!endAt) {
              return null;
            }

            const daysLeft = getDaysDiff(endAt, now);
            if (daysLeft < 0 || daysLeft > 3) {
              return null;
            }

            return {
              owner: item.owner,
              packageName: item.packageName,
              endDate: item.endDate,
            };
          })
          .filter((item): item is NonNullable<typeof item> => item !== null);

        setDashboardData({
          metrics: [
            {
              title: "Người dùng mới",
              value: String(newUsers),
              note: `${fromDate} đến ${toDate}`,
            },
            {
              title: "Shop chờ duyệt",
              value: String(pendingShops),
              note: "Hồ sơ đang chờ admin kiểm tra",
            },
            {
              title: "Báo cáo chờ xử lý",
              value: String(pendingReports.length),
              note: "Tồn đọng cần xử lý hiện tại",
            },
            {
              title: "Doanh thu kỳ này",
              value: revenueThisPeriod,
              note: `${fromDate} đến ${toDate}`,
            },
            {
              title: "Chiến dịch quảng bá đang chạy",
              value: String(activePromotions.length),
              note: "Các gói đang hiển thị hiện tại",
            },
          ],
          alerts: [
            {
              id: "pending-posts",
              level: pendingPostsTooLong.length > 0 ? "warning" : "info",
              title: "Bài chờ duyệt lâu",
              detail:
                pendingPostsTooLong.length > 0
                  ? `${pendingPostsTooLong.length} bài đã chờ duyệt từ 3 ngày trở lên. Nên ưu tiên xử lý hàng chờ để tránh nghẽn đăng bán.`
                  : "Hiện chưa có bài nào bị treo duyệt quá 3 ngày.",
            },
            {
              id: "severe-reports",
              level: severePendingReports.length > 0 ? "critical" : "info",
              title: "Báo cáo nghiêm trọng",
              detail:
                severePendingReports.length > 0
                  ? `${severePendingReports.length} báo cáo có mức độ nghiêm trọng đang chờ xử lý. Nên ưu tiên các trường hợp có dấu hiệu lừa đảo hoặc nội dung cấm.`
                  : "Hiện chưa có báo cáo nghiêm trọng nào đang chờ xử lý.",
            },
            {
              id: "payment-issues",
              level: paymentIssuePromotions.length > 0 ? "critical" : "info",
              title: "Quảng bá lỗi thanh toán",
              detail:
                paymentIssuePromotions.length > 0
                  ? `${paymentIssuePromotions.length} đơn quảng bá đang chạy hoặc sắp chạy nhưng thanh toán còn vướng xác nhận. Cần rà lại để tránh ảnh hưởng hiển thị.`
                  : "Không ghi nhận đơn quảng bá nào đang gặp vấn đề thanh toán cần xử lý ngay.",
            },
            {
              id: "missing-mappings",
              level: categoriesWithoutMappings.length > 0 ? "warning" : "info",
              title: "Cấu hình thiếu ánh xạ",
              detail:
                categoriesWithoutMappings.length > 0
                  ? `${categoriesWithoutMappings.length} danh mục đang bật nhưng chưa có ánh xạ thuộc tính. Nên hoàn thiện cấu hình để tránh form đăng bài thiếu dữ liệu.`
                  : "Tất cả danh mục đang bật đã có ánh xạ thuộc tính cơ bản.",
            },
            {
              id: "expiring-promotions",
              level: expiringPromotions.length > 0 ? "warning" : "info",
              title: "Gói khách hàng sắp hết hạn",
              detail:
                expiringPromotions.length > 0
                  ? `${expiringPromotions.length} gói sẽ hết hạn trong 3 ngày tới. ${expiringPromotions
                      .slice(0, 2)
                      .map((item) => `${item.owner} - ${item.packageName} (${item.endDate})`)
                      .join("; ")}.`
                  : "Hiện chưa có gói quảng bá nào sắp hết hạn trong 3 ngày tới.",
            },
          ],
        });
      } catch (error) {
        setPageError(
          error instanceof Error
            ? error.message
            : "Không thể tải dữ liệu tổng quan.",
        );
        setDashboardData(EMPTY_STATE);
      } finally {
        setIsLoading(false);
      }
    };

    void loadDashboard();
  }, [fromDate, toDate]);

  return (
    <div className="dashboard-page">
      <PageHeader
        title="Tổng quan hệ thống"
        description="Theo dõi nhanh chỉ số điều hành và các cảnh báo cần xử lý ngay của GreenMarket."
      />

      <SectionCard
        title="Bộ lọc tổng quan"
        description="Điều chỉnh khoảng thời gian để xem người dùng mới và doanh thu kỳ này."
      >
        <FilterBar
          fields={[
            {
              id: "dashboard-from-date",
              label: "Từ ngày",
              type: "date",
              value: fromDate,
              max: toDate || today,
              onChange: handleFromDateChange,
            },
            {
              id: "dashboard-to-date",
              label: "Đến ngày",
              type: "date",
              value: toDate,
              min: fromDate || undefined,
              max: today,
              onChange: handleToDateChange,
            },
          ]}
        />
      </SectionCard>

      {isLoading ? (
        <SectionCard title="Chỉ số điều hành rất ngắn">
          <EmptyState
            title="Đang tải tổng quan"
            description="Hệ thống đang tổng hợp chỉ số điều hành và cảnh báo vận hành."
          />
        </SectionCard>
      ) : pageError ? (
        <SectionCard title="Chỉ số điều hành rất ngắn">
          <EmptyState
            title="Không thể tải dashboard"
            description={pageError}
          />
        </SectionCard>
      ) : (
        <>
          <SectionCard
            title="Chỉ số điều hành rất ngắn"
            description="Giữ lại các chỉ số mà admin cần đọc trong vài giây đầu tiên."
          >
            <div className="dashboard-cards">
              {dashboardData.metrics.map((card) => (
                <SectionCard key={card.title}>
                  <StatCard
                    title={card.title}
                    value={card.value}
                    subtitle={card.note}
                  />
                </SectionCard>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Cảnh báo cần xử lý ngay"
            description="Ưu tiên những việc có thể ảnh hưởng trực tiếp đến duyệt nội dung, thanh toán và hiển thị quảng bá."
          >
            <div className="dashboard-alerts">
              {dashboardData.alerts.map((alert) => (
                <article
                  key={alert.id}
                  className={`dashboard-alert dashboard-alert--${alert.level}`}
                >
                  <div className="dashboard-alert__header">
                    <h3>{alert.title}</h3>
                    <span className="dashboard-alert__badge">
                      {alert.level === "critical"
                        ? "Ưu tiên cao"
                        : alert.level === "warning"
                          ? "Cần theo dõi"
                          : "Ổn định"}
                    </span>
                  </div>
                  <p>{alert.detail}</p>
                </article>
              ))}
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}

export default DashboardPage;
