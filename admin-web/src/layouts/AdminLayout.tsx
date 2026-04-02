import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "./AdminLayout.css";

const menuItems = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Users", path: "/users" },
  { label: "Activity Log", path: "/activity-log" },
  { label: "Shops", path: "/shops" },
  { label: "Categories", path: "/categories" },
  { label: "Attributes", path: "/attributes" },
  { label: "Category Mapping", path: "/category-attributes" },
  { label: "Templates", path: "/templates" },
  { label: "Template Builder", path: "/template-builder" },
  { label: "Settings", path: "/settings" },
  { label: "Placement Slots", path: "/placement-slots" },
  { label: "Promotion Packages", path: "/promotion-packages" },
  { label: "Boosted Posts", path: "/boosted-posts" },
  { label: "Promotions", path: "/promotions" },
  { label: "Analytics", path: "/analytics" },
  { label: "Revenue", path: "/revenue" },
  { label: "Customer Spending", path: "/customer-spending" },
  { label: "Export CSV", path: "/export" },
];

type AdminProfile = {
  name?: string;
  email?: string;
};

const getStoredProfile = (): AdminProfile | null => {
  const profileText =
    localStorage.getItem("adminProfile") ||
    sessionStorage.getItem("adminProfile");

  if (!profileText) return null;

  try {
    const parsed = JSON.parse(profileText) as AdminProfile | null;

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return {
      name: typeof parsed.name === "string" ? parsed.name : undefined,
      email: typeof parsed.email === "string" ? parsed.email : undefined,
    };
  } catch {
    localStorage.removeItem("adminProfile");
    sessionStorage.removeItem("adminProfile");
    return null;
  }
};

function AdminLayout() {
  const navigate = useNavigate();
  const profile = getStoredProfile();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminProfile");
    sessionStorage.removeItem("adminToken");
    sessionStorage.removeItem("adminProfile");
    navigate("/login", { replace: true });
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <h2>GreenMarket</h2>
          <span>Admin Panel</span>
        </div>

        <nav className="admin-sidebar__nav">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive
                  ? "admin-sidebar__link admin-sidebar__link--active"
                  : "admin-sidebar__link"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <div>
            <h1>GreenMarket Admin</h1>
            <p>Plant marketplace management system</p>
          </div>

          <div className="admin-header__profile">
            <div className="admin-header__profile-info">
              <strong>{profile?.name || "Admin"}</strong>
              <span>{profile?.email || "admin@greenmarket.com"}</span>
            </div>

            <button
              type="button"
              className="admin-header__logout"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
