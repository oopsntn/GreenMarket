import { useMemo, useState } from "react";
import BaseModal from "../components/BaseModal";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import SearchToolbar from "../components/SearchToolbar";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import ToastContainer, { type ToastItem } from "../components/ToastContainer";
import { emptyUserForm } from "../mock-data/users";
import { userService } from "../services/userService";
import type {
  AssignableUserRole,
  FlattenedUserActivityItem,
  User,
  UserFormState,
  UserRoleCountItem,
  UserSummaryCard,
} from "../types/user";
import "./UsersPage.css";

const assignableRoles: AssignableUserRole[] = [
  "Customer",
  "Manager",
  "Host",
  "Collaborator",
  "Operations Staff",
];

type ConfirmState = {
  isOpen: boolean;
  userId: number | null;
  action: "lock" | "unlock" | null;
};

function UsersPage() {
  const [users, setUsers] = useState<User[]>(userService.getUsers());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState<UserFormState>(emptyUserForm);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    userId: null,
    action: null,
  });
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const selectedUser =
    selectedUserId !== null
      ? (users.find((user) => user.id === selectedUserId) ?? null)
      : null;

  const confirmUser =
    confirmState.userId !== null
      ? (users.find((user) => user.id === confirmState.userId) ?? null)
      : null;

  const isProtectedAdmin = selectedUser?.role === "Admin";

  const summaryCards: UserSummaryCard[] = userService.getSummaryCards(users);
  const roleCounts: UserRoleCountItem[] = userService.getRoleCounts(users);
  const recentActivities: FlattenedUserActivityItem[] =
    userService.getRecentActivityLogs(users);

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

  const openAddModal = () => {
    setModalMode("add");
    setSelectedUserId(null);
    setFormData(emptyUserForm);
    setIsModalOpen(true);
  };

  const openViewModal = (user: User) => {
    setModalMode("view");
    setSelectedUserId(user.id);

    if (user.role === "Admin") {
      setFormData({
        fullName: user.fullName,
        email: user.email,
        role: "Customer",
      });
    } else {
      setFormData({
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      });
    }

    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    if (user.role === "Admin") return;

    setModalMode("edit");
    setSelectedUserId(user.id);
    setFormData({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedUserId(null);
    setIsModalOpen(false);
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

  const handleConfirmAction = () => {
    if (confirmState.userId === null || confirmState.action === null) return;

    const userId = confirmState.userId;
    const action = confirmState.action;

    const targetUser = users.find((user) => user.id === userId);

    setUsers((prev) =>
      userService.updateUserStatus(
        prev,
        userId,
        action === "lock" ? "Locked" : "Active",
      ),
    );

    if (action === "lock") {
      showToast(
        `${targetUser?.fullName ?? "User"} has been locked successfully.`,
      );
    } else {
      showToast(
        `${targetUser?.fullName ?? "User"} has been unlocked successfully.`,
      );
    }

    closeConfirmDialog();
  };
  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (modalMode === "add") {
      setUsers((prev) => userService.createUser(prev, formData));
      showToast("User added successfully.");
    }

    if (modalMode === "edit" && selectedUserId !== null) {
      setUsers((prev) =>
        userService.updateUser(prev, selectedUserId, formData),
      );
      showToast("User updated successfully.");
    }

    closeModal();
  };

  const filteredUsers = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    if (!keyword) return users;

    return users.filter((user) => {
      return (
        user.fullName.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword)
      );
    });
  }, [users, searchKeyword]);

  const modalTitle =
    modalMode === "add"
      ? "Add User"
      : modalMode === "edit"
        ? "Edit User"
        : "User Details";

  const modalDescription =
    modalMode === "add"
      ? "Create a new internal user account and assign the appropriate role. New accounts are created as active by default."
      : modalMode === "edit"
        ? "Update user account information and role assignment. Use Lock or Unlock in the table to change status."
        : "Review user account information, role assignment history, and recent access activity.";

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
        description="Manage user accounts, roles, and account status."
        actionLabel="+ Add User"
        onActionClick={openAddModal}
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
        placeholder="Search by name or email"
        searchValue={searchKeyword}
        onSearchChange={setSearchKeyword}
      />

      <SectionCard
        title="User Directory"
        description="Review account information, role assignment, and account status."
      >
        {filteredUsers.length === 0 ? (
          <EmptyState
            title="No users found"
            description="No users match your current search. Try changing the keyword or create a new user."
          />
        ) : (
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined Date</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>#{user.id}</td>
                    <td>{user.fullName}</td>
                    <td>{user.email}</td>
                    <td>
                      <StatusBadge label={user.role} variant="role" />
                    </td>
                    <td>
                      <StatusBadge
                        label={user.status}
                        variant={user.status === "Active" ? "active" : "locked"}
                      />
                    </td>
                    <td>{user.joinedAt}</td>
                    <td>
                      <div className="users-actions">
                        <button
                          type="button"
                          className="users-actions__view"
                          onClick={() => openViewModal(user)}
                        >
                          View
                        </button>

                        <button
                          type="button"
                          className="users-actions__edit"
                          onClick={() => openEditModal(user)}
                          disabled={user.role === "Admin"}
                        >
                          Edit
                        </button>

                        {user.role === "Admin" ? (
                          <button
                            type="button"
                            className="users-actions__disabled"
                            disabled
                          >
                            Protected
                          </button>
                        ) : user.status === "Active" ? (
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
                            onClick={() => openConfirmDialog(user.id, "unlock")}
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
        )}
      </SectionCard>

      <div className="users-insight-grid">
        <SectionCard
          title="Role Assignment Overview"
          description="Track how many accounts are assigned to each role."
        >
          <div className="users-role-overview">
            {roleCounts.map((item) => (
              <div key={item.role} className="users-role-card">
                <div className="users-role-card__header">
                  <StatusBadge label={item.role} variant="role" />
                </div>
                <strong>{item.count}</strong>
                <span>
                  {item.count === 1 ? "account assigned" : "accounts assigned"}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Recent Account Activity"
          description="Latest user account changes recorded in the admin panel."
        >
          {recentActivities.length === 0 ? (
            <EmptyState
              title="No activity found"
              description="Recent user account actions will appear here once changes are made."
            />
          ) : (
            <div className="users-activity-table-wrapper">
              <table className="users-activity-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Action</th>
                    <th>Detail</th>
                    <th>Performed By</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivities.map((activity) => (
                    <tr key={`${activity.userId}-${activity.id}`}>
                      <td>{activity.userName}</td>
                      <td>{activity.action}</td>
                      <td>{activity.detail}</td>
                      <td>{activity.performedBy}</td>
                      <td>{activity.performedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      <BaseModal
        isOpen={isModalOpen}
        title={modalTitle}
        description={modalDescription}
        onClose={closeModal}
        maxWidth="760px"
      >
        <form className="users-modal__form" onSubmit={handleSubmit}>
          <div className="users-modal__grid">
            <div className="users-modal__field">
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                disabled={modalMode === "view"}
                placeholder="Enter full name"
              />
            </div>

            <div className="users-modal__field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled={modalMode === "view"}
                placeholder="Enter email"
              />
            </div>

            {isProtectedAdmin ? (
              <div className="users-modal__field">
                <label>Role</label>
                <input type="text" value="Admin" disabled />
              </div>
            ) : (
              <div className="users-modal__field">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  disabled={modalMode === "view"}
                >
                  {assignableRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {modalMode === "view" && selectedUser ? (
              <>
                <div className="users-modal__field">
                  <label>Status</label>
                  <input type="text" value={selectedUser.status} disabled />
                </div>

                <div className="users-modal__field">
                  <label>Joined Date</label>
                  <input type="text" value={selectedUser.joinedAt} disabled />
                </div>
              </>
            ) : null}
          </div>

          {isProtectedAdmin && (
            <div className="users-modal__notice">
              This is the only system Admin account. Role and status cannot be
              changed.
            </div>
          )}

          {modalMode === "view" && selectedUser ? (
            <>
              <div className="users-modal__section">
                <div className="users-modal__section-header">
                  <h4>Role Assignment History</h4>
                  <p>
                    Review how this account's role has been assigned over time.
                  </p>
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
                      {selectedUser.roleAssignments.map((item) => (
                        <tr key={item.id}>
                          <td>{item.role}</td>
                          <td>{item.assignedBy}</td>
                          <td>{item.assignedAt}</td>
                          <td>{item.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="users-modal__section">
                <div className="users-modal__section-header">
                  <h4>Recent Activity</h4>
                  <p>Latest account actions performed for this user.</p>
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
                      {selectedUser.activityLogs.map((item) => (
                        <tr key={item.id}>
                          <td>{item.action}</td>
                          <td>{item.detail}</td>
                          <td>{item.performedBy}</td>
                          <td>{item.performedAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}

          <div className="users-modal__actions">
            <button
              type="button"
              className="users-modal__cancel"
              onClick={closeModal}
            >
              Close
            </button>

            {modalMode !== "view" && (
              <button type="submit" className="users-modal__submit">
                {modalMode === "add" ? "Add User" : "Save Changes"}
              </button>
            )}
          </div>
        </form>
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
        onConfirm={handleConfirmAction}
        onCancel={closeConfirmDialog}
      />

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default UsersPage;
