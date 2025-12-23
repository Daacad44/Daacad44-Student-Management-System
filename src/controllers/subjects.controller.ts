import { Request, Response } from "express";
import * as subjectService from "@/services/subject.service";

export const listSubjects = async (_req: Request, res: Response) => {
  const data = await subjectService.listSubjects();
  res.json({ data });
};

export const createSubject = async (req: Request, res: Response) => {
  try {
    const subject = await subjectService.createSubject(req.body);
    res.status(201).json({ data: subject });
  } catch (err: any) {
    const message = err?.message || "Failed to create subject";
    const status = err?.status || 500;
    res.status(status).json({ message });
  }
};

export const updateSubject = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const subject = await subjectService.updateSubject(id, req.body);
    res.json({ data: subject });
  } catch (err: any) {
    const message = err?.message || "Failed to update subject";
    const status = err?.status || 500;
    res.status(status).json({ message });
  }
};

export const deleteSubject = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await subjectService.deleteSubject(id);
    res.status(204).send();
  } catch (err: any) {
    const message = err?.message || "Failed to delete subject";
    const status = err?.status || 500;
    res.status(status).json({ message });
  }
};
