import { Router } from "express";
import { verifyToken } from "../../middlewares/authMiddleware";
import {
    getEligiblePackages,
    getPublishedPackageById,
    getPublishedPackages,
    getShopVipPackage,
} from "../../controllers/user/promotion.controller";

const router = Router();

// Public endpoints
router.get("/packages", getPublishedPackages);
router.get("/packages/shop-vip", getShopVipPackage);
// Auth endpoint to return packages suitable for current account type
router.get("/packages/eligible", verifyToken, getEligiblePackages);
router.get("/packages/:id", getPublishedPackageById);

export default router;
