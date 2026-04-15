import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BaseModal from "../components/BaseModal";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { userService } from "../services/userService";
import type {
  AssignableUserRole,
  User,
  UserStatus,
  UserSummaryCard,
} from "../types/user";
import "./UsersPage.css";

const statusFilterOptions: Array<{
  value: UserStatus | "All";
  label: string;
}> = [
  { value: "All", label: "Tất cả" },
  { value: "Active", label: "Đang hoạt động" },
  { value: "Locked", label: "Đã khóa" },
];

const profileFilterOptions = [
  "Tất cả",
  "Có email",
  "Thiếu email",
  "Có địa chỉ",
  "Thiếu địa chỉ",
] as const;

const USER_PAGE_SIZE = 5;

type ProfileFilterOption = (typeof profileFilterOptions)[number];

type StatusActionState = {
  userId: number | null;
  action: "lock" | "unlock" | null;
};

const roleLabelMap: Record<AssignableUserRole, string> = {
  User: "Người dùng",
  Host: "Chủ shop",
  Collaborator: "Cộng tác viên",
  Manager: "Quản lý",
  "Operation Staff": "Nhân viên vận hành",
};

const statusLabelMap: Record<UserStatus, string> = {
  Active: "Đang hoạt động",
  Locked: "Đã khóa",
};

function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<AssignableUserRole>("User");
  const [assignableRoles, setAssignableRoles] = useState<AssignableUserRole[]>([
    "User",
  ]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isRoleSaving, setIsRoleSaving] = useState(false);
  const [isStatusSaving, setIsStatusSaving] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<
    UserStatus | "All"
  >("All");
  const [selectedProfileFilter, setSelectedProfileFilter] =
    useState<ProfileFilterOption>("Tất cả");
  const [showFilters, setShowFilters] = useState(false);
  const [userPage, setUserPage] = useState(1);
  const [statusActionState, setStatusActionState] = useState<StatusActionState>({
    userId: null,
    action: null,
  });
  const [statusReason, setStatusReason] = useState("");
  const [statusReasonError, setStatusReasonError] = useState("");
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const summaryCards: UserSummaryCard[] = userService.getSummaryCards(users);
  const usersWithEmailCount = users.filter(
    (user) => user.email !== "Chưa có email",
  ).length;
  const usersMissingLocationCount = users.filter(
    (user) => user.location === "Chưa có địa chỉ",
  ).length;
  const usersWithoutLoginCount = users.filter(
    (user) => user.lastLoginAt === "Chưa đăng nhập",
  ).length;

  const showToast = (message: string, tone: ToastItem["tone"] = "success") => {
    const toastId = Date.now() + Math.random();

    setToasts((prev) => [
      ...prev,
      {
        id: toastId,
        message,
        tone,
      },
    ]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
    }, 2600);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const loadUsers = useCallback(async (showSuccessToast = false) => {
    try {
      setIsLoading(true);
      setError("");

      const [nextUsers, nextAssignableRoles] = await Promise.all([
        userService.fetchUsers(),
        userService.getAssignableRoles(),
      ]);

      setUsers(nextUsers);
      setAssignableRoles(nextAssignableRoles);

      if (showSuccessToast) {
        showToast("Đã tải lại danh sách người dùng.");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Không thể tải danh sách người dùng.";
      setError(message);
      showToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const openViewModal = async (user: User) => {
    setSelectedUser(user);
    setSelectedRole(user.role as AssignableUserRole);
    setIsModalOpen(true);
    setIsDetailLoading(true);

    try {
      const detail = await userService.fetchUserById(user.id);
      setSelectedUser(detail);
      setSelectedRole(detail.role as AssignableUserRole);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Không thể tải chi tiết người dùng.",
        "error",
      );
    } finally {
      setIsDetailLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedUser(null);
    setSelectedRole("User");
    setIsModalOpen(false);
  };

  const handleSaveRoleAssignment = async () => {
    if (!selectedUser || selectedUser.role === selectedRole) {
      showToast("Người dùng này đã có đúng vai trò đang chọn.", "info");
      return;
    }

    try {
      setIsRoleSaving(true);

      const updatedUser = await userService.assignUserRoleById(
        selectedUser.id,
        selectedRole,
      );

      setUsers((prev) =>
        prev.map((user) => (user.id === updatedUser.id ? updatedUser : user)),
      );
      setSelectedUser(updatedUser);
      showToast(
        `Đã cập nhật vai trò ${roleLabelMap[selectedRole]} cho ${updatedUser.fullName}.`,
      );
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : "Không thể lưu vai trò nghiệp vụ.",
        "error",
      );
    } finally {
      setIsRoleSaving(false);
    }
  };

  const openStatusModal = (userId: number, action: "lock" | "unlock") => {
    setStatusActionState({ userId, action });
    setStatusReason("");
    setStatusReasonError("");
  };

  const closeStatusModal = () => {
    setStatusActionState({ userId: null, action: null });
    setStatusReason("");
    setStatusReasonError("");
  };

  const handleConfirmAction = async () => {
    if (statusActionState.userId === null || statusActionState.action === null) {
      return;
    }

    if (!statusReason.trim()) {
      setStatusReasonError("Vui lòng nhập lý do thực hiện thao tác này.");
      return;
    }

    const targetUser = users.find((user) => user.id === statusActionState.userId);

    try {
      setIsStatusSaving(true);
      const updatedUser = await userService.updateUserStatusById(
        statusActionState.userId,
        statusActionState.action === "lock" ? "Locked" : "Active",
        statusReason.trim(),
      );

      setUsers((prev) =>
        prev.map((user) => (user.id === updatedUser.id ? updatedUser : user)),
      );

      setSelectedUser((prev) =>
        prev && prev.id === updatedUser.id ? updatedUser : prev,
      );

      showToast(
        `${targetUser?.fullName ?? "Người dùng"} đã được ${
          statusActionState.action === "lock" ? "khóa" : "mở khóa"
        } thành công.`,
      );
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : "Không thể cập nhật trạng thái người dùng.",
        "error",
      );
    } finally {
      setIsStatusSaving(false);
      closeStatusModal();
    }
  };

  const filteredUsers = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return users.filter((user) => {
      const matchesKeyword =
        !keyword ||
        user.fullName.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword) ||
        user.phone.toLowerCase().includes(keyword) ||
        user.location.toLowerCase().includes(keyword);

      const matchesStatus =
        selectedStatusFilter === "All" || user.status === selectedStatusFilter;

      const matchesProfile =
        selectedProfileFilter === "Tất cả" ||
        (selectedProfileFilter === "Có email" && user.email !== "Chưa có email") ||
        (selectedProfileFilter === "Thiếu email" &&
          user.email === "Chưa có email") ||
        (selectedProfileFilter === "Có địa chỉ" &&
          user.location !== "Chưa có địa chỉ") ||
        (selectedProfileFilter === "Thiếu địa chỉ" &&
          user.location === "Chưa có địa chỉ");

      return matchesKeyword && matchesStatus && matchesProfile;
    });
  }, [users, searchKeyword, selectedStatusFilter, selectedProfileFilter]);

  const totalUserPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / USER_PAGE_SIZE),
  );

  const paginatedUsers = useMemo(() => {
    const startIndex = (userPage - 1) * USER_PAGE_SIZE;
    return filteredUsers.slice(startIndex, startIndex + USER_PAGE_SIZE);
  }, [filteredUsers, userPage]);

  const recentActivities = useMemo(() => {
    return userService.getRecentActivityLogs(users).slice(0, 5);
  }, [users]);

  useEffect(() => {
    setUserPage(1);
  }, [searchKeyword, selectedStatusFilter, selectedProfileFilter]);

  useEffect(() => {
    if (userPage > totalUserPages) {
      setUserPage(totalUserPages);
    }
  }, [userPage, totalUserPages]);

  const actionUser =
    statusActionState.userId !== null
      ? users.find((user) => user.id === statusActionState.userId) ?? null
      : null;

  const confirmTitle =
    statusActionState.action === "lock"
      ? "Khóa tài khoản người dùng"
      : "Mở khóa tài khoản người dùng";

  const confirmMessage =
    statusActionState.action === "lock"
      ? `Nhập lý do khóa tài khoản ${actionUser?.fullName ?? "người dùng này"}. Lý do sẽ được lưu vào nhật ký hoạt động.`
      : `Nhập lý do mở khóa tài khoản ${actionUser?.fullName ?? "người dùng này"}. Lý do sẽ được lưu vào nhật ký hoạt động.`;

  return (
    <div className="users-page">
      <PageHeader
        title="Quản lý người dùng marketplace"
        description="Quản lý tài khoản người dùng, trạng thái truy cập và vai trò nghiệp vụ theo mô hình mỗi người dùng chỉ có một vai trò."
        actionLabel="Tải lại danh sách"
        onActionClick={() => void loadUsers(true)}
      />

      <div className="users-summary-grid">
        {summaryCards.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
          />
        ))}
      </div>

      <SearchToolbar
        placeholder="Tìm theo tên, số điện thoại, email hoặc địa chỉ"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
        onFilterClick={() => setShowFilters((prev) => !prev)}
        filterLabel="Lọc theo trạng thái và hồ sơ"
        filterSummaryItems={[selectedStatusFilter, selectedProfileFilter]}
      />

      {showFilters && (
        <SectionCard
          title="Bộ lọc người dùng"
          description="Thu hẹp danh sách theo trạng thái tài khoản và độ đầy đủ của hồ sơ."
        >
          <div className="users-filters">
            <div className="users-filters__field">
              <label htmlFor="users-status-filter">Trạng thái</label>
              <select
                id="users-status-filter"
                value={selectedStatusFilter}
                onChange={(event) =>
                  setSelectedStatusFilter(
                    event.target.value as UserStatus | "All",
                  )
                }
              >
                {statusFilterOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="users-filters__field">
              <label htmlFor="users-profile-filter">Tín hiệu hồ sơ</label>
              <select
                id="users-profile-filter"
                value={selectedProfileFilter}
                onChange={(event) =>
                  setSelectedProfileFilter(
                    event.target.value as ProfileFilterOption,
                  )
                }
              >
                {profileFilterOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </SectionCard>
      )}

      <SectionCard
        title="Danh bạ người dùng"
        description="Xem thông tin tài khoản, liên hệ, vai trò hiện tại và trạng thái truy cập."
      >
        {isLoading ? (
          <div className="users-empty-state">Đang tải danh bạ người dùng...</div>
        ) : error ? (
          <EmptyState title="Không thể tải người dùng" description={error} />
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            title="Không tìm thấy người dùng"
            description="Không có người dùng nào khớp với bộ lọc hoặc từ khóa hiện tại."
          />
        ) : (
          <>
            <div className="users-table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Người dùng</th>
                    <th>Liên hệ</th>
                    <th>Vai trò</th>
                    <th>Trạng thái</th>
                    <th>Ngày tham gia</th>
                    <th>Lần đăng nhập cuối</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="users-user-cell">
                          <strong>{user.fullName}</strong>
                          <span>Mã người dùng #{user.id}</span>
                        </div>
                      </td>
                      <td>
                        <div className="users-contact-cell">
                          <strong>{user.phone}</strong>
                          <span>{user.email}</span>
                        </div>
                      </td>
                      <td>
                        <StatusBadge
                          label={roleLabelMap[user.role as AssignableUserRole]}
                          variant="type"
                        />
                      </td>
                      <td>
                        <StatusBadge
                          label={statusLabelMap[user.status]}
                          variant={
                            user.status === "Active" ? "active" : "locked"
                          }
                        />
                      </td>
                      <td>{user.joinedAt || "Chưa rõ"}</td>
                      <td>{user.lastLoginAt}</td>
                      <td>
                        <div className="users-actions">
                          <button
                            type="button"
                            className="users-actions__view"
                            onClick={() => void openViewModal(user)}
                          >
                            Xem
                          </button>

                          {user.status === "Active" ? (
                            <button
                              type="button"
                              className="users-actions__lock"
                              onClick={() => openStatusModal(user.id, "lock")}
                            >
                              Khóa
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="users-actions__unlock"
                              onClick={() => openStatusModal(user.id, "unlock")}
                            >
                              Mở khóa
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="users-table-pagination">
              <span className="users-table-pagination__info">
                Trang {userPage} / {totalUserPages}
              </span>

              <div className="users-table-pagination__actions">
                <button
                  type="button"
                  onClick={() => setUserPage((prev) => Math.max(1, prev - 1))}
                  disabled={userPage === 1}
                >
                  Trước
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setUserPage((prev) => Math.min(totalUserPages, prev + 1))
                  }
                  disabled={userPage === totalUserPages}
                >
                  Sau
                </button>
              </div>
            </div>
          </>
        )}
      </SectionCard>

      <div className="users-insight-grid">
        <SectionCard
          title="Tổng quan độ đầy đủ hồ sơ"
          description="Theo dõi độ đầy đủ của email, địa chỉ và tình trạng đăng nhập của người dùng marketplace."
        >
          <div className="users-role-overview">
            <div className="users-role-card">
              <strong>{usersWithEmailCount}</strong>
              <span>hồ sơ có email</span>
            </div>
            <div className="users-role-card">
              <strong>{Math.max(users.length - usersWithEmailCount, 0)}</strong>
              <span>hồ sơ thiếu email</span>
            </div>
            <div className="users-role-card">
              <strong>{usersMissingLocationCount}</strong>
              <span>hồ sơ thiếu địa chỉ</span>
            </div>
            <div className="users-role-card">
              <strong>{usersWithoutLoginCount}</strong>
              <span>tài khoản chưa từng đăng nhập</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Lối tắt tới nhật ký hoạt động"
          description="Xem nhanh các hoạt động gần đây. Màn Nhật ký hoạt động là nơi lọc sâu và đối chiếu toàn bộ lịch sử hệ thống."
          actions={
            <Link className="users-shortcut-link" to="/activity-log">
              Mở nhật ký đầy đủ
            </Link>
          }
        >
          {recentActivities.length === 0 ? (
            <div className="users-empty-state">Chưa có hoạt động gần đây.</div>
          ) : (
            <div className="users-shortcut-list">
              {recentActivities.map((activity) => (
                <div
                  key={`${activity.userId}-${activity.id}`}
                  className="users-shortcut-item"
                >
                  <div className="users-shortcut-item__main">
                    <strong>{activity.userName}</strong>
                    <span>{activity.detail}</span>
                    {activity.reason ? <small>Lý do: {activity.reason}</small> : null}
                  </div>
                  <div className="users-shortcut-item__meta">
                    <StatusBadge
                      label={activity.action}
                      variant={
                        activity.action.includes("Khóa")
                          ? "locked"
                          : activity.action.includes("đăng nhập")
                            ? "processing"
                            : "active"
                      }
                    />
                    <small>{activity.performedAt}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <BaseModal
        isOpen={isModalOpen}
        title="Chi tiết người dùng"
        description="Xem hồ sơ người dùng, cập nhật vai trò nghiệp vụ duy nhất và theo dõi lịch sử thao tác từ backend."
        onClose={closeModal}
        maxWidth="760px"
      >
        {isDetailLoading && !selectedUser ? (
          <div className="users-empty-state">Đang tải chi tiết người dùng...</div>
        ) : selectedUser ? (
          <div className="users-modal__form">
            <div className="users-modal__grid">
              <div className="users-modal__field">
                <label>Họ và tên</label>
                <input type="text" value={selectedUser.fullName} disabled />
              </div>
              <div className="users-modal__field">
                <label>Số điện thoại</label>
                <input type="text" value={selectedUser.phone} disabled />
              </div>
              <div className="users-modal__field">
                <label>Email</label>
                <input type="text" value={selectedUser.email} disabled />
              </div>
              <div className="users-modal__field">
                <label>Trạng thái</label>
                <input
                  type="text"
                  value={statusLabelMap[selectedUser.status]}
                  disabled
                />
              </div>
              <div className="users-modal__field">
                <label htmlFor="user-role-assignment">Vai trò nghiệp vụ</label>
                <select
                  id="user-role-assignment"
                  value={selectedRole}
                  onChange={(event) =>
                    setSelectedRole(event.target.value as AssignableUserRole)
                  }
                >
                  {assignableRoles.map((role) => (
                    <option key={role} value={role}>
                      {roleLabelMap[role]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="users-modal__field">
                <label>Địa chỉ</label>
                <input type="text" value={selectedUser.location} disabled />
              </div>
              <div className="users-modal__field">
                <label>Lần đăng nhập cuối</label>
                <input type="text" value={selectedUser.lastLoginAt} disabled />
              </div>
            </div>

            <div className="users-modal__section">
              <div className="users-modal__section-header">
                <h4>Vai trò nghiệp vụ</h4>
                <p>
                  Mỗi người dùng chỉ có một vai trò nghiệp vụ tại một thời điểm.
                  Khi đổi vai trò, hệ thống sẽ ghi lại vai trò cũ và vai trò mới.
                </p>
              </div>

              <div className="users-role-assignment">
                <div className="users-role-assignment__summary">
                  <strong>
                    Vai trò hiện tại:{" "}
                    {roleLabelMap[selectedUser.role as AssignableUserRole]}
                  </strong>
                  <span>
                    Chọn đúng một vai trò để đồng bộ với nghiệp vụ thực tế của tài
                    khoản này.
                  </span>
                </div>

                <button
                  type="button"
                  className="users-role-assignment__submit"
                  onClick={() => void handleSaveRoleAssignment()}
                  disabled={isRoleSaving}
                >
                  {isRoleSaving ? "Đang lưu..." : "Lưu vai trò"}
                </button>
              </div>

              <div className="users-modal__history-table-wrapper">
                <table className="users-modal__history-table">
                  <thead>
                    <tr>
                      <th>Vai trò cũ</th>
                      <th>Vai trò mới</th>
                      <th>Người cập nhật</th>
                      <th>Thời gian</th>
                      <th>Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedUser.roleAssignments.length === 0 ? (
                      <tr>
                        <td colSpan={5}>Chưa có lịch sử thay đổi vai trò.</td>
                      </tr>
                    ) : (
                      selectedUser.roleAssignments.map((item) => (
                        <tr key={item.id}>
                          <td>
                            {item.previousRole
                              ? roleLabelMap[item.previousRole as AssignableUserRole]
                              : "Chưa gán"}
                          </td>
                          <td>
                            {roleLabelMap[item.role as AssignableUserRole]}
                          </td>
                          <td>{item.assignedBy}</td>
                          <td>{item.assignedAt}</td>
                          <td>{item.note}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="users-modal__section">
              <div className="users-modal__section-header">
                <h4>Dòng thời gian hoạt động</h4>
                <p>
                  Nhật ký này lấy từ dữ liệu backend, bao gồm khóa hoặc mở khóa tài
                  khoản, thay đổi vai trò và các hoạt động hệ thống liên quan.
                </p>
              </div>

              <div className="users-modal__history-table-wrapper">
                <table className="users-modal__history-table">
                  <thead>
                    <tr>
                      <th>Hành động</th>
                      <th>Chi tiết</th>
                      <th>Người thực hiện</th>
                      <th>Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedUser.activityLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4}>Chưa có dữ liệu hoạt động.</td>
                      </tr>
                    ) : (
                      selectedUser.activityLogs.map((item) => (
                        <tr key={item.id}>
                          <td>{item.action}</td>
                          <td>
                            {item.detail}
                            {item.reason ? <div>Lý do: {item.reason}</div> : null}
                          </td>
                          <td>{item.performedBy}</td>
                          <td>{item.performedAt}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="users-modal__actions">
              <button
                type="button"
                className="users-modal__cancel"
                onClick={closeModal}
              >
                Đóng
              </button>
            </div>
          </div>
        ) : (
          <EmptyState
            title="Không có chi tiết người dùng"
            description="Không tìm thấy dữ liệu chi tiết cho bản ghi đang chọn."
          />
        )}
      </BaseModal>

      <BaseModal
        isOpen={Boolean(statusActionState.userId && statusActionState.action)}
        title={confirmTitle}
        description={confirmMessage}
        onClose={closeStatusModal}
        maxWidth="560px"
      >
        <div className="users-modal__form">
          <div className="users-modal__field">
            <label htmlFor="user-status-reason">Lý do</label>
            <textarea
              id="user-status-reason"
              rows={4}
              value={statusReason}
              onChange={(event) => {
                setStatusReason(event.target.value);
                if (statusReasonError) {
                  setStatusReasonError("");
                }
              }}
              placeholder={
                statusActionState.action === "lock"
                  ? "Nhập lý do khóa tài khoản"
                  : "Nhập lý do mở khóa tài khoản"
              }
            />
            {statusReasonError ? (
              <span className="users-modal__error">{statusReasonError}</span>
            ) : null}
          </div>

          <div className="users-modal__actions">
            <button
              type="button"
              className="users-modal__cancel"
              onClick={closeStatusModal}
              disabled={isStatusSaving}
            >
              Hủy
            </button>
            <button
              type="button"
              className="users-role-assignment__submit"
              onClick={() => void handleConfirmAction()}
              disabled={isStatusSaving}
            >
              {isStatusSaving
                ? "Đang lưu..."
                : statusActionState.action === "lock"
                  ? "Khóa người dùng"
                  : "Mở khóa người dùng"}
            </button>
          </div>
        </div>
      </BaseModal>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default UsersPage;
