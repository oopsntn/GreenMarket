import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { activityLogService } from "../services/activityLogService";
import type { FlattenedUserActivityItem } from "../types/user";
import "./ActivityLogPage.css";

const PAGE_SIZE = 8;

const getActionVariant = (action: string) => {
  if (action.includes("Locked")) return "locked";
  if (action.includes("Unlocked")) return "success";
  if (action.includes("Role")) return "processing";
  if (action.includes("Created")) return "active";
  return "type";
};

function ActivityLogPage() {
  const [activityLogs, setActivityLogs] = useState<FlattenedUserActivityItem[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedActionFilter, setSelectedActionFilter] = useState("All");
  const [selectedPerformerFilter, setSelectedPerformerFilter] = useState("All");
  const [page, setPage] = useState(1);
 
  const loadActivityLogs = async () => {
    try {
      setIsLoading(true);
      setError("");
      setActivityLogs(await activityLogService.fetchActivityLogs());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể tải nhật ký hoạt động.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadActivityLogs();
  }, []);

  const actionOptions = useMemo(() => {
    return [
      "All",
      ...Array.from(new Set(activityLogs.map((item) => item.action))),
    ];
  }, [activityLogs]);

  const performerOptions = useMemo(() => {
    return [
      "All",
      ...Array.from(new Set(activityLogs.map((item) => item.performedBy))),
    ];
  }, [activityLogs]);

  const filteredLogs = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return activityLogs.filter((item) => {
      const matchesKeyword =
        !keyword ||
        item.userName.toLowerCase().includes(keyword) ||
        item.action.toLowerCase().includes(keyword) ||
        item.detail.toLowerCase().includes(keyword) ||
        item.performedBy.toLowerCase().includes(keyword);

      const matchesAction =
        selectedActionFilter === "All" || item.action === selectedActionFilter;

      const matchesPerformer =
        selectedPerformerFilter === "All" ||
        item.performedBy === selectedPerformerFilter;

      return matchesKeyword && matchesAction && matchesPerformer;
    });
  }, [
    activityLogs,
    searchKeyword,
    selectedActionFilter,
    selectedPerformerFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));

  const paginatedLogs = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredLogs.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredLogs, page]);

  useEffect(() => {
    setPage(1);
  }, [searchKeyword, selectedActionFilter, selectedPerformerFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const today = new Date().toISOString().slice(0, 10);
  const todayCount = activityLogs.filter((item) =>
    item.performedAt.startsWith(today),
  ).length;
  const lockEvents = activityLogs.filter((item) =>
    item.action.includes("Locked"),
  ).length;
  const roleEvents = activityLogs.filter((item) =>
    item.action.includes("Role"),
  ).length;

  return (
    <div className="activity-log-page">
      <PageHeader
        title="Nhật ký hoạt động"
        description="Theo dõi log sự kiện backend cho vòng đời tài khoản, thay đổi trạng thái quản trị, xuất dữ liệu và các thao tác vận hành."
        actionLabel="Làm mới nhật ký"
        onActionClick={() => void loadActivityLogs()}
      />

      <div className="activity-log-summary-grid">
        <StatCard
          title="Tổng số bản ghi"
          value={String(activityLogs.length)}
          subtitle="Toàn bộ thao tác trên tài khoản"
        />
        <StatCard
          title="Hoạt động hôm nay"
          value={String(todayCount)}
          subtitle="Bản ghi phát sinh trong ngày"
        />
        <StatCard
          title="Thay đổi vai trò"
          value={String(roleEvents)}
          subtitle="Các lần gán và cập nhật vai trò"
        />
        <StatCard
          title="Sự kiện khóa"
          value={String(lockEvents)}
          subtitle="Các thao tác hạn chế truy cập"
        />
      </div>

      <SearchToolbar
        placeholder="Tìm theo người dùng, thao tác, chi tiết hoặc người thực hiện"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
        onFilterClick={() => setShowFilters((prev) => !prev)}
        filterLabel="Lọc nhật ký"
        filterSummaryItems={[selectedActionFilter, selectedPerformerFilter]}
      />

      {showFilters ? (
        <SectionCard
          title="Bộ lọc nhật ký"
          description="Lọc bản ghi theo loại thao tác và người thực hiện."
        >
          <div className="activity-log-filters">
            <div className="activity-log-filters__field">
              <label htmlFor="activity-log-action-filter">Thao tác</label>
              <select
                id="activity-log-action-filter"
                value={selectedActionFilter}
                onChange={(event) => setSelectedActionFilter(event.target.value)}
              >
                {actionOptions.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </div>

            <div className="activity-log-filters__field">
              <label htmlFor="activity-log-performer-filter">
                Người thực hiện
              </label>
              <select
                id="activity-log-performer-filter"
                value={selectedPerformerFilter}
                onChange={(event) =>
                  setSelectedPerformerFilter(event.target.value)
                }
              >
                {performerOptions.map((performer) => (
                  <option key={performer} value={performer}>
                    {performer}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Danh sách hoạt động tài khoản"
        description="Theo dõi đăng ký, đăng nhập, cập nhật trạng thái, xuất dữ liệu và các thao tác vòng đời khác được backend ghi nhận."
      >
        {isLoading ? (
          <EmptyState
            title="Đang tải nhật ký hoạt động"
            description="Đang lấy các bản ghi hoạt động mới nhất từ API quản trị."
          />
        ) : error ? (
          <EmptyState
            title="Không thể tải nhật ký hoạt động"
            description={error}
          />
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            title="Không có hoạt động nào"
            description="Không có bản ghi nào khớp với điều kiện tìm kiếm hoặc bộ lọc hiện tại."
          />
        ) : (
          <>
            <div className="activity-log-table-wrapper">
              <table className="activity-log-table">
                <thead>
                  <tr>
                    <th>Mã log</th>
                    <th>Người dùng</th>
                    <th>Thao tác</th>
                    <th>Chi tiết</th>
                    <th>Người thực hiện</th>
                    <th>Thời gian</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedLogs.map((item: FlattenedUserActivityItem) => (
                    <tr key={`${item.userId}-${item.id}`}>
                      <td>#{item.id}</td>
                      <td>
                        <div className="activity-log-cell">
                          <strong>{item.userName}</strong>
                          <span>Người dùng #{item.userId}</span>
                        </div>
                      </td>
                      <td>
                        <StatusBadge
                          label={item.action}
                          variant={getActionVariant(item.action)}
                        />
                      </td>
                      <td>{item.detail}</td>
                      <td>{item.performedBy}</td>
                      <td>{item.performedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="activity-log-pagination">
              <span className="activity-log-pagination__info">
                Trang {page} / {totalPages}
              </span>

              <div className="activity-log-pagination__actions">
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
          </>
        )}
      </SectionCard>
    </div>
  );
}

export default ActivityLogPage;
