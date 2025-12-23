import { Request, Response } from "express";
import prisma from "@/lib/prisma";
import { AttendanceStatus } from "@prisma/client";

export const createSession = async (req: Request, res: Response) => {
  const { date, classId, sectionId, takenById } = req.body;
  if (!date || !classId) return res.status(400).json({ message: "date and classId are required" });
  const session = await prisma.attendanceSession.create({
    data: {
      date: new Date(date),
      classId,
      sectionId: sectionId ?? null,
      takenById: takenById ?? null,
    },
  });
  res.status(201).json({ data: session });
};

export const saveRecords = async (req: Request, res: Response) => {
  const sessionId = Number(req.params.id);
  const records = req.body.records as { studentId: number; status: AttendanceStatus; note?: string }[];
  if (!sessionId || !Array.isArray(records)) return res.status(400).json({ message: "Invalid payload" });

  // upsert per student
  await Promise.all(
    records.map((r) =>
      prisma.attendanceRecord.upsert({
        where: { sessionId_studentId: { sessionId, studentId: r.studentId } },
        update: { status: r.status, note: r.note },
        create: { sessionId, studentId: r.studentId, status: r.status, note: r.note },
      }),
    ),
  );

  res.json({ message: "Saved" });
};

export const getReport = async (req: Request, res: Response) => {
  const { classId, from, to } = req.query;
  const where: any = {};
  if (classId) where.classId = Number(classId);
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from as string);
    if (to) where.date.lte = new Date(to as string);
  }
  const sessions = await prisma.attendanceSession.findMany({
    where,
    include: { records: true },
    orderBy: { date: "desc" },
  });

  const summary = sessions.map((s) => {
    const total = s.records.length;
    const present = s.records.filter((r) => r.status === AttendanceStatus.PRESENT).length;
    return {
      sessionId: s.id,
      date: s.date,
      classId: s.classId,
      sectionId: s.sectionId,
      present,
      total,
      percent: total ? Math.round((present / total) * 100) : 0,
    };
  });

  res.json({ data: summary });
};
