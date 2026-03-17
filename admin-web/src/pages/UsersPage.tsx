import { useState } from "react";
import "./UsersPage.css";

type User = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  status: "Active" | "Locked";
  joinedAt: string;
};

const initialUsers: User[] = [
  {
    id: 1,
    fullName: "Nguyen Van A",
    email: "vana@greenmarket.vn",
    role: "Customer",
    status: "Active",
    joinedAt: "2026-03-10",
  },
  {
    id: 2,
    fullName: "Tran Thi B",
    email: "thib@greenmarket.vn",
    role: "Shop Owner",
    status: "Active",
    joinedAt: "2026-03-11",
  },
  {
    id: 3,
    fullName: "Le Van C",
    email: "vanc@greenmarket.vn",
    role: "Moderator",
    status: "Locked",
    joinedAt: "2026-03-12",
  },
  {
    id: 4,
    fullName: "Pham Thi D",
    email: "thid@greenmarket.vn",
    role: "Admin",
    status: "Active",
    joinedAt: "2026-03-13",
  },
];

type UserFormState = {
  fullName: string;
  email: string;
  role: string;
  status: "Active" | "Locked";
};

const emptyForm: UserFormState = {
  fullName: "",
  email: "",
  role: "Customer",
  status: "Active",
};

function UsersPage() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState<UserFormState>(emptyForm);

  const openAddModal = () => {
    setModalMode("add");
    setSelectedUserId(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openViewModal = (user: User) => {
    setModalMode("view");
    setSelectedUserId(user.id);
    setFormData({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
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
      const newUser: User = {
        id: users.length + 1,
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role,
        status: formData.status,
        joinedAt: "2026-03-18",
      };

      setUsers((prev) => [newUser, ...prev]);
    }

    if (modalMode === "edit" && selectedUserId !== null) {
      setUsers((prev) =>
        prev.map((user) =>
          user.id === selectedUserId
            ? {
                ...user,
                fullName: formData.fullName,
                email: formData.email,
                role: formData.role,
                status: formData.status,
              }
            : user,
        ),
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
                    >
                      Edit
                    </button>

                    {user.status === "Active" ? (
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

              <div className="users-modal__field">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  disabled={modalMode === "view"}
                >
                  <option>Customer</option>
                  <option>Shop Owner</option>
                  <option>Moderator</option>
                  <option>Admin</option>
                </select>
              </div>

              <div className="users-modal__field">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={modalMode === "view"}
                >
                  <option>Active</option>
                  <option>Locked</option>
                </select>
              </div>

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
