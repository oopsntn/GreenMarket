import { Router } from "express";
import { getShops, createShop, getShopById, updateShopStatus, deleteShop, verifyShop } from "../../controllers/admin/shop.controller.ts";

const router = Router();

router.get("/", getShops);
router.post("/", createShop);
router.get("/:id", getShopById);
router.patch("/:id/status", updateShopStatus);
router.patch("/:id/verify", verifyShop);
router.delete("/:id", deleteShop);

export default router;
