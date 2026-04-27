import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { initSocket } from "./config/socket";

dotenv.config();

import authRoutes from "./routes/auth.route.ts";
import categoryRoutes from "./routes/admin/category.route.ts";
import attributeRoutes from "./routes/admin/attribute.route.ts";
import categoryMappingRoutes from "./routes/admin/category-mapping.route.ts";
import templateRoutes from "./routes/admin/template.route.ts";
import postRoutes from "./routes/admin/post.route.ts";
import shopRoutes from "./routes/admin/shop.route.ts";
import reportRoutes from "./routes/admin/report.route.ts";
import adminUserRoutes from "./routes/admin/user.route.ts";
import adminRoleRoutes from "./routes/admin/role.route.ts";
import adminBusinessRoleRoutes from "./routes/admin/business-role.route.ts";
import adminPlacementSlotRoutes from "./routes/admin/placement-slot.route.ts";
import adminPromotionPackageRoutes from "./routes/admin/promotion-package.route.ts";
import adminAccountPackageRoutes from "./routes/admin/account-package.route.ts";
import adminPromotionRoutes from "./routes/admin/promotion.route.ts";
import adminBoostedPostRoutes from "./routes/admin/boosted-post.route.ts";
import adminDashboardRoutes from "./routes/admin/dashboard.route.ts";
import adminAnalyticsRoutes from "./routes/admin/analytics.route.ts";
import adminRevenueRoutes from "./routes/admin/revenue.route.ts";
import adminCustomerSpendingRoutes from "./routes/admin/customer-spending.route.ts";
import adminExportRoutes from "./routes/admin/export.route.ts";
import adminSettingsRoutes from "./routes/admin/settings.route.ts";
import adminAIInsightRoutes from "./routes/admin/ai-insight.route.ts";
import adminActivityLogRoutes from "./routes/admin/activity-log.route.ts";
import adminNotificationRoutes from "./routes/admin/notification.route.ts";
import adminFinancialRoutes from "./routes/admin/financial.route.ts";
import adminCollaboratorRoutes from "./routes/admin/collaborator.route.ts";
import adminHostContentRoutes from "./routes/admin/host-content.route.ts";
import userShopRoutes from "./routes/user/shop.route.ts";
import userPostRoutes from "./routes/user/post.route.ts";
import userReportRoutes from "./routes/user/report.route.ts";
import userCategoryRoutes from "./routes/user/category.route.ts";
import userProfileRoutes from "./routes/user/profile.route.ts";
import userCollaboratorRoutes from "./routes/user/collaborator.route.ts";
import userManagerRoutes from "./routes/user/manager.route.ts";
import userOperationsRoutes from "./routes/user/operations.route.ts";
import userHostRoutes from "./routes/user/host.route.ts";
import userSystemSettingRoutes from "./routes/user/system-setting.route.ts";
import uploadRoutes from "./routes/upload.route.ts";
import userPromotionRoutes from "./routes/user/promotion.route.ts";
import userPaymentRoutes from "./routes/user/payment.route.ts";
import pricingConfigRoutes from "./routes/user/pricing-config.route.ts";
import userNotificationRoutes from "./routes/user/notification.route.ts";
import userSupportRoutes from "./routes/user/support.route.ts";
import { verifyToken, isAdmin } from "./middlewares/authMiddleware.ts";
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
app.use(
  "/api/admin/notifications",
  verifyToken,
  isAdmin,
  adminNotificationRoutes,
);
app.use("/api/admin/financial", verifyToken, isAdmin, adminFinancialRoutes);
app.use(
  "/api/admin/collaborators",
  verifyToken,
  isAdmin,
  adminCollaboratorRoutes,
);
app.use(
  "/api/admin/host-contents",
  verifyToken,
  isAdmin,
  adminHostContentRoutes,
);

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
app.use("/api/user/support", userSupportRoutes);

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
