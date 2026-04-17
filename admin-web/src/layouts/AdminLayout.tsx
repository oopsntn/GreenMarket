import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { getVisibleAdminMenuGroups } from "../utils/adminPermissions";
import { clearAdminSession, getAdminProfile } from "../utils/adminSession";
import AdminNotificationListener from "../components/AdminNotificationListener";
import "./AdminLayout.css";

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const profile = getAdminProfile();
  const menuGroups = getVisibleAdminMenuGroups(profile);

  const activeGroupId = useMemo(
    () =>
      menuGroups.find((group) =>
        group.items.some((item) => location.pathname.startsWith(item.path)),
      )?.id ?? menuGroups[0]?.id ?? "",
    [location.pathname, menuGroups],
  );

  const [expandedGroupIds, setExpandedGroupIds] = useState<string[]>(() =>
    menuGroups[0]?.id ? [menuGroups[0].id] : [],
  );

  const toggleGroup = (groupId: string) => {
    setExpandedGroupIds((previous) =>
      previous.includes(groupId)
        ? previous.filter((item) => item !== groupId)
        : [...previous, groupId],
    );
  };

  const handleLogout = () => {
    clearAdminSession();
    navigate("/login", { replace: true });
  };

  return (
    <div className="admin-layout">
      <AdminNotificationListener />
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <h2>GreenMarket</h2>
          <span>Trang quản trị vận hành</span>
        </div>

        <nav className="admin-sidebar__nav" aria-label="Điều hướng quản trị">
          {menuGroups.map((group) => {
            const isExpanded =
              expandedGroupIds.includes(group.id) || group.id === activeGroupId;

            return (
              <section key={group.id} className="admin-sidebar__group">
                <button
                  type="button"
                  className={`admin-sidebar__group-toggle${
                    isExpanded ? " admin-sidebar__group-toggle--expanded" : ""
                  }`}
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={isExpanded}
                >
                  <div className="admin-sidebar__group-toggle-copy">
                    <strong>{group.label}</strong>
                    <span>{group.description}</span>
                  </div>
                  <span className="admin-sidebar__group-toggle-icon">▾</span>
                </button>

                <div
                  className={`admin-sidebar__group-panel${
                    isExpanded ? " admin-sidebar__group-panel--expanded" : ""
                  }`}
                >
                  <div className="admin-sidebar__group-links">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                          isActive
                            ? "admin-sidebar__link admin-sidebar__link--active"
                            : "admin-sidebar__link"
                        }
                      >
                        <span className="admin-sidebar__link-title">
                          {item.label}
                        </span>
                        <span className="admin-sidebar__link-hint">
                          {item.hint}
                        </span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              </section>
            );
          })}
        </nav>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <div>
            <h1>Quản trị GreenMarket</h1>
            <p>Điều hành marketplace cây cảnh theo từng nhóm chức năng rõ ràng.</p>
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
