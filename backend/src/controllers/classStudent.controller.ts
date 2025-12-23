import { Request, Response } from "express";
import prisma from "@/lib/prisma";
import { getActiveYearTerm } from "@/utils/term";

export const enrollStudent = async (req: Request, res: Response) => {
  const studentId = Number(req.params.id);
  const { classId, sectionId } = req.body as { classId: number; sectionId?: number };
  if (!studentId || !classId) return res.status(400).json({ message: "studentId and classId are required" });

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return res.status(404).json({ message: "Student not found" });

  const { academicYearId, termId } = await getActiveYearTerm();
  const enrollment = await prisma.enrollment.create({
    data: {
      studentId,
      classId,
      sectionId: sectionId ?? null,
      academicYearId: academicYearId ?? (await prisma.academicYear.create({
        data: { name: `${new Date().getFullYear()}`, startDate: new Date(), endDate: new Date() },
      })).id,
      termId: termId ?? null,
    },
  });

  res.status(201).json({ data: enrollment });
};
