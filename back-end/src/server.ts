import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

import authRoutes from "./routes/auth.route.ts";
import categoryRoutes from "./routes/admin/category.route.ts";
import attributeRoutes from "./routes/admin/attribute.route";
import postRoutes from "./routes/admin/post.route";
import shopRoutes from "./routes/admin/shop.route";
import reportRoutes from "./routes/admin/report.route";
import adminUserRoutes from "./routes/admin/user.route.ts";
import userShopRoutes from "./routes/user/shop.route.ts";
import userPostRoutes from "./routes/user/post.route.ts";
import userReportRoutes from "./routes/user/report.route.ts";
import userCategoryRoutes from "./routes/user/category.route.ts";
import uploadRoutes from "./routes/upload.route.ts";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin/categories", categoryRoutes);
app.use("/api/admin/attributes", attributeRoutes);
app.use("/api/admin/posts", postRoutes);
app.use("/api/admin/shops", shopRoutes);
app.use("/api/admin/reports", reportRoutes);
app.use("/api/admin/users", adminUserRoutes);

// User Routes
app.use("/api/shops", userShopRoutes);
app.use("/api/posts", userPostRoutes);
app.use("/api/reports", userReportRoutes);
app.use("/api/categories", userCategoryRoutes);
app.use("/api/upload", uploadRoutes);

// Static files for uploads
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/", (req, res) => {
    res.send("API is running...");
});

app.listen(process.env.PORT || 5000, () => {
    console.log("Server running on port", process.env.PORT || 5000);
});