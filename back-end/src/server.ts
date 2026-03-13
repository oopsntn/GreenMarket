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

app.get("/", (req, res) => {
    res.send("API is running...");
});

app.listen(process.env.PORT || 5000, () => {
    console.log("Server running on port", process.env.PORT || 5000);
});