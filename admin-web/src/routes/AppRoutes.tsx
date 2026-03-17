import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import AttributesPage from "../pages/AttributesPage";
import CategoriesPage from "../pages/CategoriesPage";
import CategoryAttributeMappingPage from "../pages/CategoryAttributeMappingPage";
import DashboardPage from "../pages/DashboardPage";
import LoginPage from "../pages/LoginPage";
import PlaceholderPage from "../pages/PlaceholderPage";
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
          <Route
            path="promotions"
            element={<PlaceholderPage title="Promotions Management" />}
          />
          <Route
            path="analytics"
            element={<PlaceholderPage title="Analytics Dashboard" />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
