import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BaseModal from "../components/BaseModal";
import ConfirmDialog from "../components/ConfirmDialog";
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
  UserSummaryCard,
  UserStatus,
} from "../types/user";
import "./UsersPage.css";

const statusFilterOptions: Array<UserStatus | "All"> = [
  "All",
  "Active",
  "Locked",
];
const profileFilterOptions = [
  "All",
  "Has Email",
  "Missing Email",
  "Has Location",
  "Missing Location",
] as const;

const USER_PAGE_SIZE = 5;

type ProfileFilterOption = (typeof profileFilterOptions)[number];

type ConfirmState = {
  isOpen: boolean;
  userId: number | null;
  action: "lock" | "unlock" | null;
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
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<
    UserStatus | "All"
  >("All");
  const [selectedProfileFilter, setSelectedProfileFilter] =
    useState<ProfileFilterOption>("All");
  const [showFilters, setShowFilters] = useState(false);
  const [userPage, setUserPage] = useState(1);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    userId: null,
    action: null,
  });
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const summaryCards: UserSummaryCard[] = userService.getSummaryCards(users);
  const usersWithEmailCount = users.filter(
    (user) => user.email !== "No email",
  ).length;
  const usersMissingLocationCount = users.filter(
    (user) => user.location === "No location",
  ).length;
  const usersWithoutLoginCount = users.filter(
    (user) => user.lastLoginAt === "No login yet",
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

  const loadUsers = async (showSuccessToast = false) => {
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
        showToast("User directory refreshed successfully.");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load users.";
      setError(message);
      showToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

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
        err instanceof Error ? err.message : "Unable to load user details.",
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
      showToast("This user already has the selected marketplace role.", "info");
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
      showToast(`${updatedUser.fullName} is now assigned as ${selectedRole}.`);
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : "Unable to save marketplace role assignment.",
        "error",
      );
    } finally {
      setIsRoleSaving(false);
    }
  };

  const openConfirmDialog = (userId: number, action: "lock" | "unlock") => {
    setConfirmState({
      isOpen: true,
      userId,
      action,
    });
  };

  const closeConfirmDialog = () => {
    setConfirmState({
      isOpen: false,
      userId: null,
      action: null,
    });
  };

  const handleConfirmAction = async () => {
    if (confirmState.userId === null || confirmState.action === null) return;

    const targetUser = users.find((user) => user.id === confirmState.userId);

    try {
      const updatedUser = await userService.updateUserStatusById(
        confirmState.userId,
        confirmState.action === "lock" ? "Locked" : "Active",
      );

      setUsers((prev) =>
        prev.map((user) => (user.id === updatedUser.id ? updatedUser : user)),
      );

      setSelectedUser((prev) =>
        prev && prev.id === updatedUser.id ? updatedUser : prev,
      );

      showToast(
        `${targetUser?.fullName ?? "User"} has been ${
          confirmState.action === "lock" ? "locked" : "unlocked"
        } successfully.`,
      );
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Unable to update user status.",
        "error",
      );
    } finally {
      closeConfirmDialog();
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
        selectedProfileFilter === "All" ||
        (selectedProfileFilter === "Has Email" && user.email !== "No email") ||
        (selectedProfileFilter === "Missing Email" &&
          user.email === "No email") ||
        (selectedProfileFilter === "Has Location" &&
          user.location !== "No location") ||
        (selectedProfileFilter === "Missing Location" &&
          user.location === "No location");

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

  const confirmUser =
    confirmState.userId !== null
      ? (users.find((user) => user.id === confirmState.userId) ?? null)
      : null;

  const confirmTitle =
    confirmState.action === "lock"
      ? "Lock User Account"
      : "Unlock User Account";

  const confirmMessage =
    confirmState.action === "lock"
      ? `Are you sure you want to lock ${
          confirmUser?.fullName ?? "this user"
        }? They may lose access until reactivated.`
      : `Are you sure you want to unlock ${
          confirmUser?.fullName ?? "this user"
        }? They will be able to access the system again.`;

  return (
    <div className="users-page">
      <PageHeader
        title="Users Management"
        description="Manage marketplace user accounts, account status, and profile quality signals."
        actionLabel="Refresh Directory"
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
        placeholder="Search by name, phone, email, or location"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
        onFilterClick={() => setShowFilters((prev) => !prev)}
        filterLabel="Filter by status & profile"
        filterSummaryItems={[selectedStatusFilter, selectedProfileFilter]}
      />

      {showFilters && (
        <SectionCard
          title="User Filters"
          description="Refine the user directory by account status and profile completeness."
        >
          <div className="users-filters">
            <div className="users-filters__field">
              <label htmlFor="users-status-filter">Status</label>
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
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="users-filters__field">
              <label htmlFor="users-profile-filter">Profile Signal</label>
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
        title="User Directory"
        description="Review user account information, contact details, and account status."
      >
        {isLoading ? (
          <div className="users-empty-state">Loading user directory...</div>
        ) : error ? (
          <EmptyState title="Unable to load users" description={error} />
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            title="No users found"
            description="No users match your current search or filter settings."
          />
        ) : (
          <>
            <div className="users-table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Contact</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined Date</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="users-user-cell">
                          <strong>{user.fullName}</strong>
                          <span>User #{user.id}</span>
                        </div>
                      </td>
                      <td>
                        <div className="users-contact-cell">
                          <strong>{user.phone}</strong>
                          <span>{user.email}</span>
                        </div>
                      </td>
                      <td>
                        <StatusBadge label={user.role} variant="type" />
                      </td>
                      <td>
                        <StatusBadge
                          label={user.status}
                          variant={
                            user.status === "Active" ? "active" : "locked"
                          }
                        />
                      </td>
                      <td>{user.joinedAt || "Unknown"}</td>
                      <td>{user.lastLoginAt}</td>
                      <td>
                        <div className="users-actions">
                          <button
                            type="button"
                            className="users-actions__view"
                            onClick={() => void openViewModal(user)}
                          >
                            View
                          </button>

                          {user.status === "Active" ? (
                            <button
                              type="button"
                              className="users-actions__lock"
                              onClick={() => openConfirmDialog(user.id, "lock")}
                            >
                              Lock
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="users-actions__unlock"
                              onClick={() =>
                                openConfirmDialog(user.id, "unlock")
                              }
                            >
                              Unlock
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
                Page {userPage} of {totalUserPages}
              </span>

              <div className="users-table-pagination__actions">
                <button
                  type="button"
                  onClick={() => setUserPage((prev) => Math.max(1, prev - 1))}
                  disabled={userPage === 1}
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setUserPage((prev) => Math.min(totalUserPages, prev + 1))
                  }
                  disabled={userPage === totalUserPages}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </SectionCard>

      <div className="users-insight-grid">
        <SectionCard
          title="Profile Coverage Overview"
          description="Track contact completeness and location availability across marketplace users."
        >
          <div className="users-role-overview">
            <div className="users-role-card">
              <strong>{usersWithEmailCount}</strong>
              <span>profiles with email</span>
            </div>
            <div className="users-role-card">
              <strong>{Math.max(users.length - usersWithEmailCount, 0)}</strong>
              <span>profiles missing email</span>
            </div>
            <div className="users-role-card">
              <strong>{usersMissingLocationCount}</strong>
              <span>profiles missing location</span>
            </div>
            <div className="users-role-card">
              <strong>{usersWithoutLoginCount}</strong>
              <span>profiles without login yet</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Activity Log Shortcut"
          description="Recent derived activity is shown here, and you can open the full Activity Log screen for deeper filtering."
          actions={
            <Link className="users-shortcut-link" to="/activity-log">
              Open Full Log
            </Link>
          }
        >
          {recentActivities.length === 0 ? (
            <div className="users-empty-state">
              No recent activity is available yet.
            </div>
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
                  </div>
                  <div className="users-shortcut-item__meta">
                    <StatusBadge
                      label={activity.action}
                      variant={
                        activity.action.includes("Locked")
                          ? "locked"
                          : activity.action.includes("Login")
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
        title="User Details"
        description="Review user profile details and the derived account activity timeline."
        onClose={closeModal}
        maxWidth="760px"
      >
        {isDetailLoading && !selectedUser ? (
          <div className="users-empty-state">Loading user details...</div>
        ) : selectedUser ? (
          <div className="users-modal__form">
            <div className="users-modal__grid">
              <div className="users-modal__field">
                <label>Full Name</label>
                <input type="text" value={selectedUser.fullName} disabled />
              </div>
              <div className="users-modal__field">
                <label>Phone</label>
                <input type="text" value={selectedUser.phone} disabled />
              </div>
              <div className="users-modal__field">
                <label>Email</label>
                <input type="text" value={selectedUser.email} disabled />
              </div>
              <div className="users-modal__field">
                <label>Status</label>
                <input type="text" value={selectedUser.status} disabled />
              </div>
              <div className="users-modal__field">
                <label htmlFor="user-role-assignment">Marketplace Role</label>
                <select
                  id="user-role-assignment"
                  value={selectedRole}
                  onChange={(event) =>
                    setSelectedRole(event.target.value as AssignableUserRole)
                  }
                >
                  {assignableRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              <div className="users-modal__field">
                <label>Location</label>
                <input type="text" value={selectedUser.location} disabled />
              </div>
              <div className="users-modal__field">
                <label>Last Login</label>
                <input type="text" value={selectedUser.lastLoginAt} disabled />
              </div>
            </div>

            <div className="users-modal__section">
              <div className="users-modal__section-header">
                <h4>Role Assignment</h4>
                <p>
                  Role catalog is maintained in Roles Management, while
                  user-level role assignment is handled here in the Users
                  directory.
                </p>
              </div>

              <div className="users-role-assignment">
                <div className="users-role-assignment__summary">
                  <strong>Current role: {selectedUser.role}</strong>
                  <span>
                    Use this control to assign the selected marketplace role to
                    the user account.
                  </span>
                </div>

                <button
                  type="button"
                  className="users-role-assignment__submit"
                  onClick={() => void handleSaveRoleAssignment()}
                  disabled={isRoleSaving}
                >
                  {isRoleSaving ? "Saving..." : "Save Role Assignment"}
                </button>
              </div>

              <div className="users-modal__history-table-wrapper">
                <table className="users-modal__history-table">
                  <thead>
                    <tr>
                      <th>Role</th>
                      <th>Assigned By</th>
                      <th>Assigned At</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedUser.roleAssignments.length === 0 ? (
                      <tr>
                        <td colSpan={4}>
                          No role assignment history available.
                        </td>
                      </tr>
                    ) : (
                      selectedUser.roleAssignments.map((item) => (
                        <tr key={item.id}>
                          <td>{item.role}</td>
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
                <h4>Derived Activity Timeline</h4>
                <p>
                  Timeline entries are generated from registration, login, and
                  account update data currently available from backend APIs.
                </p>
              </div>

              <div className="users-modal__history-table-wrapper">
                <table className="users-modal__history-table">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Detail</th>
                      <th>Performed By</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedUser.activityLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4}>No activity data available.</td>
                      </tr>
                    ) : (
                      selectedUser.activityLogs.map((item) => (
                        <tr key={item.id}>
                          <td>{item.action}</td>
                          <td>{item.detail}</td>
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
                Close
              </button>
            </div>
          </div>
        ) : (
          <EmptyState
            title="User detail unavailable"
            description="No user detail is available for the selected record."
          />
        )}
      </BaseModal>

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmTitle}
        message={confirmMessage}
        confirmText={
          confirmState.action === "lock" ? "Lock User" : "Unlock User"
        }
        cancelText="Cancel"
        tone={confirmState.action === "lock" ? "danger" : "success"}
        onConfirm={() => void handleConfirmAction()}
        onCancel={closeConfirmDialog}
      />

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default UsersPage;
