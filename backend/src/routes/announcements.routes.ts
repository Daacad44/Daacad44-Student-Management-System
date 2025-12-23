import { Router } from "express";
import { authenticate, requireRole } from "@/middlewares/auth.middleware";
import { validateBody } from "@/middlewares/validate.middleware";
import { create, list, remove } from "@/controllers/announcements.controller";
import { announcementCreateSchema } from "@/services/announcement.service";

const router = Router();

router.use(authenticate);
router.use(requireRole(["Super Admin", "School Admin", "Academic Officer", "Teacher"]));

router.get("/", list);
router.post("/", validateBody(announcementCreateSchema), create);
router.delete("/:id", remove);

export default router;
