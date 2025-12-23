import { Router } from "express";
import { authenticate, requireRole } from "@/middlewares/auth.middleware";
import { validateBody } from "@/middlewares/validate.middleware";
import { create, list, remove, update } from "@/controllers/staff.controller";
import { staffCreateSchema, staffUpdateSchema } from "@/services/staff.service";

const router = Router();

router.use(authenticate);
router.use(requireRole(["Super Admin", "School Admin", "HR Officer"]));

router.get("/", list);
router.post("/", validateBody(staffCreateSchema), create);
router.put("/:id", validateBody(staffUpdateSchema), update);
router.delete("/:id", remove);

export default router;
