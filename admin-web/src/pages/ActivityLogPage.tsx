import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { userService } from "../services/userService";
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
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedActionFilter, setSelectedActionFilter] = useState("All");
  const [selectedPerformerFilter, setSelectedPerformerFilter] = useState("All");
  const [page, setPage] = useState(1);

  const users = userService.getUsers();
  const activityLogs = useMemo(
    () => userService.getRecentActivityLogs(users),
    [users],
  );

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
        title="Activity Log"
        description="Review account activity, role assignment history, and admin actions in one dedicated log screen."
      />

      <div className="activity-log-summary-grid">
        <StatCard
          title="Total Log Entries"
          value={String(activityLogs.length)}
          subtitle="All user account actions"
        />
        <StatCard
          title="Today Activity"
          value={String(todayCount)}
          subtitle="Entries recorded today"
        />
        <StatCard
          title="Role Changes"
          value={String(roleEvents)}
          subtitle="Assignment and role update events"
        />
        <StatCard
          title="Lock Events"
          value={String(lockEvents)}
          subtitle="Access restriction actions"
        />
      </div>

      <SearchToolbar
        placeholder="Search by user, action, detail, or performer"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
        onFilterClick={() => setShowFilters((prev) => !prev)}
        filterLabel="Filter log"
        filterSummaryItems={[selectedActionFilter, selectedPerformerFilter]}
      />

      {showFilters ? (
        <SectionCard
          title="Log Filters"
          description="Refine activity records by action type and performer."
        >
          <div className="activity-log-filters">
            <div className="activity-log-filters__field">
              <label htmlFor="activity-log-action-filter">Action</label>
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
              <label htmlFor="activity-log-performer-filter">Performed By</label>
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
        title="Account Activity Directory"
        description="Follow account creation, role changes, status updates, and other admin-side actions."
      >
        {filteredLogs.length === 0 ? (
          <EmptyState
            title="No activity found"
            description="No activity log entries match the current search or filter settings."
          />
        ) : (
          <>
            <div className="activity-log-table-wrapper">
              <table className="activity-log-table">
                <thead>
                  <tr>
                    <th>Log</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Detail</th>
                    <th>Performed By</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedLogs.map((item: FlattenedUserActivityItem) => (
                    <tr key={`${item.userId}-${item.id}`}>
                      <td>#{item.id}</td>
                      <td>
                        <div className="activity-log-cell">
                          <strong>{item.userName}</strong>
                          <span>User #{item.userId}</span>
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
                Page {page} of {totalPages}
              </span>

              <div className="activity-log-pagination__actions">
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
          </>
        )}
      </SectionCard>
    </div>
  );
}

export default ActivityLogPage;
