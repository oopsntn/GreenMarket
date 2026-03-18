import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import AnalyticsPage from "../pages/AnalyticsPage";
import AttributesPage from "../pages/AttributesPage";
import CategoriesPage from "../pages/CategoriesPage";
import CategoryAttributeMappingPage from "../pages/CategoryAttributeMappingPage";
import CustomerSpendingPage from "../pages/CustomerSpendingPage";
import DashboardPage from "../pages/DashboardPage";
import ExportPage from "../pages/ExportPage";
import LoginPage from "../pages/LoginPage";
import PromotionsPage from "../pages/PromotionsPage";
import RevenuePage from "../pages/RevenuePage";
import SettingsPage from "../pages/SettingsPage";
import TemplatesPage from "../pages/TemplatesPage";
import UsersPage from "../pages/UsersPage";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="attributes" element={<AttributesPage />} />
          <Route
            path="category-attributes"
            element={<CategoryAttributeMappingPage />}
          />
          <Route path="templates" element={<TemplatesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="promotions" element={<PromotionsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="revenue" element={<RevenuePage />} />
          <Route path="customer-spending" element={<CustomerSpendingPage />} />
          <Route path="export" element={<ExportPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
