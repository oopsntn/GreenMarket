import { Router } from "express";
import { registerShop, getMyShop } from "../../controllers/user/shop.controller.ts";

const router = Router();

router.post("/register", registerShop);
router.get("/my-shop", getMyShop);

export default router;
