import { Router } from "express";
import { registerShop, getMyShop, getPublicShopById, updateShop, getAllShops } from "../../controllers/user/shop.controller.ts";
import { verifyToken } from "../../middlewares/authMiddleware.ts";

const router = Router();

// Public routes
router.get("/browse", getAllShops);

// Protected routes (JWT required)
router.post("/register", verifyToken, registerShop);
router.get("/my-shop", verifyToken, getMyShop);
router.patch("/:id", verifyToken, updateShop);

// Public dynamic route must stay after static routes like /my-shop
router.get("/:id", getPublicShopById);

export default router;
