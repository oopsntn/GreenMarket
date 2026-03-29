import { Router } from "express";
import { requireRoles } from "../../middlewares/authMiddleware";

import {
    getPlacementSlots,
    getPlacementSlotById,
    createPlacementSlot,
    updatePlacementSlot,
    deletePlacementSlot,
} from "../../controllers/admin/placement-slot.controller";

const router = Router();

router.get("/", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), getPlacementSlots);

router.get("/:id", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), getPlacementSlotById);

router.post("/", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), createPlacementSlot);

router.put("/:id", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), updatePlacementSlot);

router.delete("/:id", requireRoles("ROLE_SUPER_ADMIN", "ROLE_ADMIN"), deletePlacementSlot);

export default router;
