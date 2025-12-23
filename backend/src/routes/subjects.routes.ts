import { Router } from "express";
import { authenticate, requireRole } from "@/middlewares/auth.middleware";
import { validateBody } from "@/middlewares/validate.middleware";
import { create, list, remove, update } from "@/controllers/subjects.controller";
import { subjectCreateSchema, subjectUpdateSchema } from "@/services/subject.service";

const router = Router();

router.use(authenticate);
router.use(requireRole(["Super Admin", "School Admin", "Academic Officer"]));

router.get("/", list);
router.post("/", validateBody(subjectCreateSchema), create);
router.put("/:id", validateBody(subjectUpdateSchema), update);
router.delete("/:id", remove);

export default router;
