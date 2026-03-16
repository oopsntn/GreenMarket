import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import DashboardPage from "../pages/DashboardPage";
import LoginPage from "../pages/LoginPage";
import PlaceholderPage from "../pages/PlaceholderPage";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route
            path="users"
            element={<PlaceholderPage title="Users Management" />}
          />
          <Route
            path="categories"
            element={<PlaceholderPage title="Categories Management" />}
          />
          <Route
            path="attributes"
            element={<PlaceholderPage title="Attributes Management" />}
          />
          <Route
            path="templates"
            element={<PlaceholderPage title="Templates Management" />}
          />
          <Route
            path="settings"
            element={<PlaceholderPage title="System Settings" />}
          />
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
