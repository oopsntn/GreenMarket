import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import ActivityLogPage from "../pages/ActivityLogPage";
import AccountPackagesPage from "../pages/AccountPackagesPage";
import AccountPackageTrackingPage from "../pages/AccountPackageTrackingPage";
import AIInsightsPage from "../pages/AIInsightsPage";
import AnalyticsPage from "../pages/AnalyticsPage";
import AttributesPage from "../pages/AttributesPage";
import BoostedPostsPage from "../pages/BoostedPostsPage";
import CategoriesPage from "../pages/CategoriesPage";
import CategoryAttributeMappingPage from "../pages/CategoryAttributeMappingPage";
import CustomerSpendingPage from "../pages/CustomerSpendingPage";
import DashboardPage from "../pages/DashboardPage";
import ExportPage from "../pages/ExportPage";
import FinancialPage from "../pages/FinancialPage";
import HostContentsPage from "../pages/HostContentsPage";
import LoginPage from "../pages/LoginPage";
import PlacementSlotsPage from "../pages/PlacementSlotsPage";
import PostsModerationPage from "../pages/PostsModerationPage";
import PromotionPackagesPage from "../pages/PromotionPackagesPage";
import PromotionsPage from "../pages/PromotionsPage";
import ReportsModerationPage from "../pages/ReportsModerationPage";
import RevenuePage from "../pages/RevenuePage";
import RolesManagementPage from "../pages/RolesManagementPage";
import SettingsPage from "../pages/SettingsPage";
import ShopsPage from "../pages/ShopsPage";
import TemplatesPage from "../pages/TemplatesPage";
import UserNotificationsPage from "../pages/UserNotificationsPage";
import UsersPage from "../pages/UsersPage";
import {
  canAccessAdminModule,
  getDefaultAdminPath,
  type AdminModuleKey,
} from "../utils/adminPermissions";
import {
  getAdminProfile,
  hasActiveAdminSession,
} from "../utils/adminSession";

function ProtectedAdminRoute() {
  return hasActiveAdminSession() ? <Outlet /> : <Navigate to="/login" replace />;
}

function PublicOnlyRoute() {
  const profile = getAdminProfile();

  return hasActiveAdminSession() ? (
    <Navigate to={getDefaultAdminPath(profile)} replace />
  ) : (
    <Outlet />
  );
}

function AdminIndexRoute() {
  const profile = getAdminProfile();
  return <Navigate to={getDefaultAdminPath(profile)} replace />;
}

type ProtectedModuleRouteProps = Readonly<{
  moduleKey: AdminModuleKey;
}>;

function ProtectedModuleRoute({ moduleKey }: ProtectedModuleRouteProps) {
  const profile = getAdminProfile();

  return canAccessAdminModule(profile, moduleKey) ? (
    <Outlet />
  ) : (
    <Navigate to={getDefaultAdminPath(profile)} replace />
  );
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedAdminRoute />}>
          <Route path="/" element={<AdminLayout />}>
            <Route index element={<AdminIndexRoute />} />

            <Route element={<ProtectedModuleRoute moduleKey="dashboard" />}>
              <Route path="dashboard" element={<DashboardPage />} />
            </Route>

            <Route element={<ProtectedModuleRoute moduleKey="users" />}>
              <Route path="users" element={<UsersPage />} />
            </Route>

            <Route
              element={<ProtectedModuleRoute moduleKey="userNotifications" />}
            >
              <Route
                path="user-notifications"
                element={<UserNotificationsPage />}
              />
            </Route>

            <Route element={<ProtectedModuleRoute moduleKey="activityLog" />}>
              <Route path="activity-log" element={<ActivityLogPage />} />
            </Route>

            <Route
              element={<ProtectedModuleRoute moduleKey="postsModeration" />}
            >
              <Route
                path="posts-moderation"
                element={<PostsModerationPage />}
              />
            </Route>

            <Route
              element={<ProtectedModuleRoute moduleKey="reportsModeration" />}
            >
              <Route
                path="reports-moderation"
                element={<ReportsModerationPage />}
              />
            </Route>

            <Route
              element={<ProtectedModuleRoute moduleKey="hostContents" />}
            >
              <Route path="host-contents" element={<HostContentsPage />} />
            </Route>

            <Route
              element={<ProtectedModuleRoute moduleKey="rolesManagement" />}
            >
              <Route
                path="roles-management"
                element={<RolesManagementPage />}
              />
            </Route>

            <Route element={<ProtectedModuleRoute moduleKey="shops" />}>
              <Route path="shops" element={<ShopsPage />} />
            </Route>

            <Route element={<ProtectedModuleRoute moduleKey="categories" />}>
              <Route path="categories" element={<CategoriesPage />} />
            </Route>

            <Route element={<ProtectedModuleRoute moduleKey="attributes" />}>
              <Route path="attributes" element={<AttributesPage />} />
            </Route>

            <Route
              element={<ProtectedModuleRoute moduleKey="categoryMapping" />}
            >
              <Route
                path="category-attributes"
                element={<CategoryAttributeMappingPage />}
              />
            </Route>

            <Route element={<ProtectedModuleRoute moduleKey="templates" />}>
              <Route path="templates" element={<TemplatesPage />} />
            </Route>

            <Route element={<ProtectedModuleRoute moduleKey="settings" />}>
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            <Route
              element={<ProtectedModuleRoute moduleKey="accountPackages" />}
            >
              <Route
                path="account-packages"
                element={<AccountPackagesPage />}
              />
            </Route>

            <Route
              element={
                <ProtectedModuleRoute moduleKey="accountPackageTracking" />
              }
            >
              <Route
                path="account-package-tracking"
                element={<AccountPackageTrackingPage />}
              />
            </Route>

            <Route
              element={<ProtectedModuleRoute moduleKey="placementSlots" />}
            >
              <Route path="placement-slots" element={<PlacementSlotsPage />} />
            </Route>

            <Route
              element={<ProtectedModuleRoute moduleKey="promotionPackages" />}
            >
              <Route
                path="promotion-packages"
                element={<PromotionPackagesPage />}
              />
            </Route>

            <Route
              element={<ProtectedModuleRoute moduleKey="boostedPosts" />}
            >
              <Route path="boosted-posts" element={<BoostedPostsPage />} />
            </Route>

            <Route element={<ProtectedModuleRoute moduleKey="promotions" />}>
              <Route path="promotions" element={<PromotionsPage />} />
            </Route>

            <Route element={<ProtectedModuleRoute moduleKey="analytics" />}>
              <Route path="analytics" element={<AnalyticsPage />} />
            </Route>

            <Route element={<ProtectedModuleRoute moduleKey="aiInsights" />}>
              <Route path="ai-insights" element={<AIInsightsPage />} />
            </Route>

            <Route element={<ProtectedModuleRoute moduleKey="revenue" />}>
              <Route path="revenue" element={<RevenuePage />} />
            </Route>

            <Route element={<ProtectedModuleRoute moduleKey="financial" />}>
              <Route path="financial" element={<FinancialPage />} />
            </Route>

            <Route
              element={<ProtectedModuleRoute moduleKey="customerSpending" />}
            >
              <Route
                path="customer-spending"
                element={<CustomerSpendingPage />}
              />
            </Route>

            <Route element={<ProtectedModuleRoute moduleKey="export" />}>
              <Route path="export" element={<ExportPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
