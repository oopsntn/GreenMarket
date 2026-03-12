import { Router } from "express";
import {
    getProducts,
    createProduct,
    getProductById,
    deleteProduct,
} from "../../controllers/admin/product.controller";

const router = Router();

router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/", createProduct);
// router.put("/:id", updateProduct); // Will implement update later if needed
router.delete("/:id", deleteProduct);

export default router;
