import { Request, Response } from "express";
import * as studentService from "@/services/student.service";
import { enrollStudent } from "@/services/student.service";

export const listStudents = async (req: Request, res: Response) => {
  const students = await studentService.listStudents({
    search: (req.query.search as string) || undefined,
    status: (req.query.status as string) || undefined,
    classId: req.query.classId ? Number(req.query.classId) : undefined,
    page: req.query.page ? Number(req.query.page) : undefined,
    pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
  });
  res.json(students);
};

export const createStudent = async (req: Request, res: Response) => {
  try {
    const student = await studentService.createStudent(req.body);
    res.status(201).json({ data: student });
  } catch (err: any) {
    const message = err?.message || "Failed to create student";
    const status = err?.status || 500;
    res.status(status).json({ message });
  }
};

export const importStudentsCsv = async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: "CSV file is required" });
  }

  const result = await studentService.importStudentsFromCsv(file.buffer);
  res.status(201).json({
    message: "Students imported",
    ...result,
  });
};

export const getStudent = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const student = await studentService.getStudentById(id);
  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }
  res.json({ data: student });
};

export const summary = async (_req: Request, res: Response) => {
  const data = await studentService.studentSummary();
  res.json(data);
};

export const updateStudent = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const updated = await studentService.updateStudent(id, req.body);
    res.json({ data: updated });
  } catch (err: any) {
    const message = err?.message || "Failed to update student";
    const status = err?.status || 500;
    res.status(status).json({ message });
  }
};

export const deleteStudent = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await studentService.deleteStudent(id);
  res.status(204).send();
};

export const enroll = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { classId, sectionId } = req.body;
  if (!classId) return res.status(400).json({ message: "classId is required" });
  const data = await enrollStudent(id, Number(classId), sectionId ? Number(sectionId) : undefined);
  res.status(201).json({ data });
};

export const exportStudents = async (req: Request, res: Response) => {
  const format = (req.query.format as string) === "xlsx" ? "xlsx" : "csv";
  const result = await studentService.exportStudents(format);
  res.setHeader("Content-Type", result.contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
  res.send(result.data);
};
