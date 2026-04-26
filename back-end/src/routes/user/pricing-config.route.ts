import { Router } from "express";
import { getPricingConfig } from "../../controllers/user/pricing-config.controller";

const router = Router();

// Public — no auth required
router.get("/", getPricingConfig);

export default router;
