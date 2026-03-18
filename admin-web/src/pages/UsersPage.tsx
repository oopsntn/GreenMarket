import { useState } from "react";
import { emptyUserForm } from "../mock-data/users";
import { userService } from "../services/userService";
import type { AssignableUserRole, User, UserFormState } from "../types/user";
import "./UsersPage.css";

const assignableRoles: AssignableUserRole[] = [
  "Customer",
  "Manager",
  "Host",
  "Collaborator",
  "Operations Staff",
];

function UsersPage() {
  const [users, setUsers] = useState<User[]>(userService.getUsers());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState<UserFormState>(emptyUserForm);

  const selectedUser =
    selectedUserId !== null
      ? (users.find((user) => user.id === selectedUserId) ?? null)
      : null;

  const isProtectedAdmin = selectedUser?.role === "Admin";

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
        status: user.status,
      });
    } else {
      setFormData({
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
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
      status: user.status,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
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
    }

    if (modalMode === "edit" && selectedUserId !== null) {
      setUsers((prev) =>
        userService.updateUser(prev, selectedUserId, formData),
      );
    }

    closeModal();
  };

  return (
    <div className="users-page">
      <div className="users-page__header">
        <div>
          <h2>Users Management</h2>
          <p>Manage user accounts, roles, and account status.</p>
        </div>

        <button
          className="users-page__add-btn"
          type="button"
          onClick={openAddModal}
        >
          + Add User
        </button>
      </div>

      <div className="users-toolbar">
        <input
          className="users-toolbar__search"
          type="text"
          placeholder="Search by name or email"
        />

        <button className="users-toolbar__filter-btn" type="button">
          Filter
        </button>
      </div>

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
            {users.map((user) => (
              <tr key={user.id}>
                <td>#{user.id}</td>
                <td>{user.fullName}</td>
                <td>{user.email}</td>
                <td>
                  <span className="users-badge users-badge--role">
                    {user.role}
                  </span>
                </td>
                <td>
                  <span
                    className={
                      user.status === "Active"
                        ? "users-badge users-badge--active"
                        : "users-badge users-badge--locked"
                    }
                  >
                    {user.status}
                  </span>
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
                      <button type="button" className="users-actions__lock">
                        Lock
                      </button>
                    ) : (
                      <button type="button" className="users-actions__unlock">
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

      {isModalOpen && (
        <div className="users-modal-backdrop">
          <div className="users-modal">
            <div className="users-modal__header">
              <div>
                <h3>
                  {modalMode === "add"
                    ? "Add User"
                    : modalMode === "edit"
                      ? "Edit User"
                      : "User Details"}
                </h3>
                <p>Manage user information and account settings.</p>
              </div>

              <button
                type="button"
                className="users-modal__close"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <form className="users-modal__form" onSubmit={handleSubmit}>
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

              <div className="users-modal__field">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={modalMode === "view" || isProtectedAdmin}
                >
                  <option>Active</option>
                  <option>Locked</option>
                </select>
              </div>

              {isProtectedAdmin && (
                <div className="users-modal__notice">
                  This is the only system Admin account. Role and status cannot
                  be changed.
                </div>
              )}

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
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersPage;
