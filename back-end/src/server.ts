import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { initSocket } from "./config/socket";

dotenv.config();

import authRoutes from "./routes/auth.route";
import categoryRoutes from "./routes/admin/category.route";
import attributeRoutes from "./routes/admin/attribute.route";
import categoryMappingRoutes from "./routes/admin/category-mapping.route";
import templateRoutes from "./routes/admin/template.route";
import templateBuilderRoutes from "./routes/admin/template-builder.route";
import postRoutes from "./routes/admin/post.route";
import shopRoutes from "./routes/admin/shop.route";
import reportRoutes from "./routes/admin/report.route";
import adminUserRoutes from "./routes/admin/user.route";
import adminRoleRoutes from "./routes/admin/role.route";
import adminBusinessRoleRoutes from "./routes/admin/business-role.route";
import adminPlacementSlotRoutes from "./routes/admin/placement-slot.route";
import adminPromotionPackageRoutes from "./routes/admin/promotion-package.route";
import adminAccountPackageRoutes from "./routes/admin/account-package.route";
import adminPromotionRoutes from "./routes/admin/promotion.route";
import adminBoostedPostRoutes from "./routes/admin/boosted-post.route";
import adminDashboardRoutes from "./routes/admin/dashboard.route";
import adminAnalyticsRoutes from "./routes/admin/analytics.route";
import adminRevenueRoutes from "./routes/admin/revenue.route";
import adminCustomerSpendingRoutes from "./routes/admin/customer-spending.route";
import adminExportRoutes from "./routes/admin/export.route";
import adminSettingsRoutes from "./routes/admin/settings.route";
import adminAIInsightRoutes from "./routes/admin/ai-insight.route";
import adminActivityLogRoutes from "./routes/admin/activity-log.route";
import adminFinancialRoutes from "./routes/admin/financial.route";
import userShopRoutes from "./routes/user/shop.route";
import userPostRoutes from "./routes/user/post.route";
import userReportRoutes from "./routes/user/report.route";
import userCategoryRoutes from "./routes/user/category.route";
import userProfileRoutes from "./routes/user/profile.route";
import userCollaboratorRoutes from "./routes/user/collaborator.route";
import userManagerRoutes from "./routes/user/manager.route";
import userOperationsRoutes from "./routes/user/operations.route";
import userHostRoutes from "./routes/user/host.route";
import userSystemSettingRoutes from "./routes/user/system-setting.route";
import uploadRoutes from "./routes/upload.route";
import userPromotionRoutes from "./routes/user/promotion.route";
import userPaymentRoutes from "./routes/user/payment.route";
import pricingConfigRoutes from "./routes/user/pricing-config.route";
import userNotificationRoutes from "./routes/user/notification.route";
import { verifyToken, isAdmin } from "./middlewares/authMiddleware";
import path from "path";
import "./services/promotionScheduler.ts";

const app = express();

// Harden CORS
const serverIp = process.env.IP || "localhost";
const protocol = process.env.PROTOCOL || (serverIp === "localhost" ? "http" : "http"); 
const whitelist = [
  "http://localhost:5173",
  "http://localhost:5174",
  `${protocol}://${serverIp}:5173`,
  `${protocol}://${serverIp}:5174`,
  `${protocol}://${serverIp}`,
  `${protocol}://${serverIp}:8080`,
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin/categories", verifyToken, isAdmin, categoryRoutes);
app.use("/api/admin/attributes", verifyToken, isAdmin, attributeRoutes);
app.use(
  "/api/admin/category-mappings",
  verifyToken,
  isAdmin,
  categoryMappingRoutes,
);
app.use("/api/admin/templates", verifyToken, isAdmin, templateRoutes);
app.use(
  "/api/admin/template-builder",
  verifyToken,
  isAdmin,
  templateBuilderRoutes,
);
app.use("/api/admin/posts", verifyToken, isAdmin, postRoutes);
app.use("/api/admin/shops", verifyToken, isAdmin, shopRoutes);
app.use("/api/admin/reports", verifyToken, isAdmin, reportRoutes);
app.use("/api/admin/users", verifyToken, isAdmin, adminUserRoutes);
app.use("/api/admin/roles", verifyToken, isAdmin, adminRoleRoutes);
app.use(
  "/api/admin/business-roles",
  verifyToken,
  isAdmin,
  adminBusinessRoleRoutes,
);
app.use(
  "/api/admin/placement-slots",
  verifyToken,
  isAdmin,
  adminPlacementSlotRoutes,
);
app.use(
  "/api/admin/promotion-packages",
  verifyToken,
  isAdmin,
  adminPromotionPackageRoutes,
);
app.use(
  "/api/admin/account-packages",
  verifyToken,
  isAdmin,
  adminAccountPackageRoutes,
);
app.use("/api/admin/promotions", verifyToken, isAdmin, adminPromotionRoutes);
app.use(
  "/api/admin/boosted-posts",
  verifyToken,
  isAdmin,
  adminBoostedPostRoutes,
);
app.use("/api/admin/dashboard", verifyToken, isAdmin, adminDashboardRoutes);
app.use("/api/admin/analytics", verifyToken, isAdmin, adminAnalyticsRoutes);
app.use("/api/admin/revenue", verifyToken, isAdmin, adminRevenueRoutes);
app.use(
  "/api/admin/customer-spending",
  verifyToken,
  isAdmin,
  adminCustomerSpendingRoutes,
);
app.use("/api/admin/exports", verifyToken, isAdmin, adminExportRoutes);
app.use("/api/admin/settings", verifyToken, isAdmin, adminSettingsRoutes);
app.use("/api/admin/ai-insights", verifyToken, isAdmin, adminAIInsightRoutes);
app.use(
  "/api/admin/activity-logs",
  verifyToken,
  isAdmin,
  adminActivityLogRoutes,
);
app.use("/api/admin/financial", verifyToken, isAdmin, adminFinancialRoutes);

// User Routes
app.use("/api/shops", userShopRoutes);
app.use("/api/posts", userPostRoutes);
app.use("/api/reports", userReportRoutes);
app.use("/api/categories", userCategoryRoutes);
app.use("/api/profile", userProfileRoutes);
app.use("/api/settings", userSystemSettingRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/promotions", userPromotionRoutes);
app.use("/api/payment", userPaymentRoutes);
app.use("/api/collaborator", userCollaboratorRoutes);
app.use("/api/manager", userManagerRoutes);
app.use("/api/operations", userOperationsRoutes);
app.use("/api/host", userHostRoutes);
app.use("/api/pricing-config", pricingConfigRoutes);
app.use("/api/notifications", userNotificationRoutes);

// Static files for uploads
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/", (_req, res) => {
  res.send("API is running...");
});

// Create HTTP Server for Socket.io
const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
