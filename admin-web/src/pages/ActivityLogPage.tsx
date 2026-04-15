import { useEffect, useMemo, useState } from "react";
import BaseModal from "../components/BaseModal";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { activityLogService } from "../services/activityLogService";
import type { ActivityLogItem } from "../types/activityLog";
import "./ActivityLogPage.css";

const PAGE_SIZE = 8;

const getSeverityVariant = (severity: ActivityLogItem["severity"]) => {
  if (severity === "cao") return "locked";
  if (severity === "trung bình") return "pending";
  return "active";
};

const getResultVariant = (result: string) => {
  const normalized = result.toLowerCase();

  if (
    normalized.includes("từ chối") ||
    normalized.includes("bỏ qua") ||
    normalized.includes("đã khóa")
  ) {
    return "locked";
  }

  if (
    normalized.includes("đã cập nhật") ||
    normalized.includes("đã lưu") ||
    normalized.includes("hoàn tất") ||
    normalized.includes("đã xử lý") ||
    normalized.includes("đã duyệt") ||
    normalized.includes("đã mở khóa") ||
    normalized.includes("thành công")
  ) {
    return "success";
  }

  return "processing";
};

function ActivityLogPage() {
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedModuleFilter, setSelectedModuleFilter] = useState("All");
  const [selectedActionTypeFilter, setSelectedActionTypeFilter] =
    useState("All");
  const [selectedPerformerFilter, setSelectedPerformerFilter] =
    useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<ActivityLogItem | null>(null);

  const loadActivityLogs = async () => {
    try {
      setIsLoading(true);
      setError("");
      setActivityLogs(await activityLogService.fetchActivityLogs());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể tải nhật ký hoạt động.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadActivityLogs();
  }, []);

  const moduleOptions = useMemo(
    () => ["All", ...Array.from(new Set(activityLogs.map((item) => item.moduleLabel)))],
    [activityLogs],
  );

  const actionTypeOptions = useMemo(
    () => ["All", ...Array.from(new Set(activityLogs.map((item) => item.actionType)))],
    [activityLogs],
  );

  const performerOptions = useMemo(
    () => ["All", ...Array.from(new Set(activityLogs.map((item) => item.actorName)))],
    [activityLogs],
  );

  const filteredLogs = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toTime = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null;

    return activityLogs.filter((item) => {
      const occurredAtTime = item.occurredAt ? new Date(item.occurredAt).getTime() : null;

      const matchesKeyword =
        !keyword ||
        item.actorName.toLowerCase().includes(keyword) ||
        item.actorRole.toLowerCase().includes(keyword) ||
        item.moduleLabel.toLowerCase().includes(keyword) ||
        item.action.toLowerCase().includes(keyword) ||
        item.targetName.toLowerCase().includes(keyword) ||
        item.targetCode.toLowerCase().includes(keyword) ||
        item.detail.toLowerCase().includes(keyword);

      const matchesModule =
        selectedModuleFilter === "All" || item.moduleLabel === selectedModuleFilter;
      const matchesActionType =
        selectedActionTypeFilter === "All" || item.actionType === selectedActionTypeFilter;
      const matchesPerformer =
        selectedPerformerFilter === "All" || item.actorName === selectedPerformerFilter;
      const matchesDateFrom =
        fromTime === null || occurredAtTime === null || occurredAtTime >= fromTime;
      const matchesDateTo =
        toTime === null || occurredAtTime === null || occurredAtTime <= toTime;

      return (
        matchesKeyword &&
        matchesModule &&
        matchesActionType &&
        matchesPerformer &&
        matchesDateFrom &&
        matchesDateTo
      );
    });
  }, [
    activityLogs,
    dateFrom,
    dateTo,
    searchKeyword,
    selectedActionTypeFilter,
    selectedModuleFilter,
    selectedPerformerFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const paginatedLogs = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredLogs.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredLogs, page]);

  useEffect(() => {
    setPage(1);
  }, [
    dateFrom,
    dateTo,
    searchKeyword,
    selectedActionTypeFilter,
    selectedModuleFilter,
    selectedPerformerFilter,
  ]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const todayPrefix = new Date().toISOString().slice(0, 10);
  const todayCount = activityLogs.filter((item) =>
    (item.occurredAt || "").startsWith(todayPrefix),
  ).length;
  const highSeverityCount = activityLogs.filter((item) => item.severity === "cao").length;
  const settingsAndTemplateCount = activityLogs.filter((item) =>
    ["Thiết lập hệ thống", "Mẫu nội dung"].includes(item.moduleLabel),
  ).length;

  return (
    <div className="activity-log-page">
      <PageHeader
        title="Nhật ký hoạt động"
        description="Tra cứu ai làm gì, ở đâu, khi nào trong toàn bộ màn quản trị. Nhật ký này gom được thay đổi ở người dùng, kiểm duyệt, thiết lập hệ thống, mẫu nội dung và xuất dữ liệu."
        actionLabel="Làm mới nhật ký"
        onActionClick={() => void loadActivityLogs()}
      />

      <div className="activity-log-summary-grid">
        <StatCard
          title="Tổng số bản ghi"
          value={String(activityLogs.length)}
          subtitle="Toàn bộ bản ghi backend đã trả về"
        />
        <StatCard
          title="Hoạt động hôm nay"
          value={String(todayCount)}
          subtitle="Số bản ghi phát sinh trong ngày hiện tại"
        />
        <StatCard
          title="Mức cao"
          value={String(highSeverityCount)}
          subtitle="Những thao tác cần chú ý hơn khi rà soát"
        />
        <StatCard
          title="Settings + Template"
          value={String(settingsAndTemplateCount)}
          subtitle="Các thay đổi ở thiết lập hệ thống và mẫu nội dung"
        />
      </div>

      <SearchToolbar
        placeholder="Tìm theo người thực hiện, nhóm chức năng, hành động, đối tượng hoặc mã đối tượng"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
        onFilterClick={() => setShowFilters((prev) => !prev)}
        filterLabel="Lọc nhật ký"
        filterSummaryItems={[
          selectedModuleFilter === "All" ? "Tất cả nhóm chức năng" : selectedModuleFilter,
          selectedActionTypeFilter === "All"
            ? "Tất cả loại hành động"
            : selectedActionTypeFilter,
          selectedPerformerFilter === "All"
            ? "Tất cả người thực hiện"
            : selectedPerformerFilter,
        ]}
      />

      {showFilters ? (
        <SectionCard
          title="Bộ lọc nhật ký"
          description="Lọc theo khoảng ngày, nhóm chức năng, loại hành động và người thực hiện."
        >
          <div className="activity-log-filters">
            <div className="activity-log-filters__field">
              <label htmlFor="activity-log-date-from">Từ ngày</label>
              <input
                id="activity-log-date-from"
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </div>

            <div className="activity-log-filters__field">
              <label htmlFor="activity-log-date-to">Đến ngày</label>
              <input
                id="activity-log-date-to"
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </div>

            <div className="activity-log-filters__field">
              <label htmlFor="activity-log-module-filter">Nhóm chức năng</label>
              <select
                id="activity-log-module-filter"
                value={selectedModuleFilter}
                onChange={(event) => setSelectedModuleFilter(event.target.value)}
              >
                {moduleOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "All" ? "Tất cả nhóm chức năng" : option}
                  </option>
                ))}
              </select>
            </div>

            <div className="activity-log-filters__field">
              <label htmlFor="activity-log-action-type-filter">Loại hành động</label>
              <select
                id="activity-log-action-type-filter"
                value={selectedActionTypeFilter}
                onChange={(event) => setSelectedActionTypeFilter(event.target.value)}
              >
                {actionTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "All" ? "Tất cả loại hành động" : option}
                  </option>
                ))}
              </select>
            </div>

            <div className="activity-log-filters__field activity-log-filters__field--full">
              <label htmlFor="activity-log-performer-filter">Người thực hiện</label>
              <select
                id="activity-log-performer-filter"
                value={selectedPerformerFilter}
                onChange={(event) => setSelectedPerformerFilter(event.target.value)}
              >
                {performerOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "All" ? "Tất cả người thực hiện" : option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Danh sách hoạt động"
        description="Mỗi bản ghi cho biết rõ thời gian, người thực hiện, vai trò, nhóm chức năng, hành động, đối tượng tác động, kết quả và mức độ ưu tiên."
      >
        {isLoading ? (
          <EmptyState
            title="Đang tải nhật ký hoạt động"
            description="Đang lấy dữ liệu nhật ký từ API quản trị."
          />
        ) : error ? (
          <EmptyState title="Không thể tải nhật ký hoạt động" description={error} />
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
                    <th>Thời gian</th>
                    <th>Người thực hiện</th>
                    <th>Nhóm chức năng</th>
                    <th>Hành động</th>
                    <th>Đối tượng tác động</th>
                    <th>Kết quả</th>
                    <th>Mức độ</th>
                    <th>Chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.map((item) => (
                    <tr key={item.id}>
                      <td>{item.occurredAtLabel}</td>
                      <td>
                        <div className="activity-log-cell">
                          <strong>{item.actorName}</strong>
                          <span>{item.actorRole}</span>
                        </div>
                      </td>
                      <td>
                        <StatusBadge label={item.moduleLabel} variant="type" />
                      </td>
                      <td>
                        <div className="activity-log-cell">
                          <strong>{item.action}</strong>
                          <span>{item.actionType}</span>
                        </div>
                      </td>
                      <td>
                        <div className="activity-log-cell">
                          <strong>{item.targetName}</strong>
                          <span>{item.targetCode ? `${item.targetType} • ${item.targetCode}` : item.targetType}</span>
                        </div>
                      </td>
                      <td>
                        <StatusBadge label={item.result} variant={getResultVariant(item.result)} />
                      </td>
                      <td>
                        <StatusBadge
                          label={`Mức ${item.severity}`}
                          variant={getSeverityVariant(item.severity)}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="activity-log-detail-button"
                          onClick={() => setSelectedLog(item)}
                        >
                          Xem chi tiết
                        </button>
                      </td>
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
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                >
                  Sau
                </button>
              </div>
            </div>
          </>
        )}
      </SectionCard>

      <BaseModal
        isOpen={Boolean(selectedLog)}
        title="Chi tiết nhật ký hoạt động"
        description="Xem đầy đủ thông tin của bản ghi đang chọn để đối chiếu ai làm gì, ở đâu, khi nào."
        onClose={() => setSelectedLog(null)}
        maxWidth="880px"
      >
        {selectedLog ? (
          <div className="activity-log-detail">
            <div className="activity-log-detail__grid">
              <div className="activity-log-detail__field">
                <label>Mã log</label>
                <strong>#{selectedLog.id}</strong>
              </div>
              <div className="activity-log-detail__field">
                <label>Thời gian</label>
                <strong>{selectedLog.occurredAtLabel}</strong>
              </div>
              <div className="activity-log-detail__field">
                <label>Người thực hiện</label>
                <strong>{selectedLog.actorName}</strong>
              </div>
              <div className="activity-log-detail__field">
                <label>Vai trò</label>
                <strong>{selectedLog.actorRole}</strong>
              </div>
              <div className="activity-log-detail__field">
                <label>Nhóm chức năng</label>
                <strong>{selectedLog.moduleLabel}</strong>
              </div>
              <div className="activity-log-detail__field">
                <label>Loại hành động</label>
                <strong>{selectedLog.actionType}</strong>
              </div>
              <div className="activity-log-detail__field">
                <label>Hành động</label>
                <strong>{selectedLog.action}</strong>
              </div>
              <div className="activity-log-detail__field">
                <label>Kết quả</label>
                <strong>{selectedLog.result}</strong>
              </div>
              <div className="activity-log-detail__field">
                <label>Đối tượng tác động</label>
                <strong>{selectedLog.targetName}</strong>
              </div>
              <div className="activity-log-detail__field">
                <label>Mã đối tượng</label>
                <strong>{selectedLog.targetCode || "--"}</strong>
              </div>
              <div className="activity-log-detail__field">
                <label>Mức độ</label>
                <strong>{`Mức ${selectedLog.severity}`}</strong>
              </div>
              <div className="activity-log-detail__field">
                <label>Loại đối tượng</label>
                <strong>{selectedLog.targetType}</strong>
              </div>
            </div>

            <div className="activity-log-detail__panel">
              <label>Chi tiết đầy đủ</label>
              <p>{selectedLog.detail}</p>
            </div>

            <div className="activity-log-detail__panel">
              <label>ID liên quan</label>
              <div className="activity-log-detail__tags">
                <span>Người dùng: {selectedLog.relatedIds.userId ?? "--"}</span>
                <span>Bài đăng: {selectedLog.relatedIds.postId ?? "--"}</span>
                <span>Cửa hàng: {selectedLog.relatedIds.shopId ?? "--"}</span>
                <span>Vị trí: {selectedLog.relatedIds.slotId ?? "--"}</span>
                <span>Danh mục: {selectedLog.relatedIds.categoryId ?? "--"}</span>
              </div>
            </div>
          </div>
        ) : null}
      </BaseModal>
    </div>
  );
}

export default ActivityLogPage;
