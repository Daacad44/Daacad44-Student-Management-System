import { Request, Response } from "express";
import prisma from "@/lib/prisma";
import { AttendanceStatus, InvoiceStatus } from "@prisma/client";

export const summary = async (_req: Request, res: Response) => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const todayStr = now.toISOString().slice(0, 10);

  const [
    totalStudents,
    totalStaff,
    newStudentsThisYear,
    newStaffThisMonth,
    invoiceAgg,
    paymentAgg,
    paidCount,
    partialCount,
    overdueCount,
    todaySessions,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.staff.count(),
    prisma.enrollment.count({ where: { createdAt: { gte: startOfYear } } }),
    prisma.staff.count({ where: { joinDate: { gte: startOfMonth } } }),
    prisma.invoice.aggregate({ _sum: { total: true } }),
    prisma.payment.aggregate({ _sum: { amount: true } }),
    prisma.invoice.count({ where: { status: InvoiceStatus.PAID } }),
    prisma.invoice.count({ where: { status: InvoiceStatus.PARTIAL } }),
    prisma.invoice.count({ where: { status: InvoiceStatus.OVERDUE } }),
    prisma.attendanceSession.findMany({
      where: { date: { gte: new Date(todayStr), lt: new Date(todayStr + "T23:59:59.999Z") } },
      include: { records: true },
    }),
  ]);

  let attendancePercent: number | null = null;
  let weeklyAttendance: { day: string; present: number; total: number }[] = [];

  // Today's attendance percent
  if (todaySessions.length) {
    const total = todaySessions.reduce((acc, s) => acc + s.records.length, 0);
    const present = todaySessions.reduce(
      (acc, s) => acc + s.records.filter((r) => r.status === AttendanceStatus.PRESENT).length,
      0,
    );
    attendancePercent = total > 0 ? Math.round((present / total) * 100) : null;
  }

  // Last 5 days attendance (for chart)
  const fiveDaysAgo = new Date(now);
  fiveDaysAgo.setDate(now.getDate() - 4);
  const sessions = await prisma.attendanceSession.findMany({
    where: { date: { gte: fiveDaysAgo } },
    include: { records: true },
    orderBy: { date: "asc" },
  });
  const dayMap = new Map<string, { present: number; total: number }>();
  sessions.forEach((s) => {
    const day = s.date.toISOString().slice(0, 10);
    const total = s.records.length;
    const present = s.records.filter((r) => r.status === AttendanceStatus.PRESENT).length;
    const prev = dayMap.get(day) || { present: 0, total: 0 };
    dayMap.set(day, { present: prev.present + present, total: prev.total + total });
  });
  weeklyAttendance = Array.from(dayMap.entries()).map(([day, val]) => ({
    day,
    present: val.total > 0 ? Math.round((val.present / val.total) * 100) : 0,
    total: val.total,
  }));

  const totalBilled = Number(invoiceAgg._sum.total ?? 0);
  const collected = Number(paymentAgg._sum.amount ?? 0);
  const pending = Math.max(totalBilled - collected, 0);

  res.json({
    students: { total: totalStudents, newThisYear: newStudentsThisYear },
    staff: { total: totalStaff, newThisMonth: newStaffThisMonth },
    attendance: { todayPercent: attendancePercent, weekly: weeklyAttendance },
    finance: {
      totalBilled,
      collected,
      pending,
      paidCount,
      partialCount,
      overdueCount,
    },
  });
};
