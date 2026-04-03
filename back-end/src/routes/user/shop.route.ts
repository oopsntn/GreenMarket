import { Router } from "express";
import { 
    registerShop, getMyShop, getPublicShopById, updateShop, getAllShops,
    requestVerificationOTP, verifyShopEmail, addShopPhone, deleteShopPhone
} from "../../controllers/user/shop.controller.ts";
import { verifyToken } from "../../middlewares/authMiddleware.ts";

const router = Router();

// Public routes
router.get("/browse", getAllShops);

// Protected routes (JWT required)
router.post("/register", verifyToken, registerShop);
router.get("/my-shop", verifyToken, getMyShop);

// Verification & Phone routes
router.post("/verify/request", verifyToken, requestVerificationOTP);
router.post("/verify/email", verifyToken, verifyShopEmail);
router.post("/phones", verifyToken, addShopPhone);
router.delete("/phones", verifyToken, deleteShopPhone);

router.patch("/:id", verifyToken, updateShop);

// Public route with path param must stay after static paths like /my-shop
router.get("/:id", getPublicShopById);

export default router;
