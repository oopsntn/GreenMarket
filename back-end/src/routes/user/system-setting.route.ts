import { Router } from "express";
import { getPublicSystemSettings } from "../../controllers/user/system-setting.controller";

const router = Router();

router.get("/public", getPublicSystemSettings);

export default router;
