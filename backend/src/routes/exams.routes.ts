import { Router } from "express";
import { authenticate, requireRole } from "@/middlewares/auth.middleware";
import { addExamSubject, createExam, listExams, publishResults } from "@/controllers/exams.controller";

const router = Router();

router.use(authenticate);

router.get("/", requireRole(["Super Admin", "Academic Officer", "Teacher", "School Admin"]), listExams);
router.post("/", requireRole(["Super Admin", "Academic Officer", "Teacher", "School Admin"]), createExam);
router.post("/:id/subjects", requireRole(["Super Admin", "Academic Officer", "Teacher", "School Admin"]), addExamSubject);
router.post("/publish", requireRole(["Super Admin", "Academic Officer", "School Admin"]), publishResults);

export default router;
