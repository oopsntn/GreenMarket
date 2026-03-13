import { Router } from "express";
import { getUsers, getUserById, updateUserStatus } from "../../controllers/admin/user.controller.ts";

const router = Router();

router.get("/", getUsers);
router.get("/:id", getUserById);
router.patch("/:id/status", updateUserStatus);

export default router;
