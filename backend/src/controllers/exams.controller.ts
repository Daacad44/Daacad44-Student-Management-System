import { Request, Response } from "express";
import prisma from "@/lib/prisma";
import { getOrCreateActiveYearTerm } from "@/utils/term";
import { ExamStatus } from "@prisma/client";

export const listExams = async (_req: Request, res: Response) => {
  const exams = await prisma.exam.findMany({
    orderBy: { id: "desc" },
    include: {
      term: { include: { academicYear: true } },
      subjects: { include: { subject: true, class: true } },
    },
  });
  res.json({ data: exams });
};

export const createExam = async (req: Request, res: Response) => {
  const { name, termId, status, date } = req.body as {
    name?: string;
    termId?: number;
    status?: ExamStatus;
    date?: string;
  };
  if (!name) return res.status(400).json({ message: "name is required" });

  const resolvedTermId = termId ?? (await getOrCreateActiveYearTerm()).termId;
  const exam = await prisma.exam.create({
    data: {
      name,
      termId: resolvedTermId,
      status: status ?? ExamStatus.SCHEDULED,
      date: date ? new Date(date) : undefined,
    },
  });
  res.status(201).json({ data: exam });
};

export const addExamSubject = async (req: Request, res: Response) => {
  const examId = Number(req.params.id);
  const { subjectId, classId, maxMarks, passMarks } = req.body as {
    subjectId?: number;
    classId?: number;
    maxMarks?: number;
    passMarks?: number;
  };
  if (!examId || !subjectId || !classId || !maxMarks || !passMarks) {
    return res.status(400).json({ message: "examId, subjectId, classId, maxMarks, passMarks are required" });
  }

  const existing = await prisma.examSubject.findFirst({
    where: { examId, subjectId, classId },
  });
  const examSubject = existing
    ? await prisma.examSubject.update({
        where: { id: existing.id },
        data: { maxMarks, passMarks },
      })
    : await prisma.examSubject.create({
        data: { examId, subjectId, classId, maxMarks, passMarks },
      });

  res.status(201).json({ data: examSubject });
};

export const publishResults = async (req: Request, res: Response) => {
  const { examId } = req.body as { examId?: number };
  if (!examId) return res.status(400).json({ message: "examId is required" });
  await prisma.exam.update({ where: { id: examId }, data: { status: ExamStatus.PUBLISHED } });
  res.status(200).json({ message: "Results published" });
};
