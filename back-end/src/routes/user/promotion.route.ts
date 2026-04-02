import { Router } from "express";

import {
    getPublishedPackages,
    getPublishedPackageById,
} from "../../controllers/user/promotion.controller";

const router = Router();

// Public endpoints — no auth required
router.get("/packages", getPublishedPackages);

router.get("/packages/:id", getPublishedPackageById);

export default router;
