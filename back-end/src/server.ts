import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

import authRoutes from "./routes/auth.route.ts";
import adminCategoryRoutes from "./routes/admin/category.route.ts";
import adminAttributeRoutes from "./routes/admin/attribute.route.ts";
import adminProductRoutes from "./routes/admin/product.route.ts";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/admin/categories", adminCategoryRoutes);
app.use("/api/admin/attributes", adminAttributeRoutes);
app.use("/api/admin/products", adminProductRoutes);

app.get("/", (req, res) => {
    res.send("API is running...");
});

app.listen(process.env.PORT || 5000, () => {
    console.log("Server running on port", process.env.PORT || 5000);
});