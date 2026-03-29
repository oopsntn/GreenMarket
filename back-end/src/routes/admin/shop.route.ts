import { Router } from "express";
import { getShops, createShop, getShopById, updateShopStatus, deleteShop, verifyShop } from "../../controllers/admin/shop.controller.ts";
import { requireRoles } from "../../middlewares/authMiddleware.ts";

const router = Router();

router.get("/", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_MODERATOR"), getShops);
router.post("/", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_MODERATOR"), createShop);
router.get("/:id", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_MODERATOR"), getShopById);
router.patch("/:id/status", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_MODERATOR"), updateShopStatus);
router.patch("/:id/verify", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_MODERATOR"), verifyShop);
router.delete("/:id", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_MODERATOR"), deleteShop);

export default router;
