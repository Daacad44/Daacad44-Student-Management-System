import { Router } from "express";
import { authenticate, requireRole } from "@/middlewares/auth.middleware";
import { validateBody } from "@/middlewares/validate.middleware";
import { assignClassSubject, create, createSection, list } from "@/controllers/class.controller";
import { assignClassSubjectSchema, classCreateSchema, sectionCreateSchema } from "@/services/class.service";

const router = Router();

router.use(authenticate);
router.use(requireRole(["Super Admin", "School Admin", "Academic Officer"]));

router.get("/", list);
router.post("/", validateBody(classCreateSchema), create);
router.post("/sections", validateBody(sectionCreateSchema), createSection);
router.post("/subjects", validateBody(assignClassSubjectSchema), assignClassSubject);

export default router;
