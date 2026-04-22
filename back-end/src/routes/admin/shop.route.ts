import { Router } from "express";
import { getShops, createShop, getShopById, updateShopStatus, deleteShop, verifyShop } from "../../controllers/admin/shop.controller";
import { requireRoles } from "../../middlewares/authMiddleware";

const router = Router();

router.get("/", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), getShops);
router.post("/", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), createShop);
router.get("/:id", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), getShopById);
router.patch("/:id/status", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), updateShopStatus);
router.patch("/:id/verify", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), verifyShop);
router.delete("/:id", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), deleteShop);

export default router;
