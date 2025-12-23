import { Router } from "express";
import { authenticate, requireRole } from "@/middlewares/auth.middleware";
import { validateBody } from "@/middlewares/validate.middleware";
import {
  listSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from "@/controllers/subjects.controller";
import { subjectCreateSchema, subjectUpdateSchema } from "@/services/subject.service";

const router = Router();

router.use(authenticate);
router.use(requireRole(["Super Admin", "School Admin", "Academic Officer"]));

router.get("/", listSubjects);
router.post("/", validateBody(subjectCreateSchema), createSubject);
router.put("/:id", validateBody(subjectUpdateSchema), updateSubject);
router.delete("/:id", deleteSubject);

export default router;
