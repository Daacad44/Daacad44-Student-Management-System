import { Router } from "express";
import authRoutes from "@/routes/auth.routes";
import studentRoutes from "@/routes/students.routes";
import attendanceRoutes from "@/routes/attendance.routes";
import financeRoutes from "@/routes/finance.routes";
import examRoutes from "@/routes/exams.routes";
import userRoutes from "@/routes/users.routes";
import staffRoutes from "@/routes/staff.routes";
import dashboardRoutes from "@/routes/dashboard.routes";
import classesRoutes from "@/routes/classes.routes";
import timetableRoutes from "@/routes/timetable.routes";
import subjectRoutes from "@/routes/subjects.routes";
import announcementRoutes from "@/routes/announcements.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/students", studentRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/finance", financeRoutes);
router.use("/exams", examRoutes);
router.use("/staff", staffRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/classes", classesRoutes);
router.use("/timetable", timetableRoutes);
router.use("/subjects", subjectRoutes);
router.use("/announcements", announcementRoutes);

export default router;
