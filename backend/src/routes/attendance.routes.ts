import { Router } from "express";
import { authenticate, requireRole } from "@/middlewares/auth.middleware";
import { createSession, getReport, saveRecords } from "@/controllers/attendance.controller";

const router = Router();

router.use(authenticate);

router.post("/sessions", requireRole(["Super Admin", "Teacher", "Academic Officer", "School Admin"]), createSession);
router.post("/sessions/:id/records", requireRole(["Super Admin", "Teacher", "Academic Officer", "School Admin"]), saveRecords);
router.get("/reports", requireRole(["Super Admin", "Teacher", "Academic Officer", "School Admin"]), getReport);

export default router;
