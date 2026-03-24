import { Router } from "express";
import { registerShop, getMyShop, getPublicShopById, updateShop } from "../../controllers/user/shop.controller.ts";

const router = Router();

router.post("/register", registerShop);
router.get("/my-shop", getMyShop);
router.get("/:id", getPublicShopById);
router.patch("/:id", updateShop);

export default router;
