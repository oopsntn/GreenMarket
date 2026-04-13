import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { getVisibleAdminMenuItems } from "../utils/adminPermissions";
import { clearAdminSession, getAdminProfile } from "../utils/adminSession";
import "./AdminLayout.css";

function AdminLayout() {
  const navigate = useNavigate();
  const profile = getAdminProfile();
  const menuItems = getVisibleAdminMenuItems(profile);

  const handleLogout = () => {
    clearAdminSession();
    navigate("/login", { replace: true });
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <h2>GreenMarket</h2>
          <span>Trang quản trị</span>
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
            <h1>Quản trị GreenMarket</h1>
            <p>Hệ thống quản lý sàn cây cảnh</p>
          </div>

          <div className="admin-header__profile">
            <div className="admin-header__profile-info">
              <strong>{profile?.name || "Quản trị viên"}</strong>
              <span>{profile?.email || "admin@greenmarket.com"}</span>
            </div>

            <button
              type="button"
              className="admin-header__logout"
              onClick={handleLogout}
            >
              Đăng xuất
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
