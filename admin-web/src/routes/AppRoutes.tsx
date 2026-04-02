import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import ActivityLogPage from "../pages/ActivityLogPage";
import AIInsightsPage from "../pages/AIInsightsPage";
import AnalyticsPage from "../pages/AnalyticsPage";
import AttributesPage from "../pages/AttributesPage";
import BoostedPostsPage from "../pages/BoostedPostsPage";
import CategoriesPage from "../pages/CategoriesPage";
import CategoryAttributeMappingPage from "../pages/CategoryAttributeMappingPage";
import CustomerSpendingPage from "../pages/CustomerSpendingPage";
import DashboardPage from "../pages/DashboardPage";
import ExportPage from "../pages/ExportPage";
import LoginPage from "../pages/LoginPage";
import PlacementSlotsPage from "../pages/PlacementSlotsPage";
import PromotionPackagesPage from "../pages/PromotionPackagesPage";
import PromotionsPage from "../pages/PromotionsPage";
import RevenuePage from "../pages/RevenuePage";
import SettingsPage from "../pages/SettingsPage";
import ShopsPage from "../pages/ShopsPage";
import TemplateBuilderPage from "../pages/TemplateBuilderPage";
import TemplatesPage from "../pages/TemplatesPage";
import UsersPage from "../pages/UsersPage";
import { hasActiveAdminSession } from "../utils/adminSession";

function ProtectedAdminRoute() {
  return hasActiveAdminSession() ? <Outlet /> : <Navigate to="/login" replace />;
}

function PublicOnlyRoute() {
  return hasActiveAdminSession() ? <Navigate to="/dashboard" replace /> : <Outlet />;
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
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="activity-log" element={<ActivityLogPage />} />
            <Route path="shops" element={<ShopsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="attributes" element={<AttributesPage />} />
            <Route
              path="category-attributes"
              element={<CategoryAttributeMappingPage />}
            />
            <Route path="templates" element={<TemplatesPage />} />
            <Route path="template-builder" element={<TemplateBuilderPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="placement-slots" element={<PlacementSlotsPage />} />
            <Route
              path="promotion-packages"
              element={<PromotionPackagesPage />}
            />
            <Route path="boosted-posts" element={<BoostedPostsPage />} />
            <Route path="promotions" element={<PromotionsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="ai-insights" element={<AIInsightsPage />} />
            <Route path="revenue" element={<RevenuePage />} />
            <Route
              path="customer-spending"
              element={<CustomerSpendingPage />}
            />
            <Route path="export" element={<ExportPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
