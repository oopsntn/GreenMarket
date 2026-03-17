import { NavLink, Outlet } from "react-router-dom";
import "./AdminLayout.css";

const menuItems = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Users", path: "/users" },
  { label: "Categories", path: "/categories" },
  { label: "Attributes", path: "/attributes" },
  { label: "Category Mapping", path: "/category-attributes" },
  { label: "Templates", path: "/templates" },
  { label: "Settings", path: "/settings" },
  { label: "Promotions", path: "/promotions" },
  { label: "Analytics", path: "/analytics" },
  { label: "Revenue", path: "/revenue" },
];

function AdminLayout() {
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
            <span>Admin</span>
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
