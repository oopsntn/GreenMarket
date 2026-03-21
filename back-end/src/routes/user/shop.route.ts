import { Router } from "express";
import { registerShop, getMyShop, getPublicShopById } from "../../controllers/user/shop.controller.ts";

const router = Router();

router.post("/register", registerShop);
router.get("/my-shop", getMyShop);
router.get("/:id", getPublicShopById);

export default router;
