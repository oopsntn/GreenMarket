import { Router } from "express";
import { getShops, createShop, getShopById, updateShopStatus, deleteShop } from "../../controllers/admin/shop.controller";

const router = Router();

router.get("/", getShops);
router.post("/", createShop);
router.get("/:id", getShopById);
router.patch("/:id/status", updateShopStatus);
router.delete("/:id", deleteShop);

export default router;
