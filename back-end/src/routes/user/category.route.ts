import { Router } from "express";
import { getCategories, getCategoryAttributes } from "../../controllers/user/category.controller";

const router = Router();

router.get("/", getCategories);
router.get("/:id/attributes", getCategoryAttributes);

export default router;
