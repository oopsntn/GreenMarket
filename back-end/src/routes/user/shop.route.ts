import { Router } from "express";
import { 
    registerShop, getMyShop, getOwnerDashboard, getPublicShopById, recordShopContactClick, updateShop, getAllShops,
    requestVerificationOTP, verifyShopEmail, addShopPhone, deleteShopPhone, deletePendingShop, setPrimaryPhone
} from "../../controllers/user/shop.controller.ts";
import { optionalVerifyToken, verifyToken } from "../../middlewares/authMiddleware.ts";

const router = Router();

// Public routes
router.get("/browse", getAllShops);

// Protected routes (JWT required)
router.post("/register", verifyToken, registerShop);
router.get("/my-shop", verifyToken, getMyShop);
router.delete("/pending", verifyToken, deletePendingShop);
router.get("/dashboard", verifyToken, getOwnerDashboard);


// Verification & Phone routes
router.post("/verify/request", verifyToken, requestVerificationOTP);
router.post("/verify/email", verifyToken, verifyShopEmail);
router.post("/phones", verifyToken, addShopPhone);
router.delete("/phones", verifyToken, deleteShopPhone);
router.patch("/phones/primary", verifyToken, setPrimaryPhone);

router.patch("/:id", verifyToken, updateShop);
router.post("/:id/contact-click", recordShopContactClick);

// Public route with path param must stay after static paths like /my-shop
router.get("/:id", optionalVerifyToken, getPublicShopById);

export default router;
