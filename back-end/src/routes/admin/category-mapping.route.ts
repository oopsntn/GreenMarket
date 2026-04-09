import { Router } from "express";
import { requireRoles } from "../../middlewares/authMiddleware.ts";
import {
  createCategoryMapping,
  deleteCategoryMapping,
  getCategoryMappings,
  updateCategoryMapping,
  updateCategoryMappingStatus,
} from "../../controllers/admin/category-mapping.controller.ts";

const router = Router();

router.get(
  "/",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  getCategoryMappings,
);
router.post(
  "/",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  createCategoryMapping,
);
router.put(
  "/:categoryId/:attributeId",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  updateCategoryMapping,
);
router.patch(
  "/:categoryId/:attributeId/status",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  updateCategoryMappingStatus,
);
router.delete(
  "/:categoryId/:attributeId",
  requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"),
  deleteCategoryMapping,
);

export default router;
