import { Router } from "express";
import { authenticate, requireRole } from "@/middlewares/auth.middleware";
import { validateBody } from "@/middlewares/validate.middleware";
import { addSlot, getTimetable } from "@/controllers/timetable.controller";
import { slotCreateSchema } from "@/services/timetable.service";

const router = Router();

router.use(authenticate);
router.use(requireRole(["Super Admin", "School Admin", "Academic Officer"]));

router.get("/", getTimetable);
router.post("/slots", validateBody(slotCreateSchema), addSlot);

export default router;
