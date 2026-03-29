import { Router } from "express";
import { requireRoles } from "../../middlewares/authMiddleware";
import {
    getAttributes,
    createAttribute,
    updateAttribute,
    deleteAttribute,
} from "../../controllers/admin/attribute.controller";

const router = Router();

router.get("/", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), getAttributes);
router.post("/", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), createAttribute);
router.put("/:id", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), updateAttribute);
router.delete("/:id", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), deleteAttribute);

export default router;
