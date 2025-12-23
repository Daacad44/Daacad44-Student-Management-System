import multer from "multer";
import { Router } from "express";
import { validateBody } from "@/middlewares/validate.middleware";
import { authenticate, requireRole } from "@/middlewares/auth.middleware";
import {
  listStudents,
  createStudent,
  importStudentsCsv,
  getStudent,
  updateStudent,
  deleteStudent,
  exportStudents,
  summary,
  enroll,
} from "@/controllers/students.controller";
import { studentCreateSchema, studentUpdateSchema } from "@/services/student.service";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.use(authenticate);

router.get("/", requireRole(["Super Admin", "School Admin", "Academic Officer", "Teacher"]), listStudents);
router.get("/summary", requireRole(["Super Admin", "School Admin", "Academic Officer", "Teacher"]), summary);
router.get("/export", requireRole(["Super Admin", "School Admin", "Academic Officer"]), exportStudents);
router.get("/:id", requireRole(["Super Admin", "School Admin", "Academic Officer", "Teacher"]), getStudent);
router.post("/", requireRole(["Super Admin", "School Admin", "Academic Officer"]), validateBody(studentCreateSchema), createStudent);
router.put("/:id", requireRole(["Super Admin", "School Admin", "Academic Officer"]), validateBody(studentUpdateSchema), updateStudent);
router.delete("/:id", requireRole(["Super Admin", "School Admin"]), deleteStudent);
router.post("/upload-csv", requireRole(["Super Admin", "School Admin"]), upload.single("file"), importStudentsCsv);
router.post("/:id/enroll", requireRole(["Super Admin", "School Admin", "Academic Officer"]), enroll);

export default router;
