import "./UsersPage.css";

type User = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  status: "Active" | "Locked";
  joinedAt: string;
};

const users: User[] = [
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

function UsersPage() {
  return (
    <div className="users-page">
      <div className="users-page__header">
        <div>
          <h2>Users Management</h2>
          <p>Manage user accounts, roles, and account status.</p>
        </div>

        <button className="users-page__add-btn" type="button">
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
                    <button type="button" className="users-actions__view">
                      View
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
    </div>
  );
}

export default UsersPage;
